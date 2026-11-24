import "server-only";
import { POSTINGS, type Posting, type Rating } from "./atc20";
import type { BuildingFacts } from "./priority";
import { shadeOf } from "./record";
import type { Colour } from "./report";
import { createServerSupabase } from "./supabase-server";

/**
 * Everything the priority formula and the "Ask" filters read, per building with
 * at least one record (plan.md item 29). The registry is small, so the whole
 * record is read and filtered in the server's memory; at city scale this would
 * move into a database function with the same fields.
 */

type ReportRow = {
  building_id: string;
  colour: Colour;
  report_date: string;
  created_at: string;
  residents_count: number | null;
  construction_year: number | null;
  roof_observation: string | null;
  columns_observation: string | null;
  foundations_observation: string | null;
  final_observation: string | null;
  details: unknown;
};

type AssessmentRow = {
  building_id: string;
  posting: Posting;
  claude_posting: Posting | null;
  claude_confidence: number | null;
  stopped_reason: string | null;
  created_at: string;
  facts: { buildingName?: string; street?: string; floors?: string; construction?: string[]; occupancy?: string[]; peopleInside?: string } | null;
  items: Record<string, { rating?: Rating | null }> | null;
  damage: string | null;
  visit: string | null;
};

const beirutDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Beirut" });

/** Every string inside a value (the engineer report's details), for word searches. */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

const whole = (s: string | undefined) => {
  const n = Number.parseInt(s ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export async function loadBuildingFacts(): Promise<BuildingFacts[]> {
  const supabase = createServerSupabase();
  const [reports, assessments] = await Promise.all([
    supabase
      .from("reports")
      .select(
        "building_id, colour, report_date, created_at, residents_count, construction_year, roof_observation, columns_observation, foundations_observation, final_observation, details",
      )
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<ReportRow[]>(),
    supabase
      .from("assessments")
      .select(
        "building_id, posting, claude_posting, claude_confidence, stopped_reason, created_at, facts:data->facts, items:data->items, damage:data->>damage, visit:data->>visit",
      )
      .order("created_at", { ascending: false })
      .returns<AssessmentRow[]>(),
  ]);
  if (reports.error) throw new Error(`loadBuildingFacts reports: ${reports.error.message}`);
  if (assessments.error) throw new Error(`loadBuildingFacts assessments: ${assessments.error.message}`);

  const byId = new Map<string, BuildingFacts>();
  const entry = (id: string) => {
    let b = byId.get(id);
    if (!b) byId.set(id, (b = { id, name: "", report: null, emt: null, reportCount: 0, assessmentCount: 0 }));
    return b;
  };

  // Rows come newest first, so the first row per building is its latest.
  for (const r of reports.data) {
    const b = entry(r.building_id);
    b.reportCount++;
    const text = [r.roof_observation, r.columns_observation, r.foundations_observation, r.final_observation, ...strings(r.details)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!b.report) {
      b.report = {
        colour: r.colour,
        shade: shadeOf({ colour: r.colour, day: r.report_date }),
        day: r.report_date,
        at: r.created_at,
        residents: r.residents_count,
        constructionYear: r.construction_year,
        text,
      };
    } else {
      b.report.text += ` ${text}`;
    }
  }

  for (const a of assessments.data) {
    const b = entry(a.building_id);
    b.assessmentCount++;
    if (b.emt) continue;
    b.name = (a.facts?.buildingName || a.facts?.street || "").trim().slice(0, 80);
    const items: Record<string, Rating> = {};
    for (const [id, x] of Object.entries(a.items ?? {})) if (x?.rating) items[id] = x.rating;
    b.emt = {
      posting: a.posting,
      claudePosting: a.claude_posting && (POSTINGS as readonly string[]).includes(a.claude_posting) ? a.claude_posting : null,
      claudeConfidence: a.claude_confidence,
      stopped: a.stopped_reason !== null,
      reinspection: a.visit === "re-inspection",
      damage: a.damage ?? "",
      floors: whole(a.facts?.floors),
      construction: a.facts?.construction ?? [],
      occupancy: a.facts?.occupancy ?? [],
      peopleInside: whole(a.facts?.peopleInside),
      items,
      day: beirutDay(a.created_at),
      at: a.created_at,
    };
  }

  return [...byId.values()];
}
