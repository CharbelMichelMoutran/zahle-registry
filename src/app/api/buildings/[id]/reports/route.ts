import { after, type NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import type { Assessment } from "@/lib/atc20";
import { debriefIsStale, latestDebrief, refreshDebrief } from "@/lib/debrief";
import { visitorHash } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  reportConstructionDate,
  todayParts,
  toPayload,
  validateReport,
  type Report,
  type ReportInput,
} from "@/lib/report";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A photo path the photo route wrote: `<building id>/<uuid>.jpg`. */
const PHOTO_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/i;
const MAX_BODY_BYTES = 128 * 1024; // the longest valid engineer report, in Arabic, is about 90 KB of text

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * One building's record: engineer reports (newest first), construction-date
 * changes, EMT assessments (newest first) and Claude's debrief. A debrief that
 * no longer covers every record is rewritten after the response (plan.md item 25).
 */
export const maxDuration = 60;

export async function GET(req: NextRequest, ctx: RouteContext<"/api/buildings/[id]/reports">) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json({ error: "Unknown building." }, 404);

  const supabase = createServerSupabase();
  const [reports, changes, assessments, debrief] = await Promise.all([
    supabase
      .from("reports")
      .select("*")
      .eq("building_id", id)
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("construction_date_changes")
      .select("*")
      .eq("building_id", id)
      .order("changed_at", { ascending: false }),
    supabase
      .from("assessments")
      .select("id, building_id, inspector_name, posting, claude_posting, claude_confidence, overrode_claude, stopped_reason, data, photos, created_at")
      .eq("building_id", id)
      .order("created_at", { ascending: false }),
    latestDebrief(id).catch((err: Error) => {
      console.error(err.message);
      return null;
    }),
  ]);

  if (reports.error || changes.error || assessments.error) {
    console.error("load reports failed:", reports.error?.message ?? changes.error?.message ?? assessments.error?.message);
    return json({ error: "Could not load reports." }, 500);
  }
  const reportRows = reports.data as Report[];
  const assessmentRows = assessments.data as Assessment[];
  if (debriefIsStale(debrief, reportRows.length + assessmentRows.length)) {
    after(() => refreshDebrief(id, reportRows, assessmentRows));
  }
  return json({ reports: reportRows, changes: changes.data, assessments: assessmentRows, debrief });
}

const DB_ERRORS: Record<string, [number, string]> = {
  BUILDING_NOT_FOUND: [404, "This building is not in the registry."],
  RATE_LIMITED: [429, "Too many reports saved from here recently. Please wait an hour and try again."],
  STALE_PREFILL: [
    409,
    "Another report was saved for this building while you were writing. Your text is kept. Check the construction date, then save again.",
  ],
  FUTURE_DATE: [422, "The date of report cannot be in the future."],
  // Raised only until migration 20261118000100_report_freedom is applied.
  CHANGE_REASON_REQUIRED: [422, "Add a reason for the new construction date."],
  NOT_APPROVED: [403, "Your account is waiting for approval."],
};

/** Save a new report. Reports are never edited or deleted, so there is no PUT or DELETE. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/buildings/[id]/reports">) {
  // Who wrote the report comes from the session, never from the request body.
  const { engineer, denied } = await requireEngineer(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json({ error: "Unknown building." }, 404);

  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return json({ error: "This report is too large." }, 413);
  }

  let input: ReportInput;
  try {
    input = JSON.parse(raw) as ReportInput;
    if (typeof input !== "object" || input === null || typeof input.observations !== "object") throw new Error();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const supabase = createServerSupabase();

  // Validate against the construction date the form was prefilled from.
  const latest = await supabase
    .from("reports")
    .select("*")
    .eq("building_id", id)
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Report>();
  if (latest.error) return json({ error: "Could not save the report. Please try again." }, 500);

  let result: ReturnType<typeof validateReport>;
  let payload: ReturnType<typeof toPayload> | null = null;
  try {
    // The latest calendar day anywhere (UTC+14), so a valid local "today" is accepted.
    result = validateReport(
      input,
      latest.data ? reportConstructionDate(latest.data) : null,
      todayParts("Pacific/Kiritimati"),
    );
    // Only the rating is required (owner, 17 Nov 2026); the rest is checked against limits only.
    if (Object.keys(result.errors).length === 0) payload = toPayload(id, input, result.constructionChanged);
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!payload) {
    return json({ error: "Some fields need attention.", fields: result.errors }, 422);
  }
  // Photos are stored under the building they were taken for.
  if (payload.photos.some((p) => !PHOTO_PATH.test(p) || !p.startsWith(`${id}/`))) {
    return json({ error: "Invalid request." }, 400);
  }
  const { data, error } = await supabase.rpc("create_report", {
    p: payload,
    p_engineer_id: engineer.id,
    p_ip_hash: visitorHash(req.headers),
  });

  if (error) {
    const known = DB_ERRORS[error.message];
    if (known) return json({ error: known[1], code: error.message }, known[0]);
    console.error("create_report failed:", error.message);
    return json({ error: "Could not save the report. Please try again." }, 500);
  }

  const { report, duplicate } = data as { report: Report; duplicate: boolean };
  return json({ report }, duplicate ? 200 : 201);
}
