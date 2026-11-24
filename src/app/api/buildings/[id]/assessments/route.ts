import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import { ASSESSMENT_LIMITS, cleanConfidence, POSTINGS, type Assessment, type Draft, type Posting } from "@/lib/atc20";
import { createServerSupabase } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 200_000;
/** Assessments per stand-in account per hour: a guard against spam on the open link. */
const PER_HOUR = 30;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const isPosting = (v: unknown): v is Posting => typeof v === "string" && (POSTINGS as readonly string[]).includes(v);

/**
 * Save one EMT assessment. Added only, never edited (plan rule 5). A stopped
 * assessment is saved as Unsafe. The EMT's posting always stands: Claude's is
 * kept beside it, and nothing is refused for disagreeing with Claude.
 */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/buildings/[id]/assessments">) {
  const { engineer, denied } = await requireEngineer(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return json({ error: "Unknown building." }, 404);

  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return json({ error: "This assessment is too large." }, 413);
  let draft: Draft;
  try {
    draft = JSON.parse(raw).draft;
    if (!draft || typeof draft !== "object" || typeof draft.items !== "object" || !Array.isArray(draft.photos)) throw new Error();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (draft.buildingId !== id || typeof draft.clientRequestId !== "string" || !UUID.test(draft.clientRequestId)) {
    return json({ error: "Invalid request." }, 400);
  }

  const posting: Posting | null = draft.stopped ? "unsafe" : isPosting(draft.posting) ? draft.posting : null;
  if (!posting) return json({ error: "Choose a posting before saving." }, 422);
  const claudePosting = isPosting(draft.claudePosting?.posting) ? draft.claudePosting.posting : null;
  const photos = draft.photos.map((p) => p?.path).filter((p): p is string => typeof p === "string");
  if (photos.length > ASSESSMENT_LIMITS.photos || photos.some((p) => !p.startsWith(`${id}/`))) {
    return json({ error: "Invalid request." }, 400);
  }

  const supabase = createServerSupabase();

  // Saved before (a retried request): return that record, unchanged.
  const existing = await supabase
    .from("assessments")
    .select("*")
    .eq("client_request_id", draft.clientRequestId)
    .maybeSingle<Assessment>();
  if (existing.error) return json({ error: "Could not save the assessment. Please try again." }, 500);
  if (existing.data) return json({ assessment: existing.data });

  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const recent = await supabase
    .from("assessments")
    .select("*", { count: "exact", head: true })
    .eq("engineer_id", engineer.id)
    .gte("created_at", since);
  if ((recent.count ?? 0) >= PER_HOUR) {
    return json({ error: "Too many assessments saved from this map recently. Please wait an hour and try again." }, 429);
  }

  const building = await supabase.from("buildings").select("id").eq("id", id).maybeSingle();
  if (building.error) return json({ error: "Could not save the assessment. Please try again." }, 500);
  if (!building.data) return json({ error: "This building is not in the registry." }, 404);

  // Who did it comes from the account, never from the request body.
  const saved: Draft = { ...draft, inspector: engineer.fullName, posting };
  const { data, error } = await supabase
    .from("assessments")
    .insert({
      building_id: id,
      engineer_id: engineer.id,
      inspector_name: engineer.fullName,
      posting,
      claude_posting: claudePosting,
      claude_confidence: claudePosting ? cleanConfidence(draft.claudePosting?.confidence) : null,
      overrode_claude: claudePosting !== null && claudePosting !== posting,
      stopped_reason: draft.stopped ? String(draft.stopped.check).slice(0, 300) : null,
      data: saved,
      photos,
      client_request_id: draft.clientRequestId,
    })
    .select("*")
    .single<Assessment>();
  if (error) {
    console.error("save assessment failed:", error.message);
    return json({ error: "Could not save the assessment. Please try again." }, 500);
  }
  return json({ assessment: data }, 201);
}
