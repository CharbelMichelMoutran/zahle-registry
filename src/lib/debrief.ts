import "server-only";
import { ITEMS, POSTING_LABEL, RATING_LABEL, type Assessment } from "./atc20";
import { CLAUDE_MODEL, claude, writeDebrief } from "./claude";
import { CLASSIFICATION, detailsSummary } from "./engineer-report";
import type { Report } from "./report";
import { createServerSupabase } from "./supabase-server";

/** Claude's short debrief of a building's whole record (plan.md item 25). */
export type Debrief = { text: string; record_count: number; created_at: string };

const RATING_WORD = { green: "Good condition", yellow: "Needs some work", red: "Imminent risk" } as const;

/** The record as plain text for Claude, newest first. */
function recordText(reports: Report[], assessments: Assessment[]): string {
  const rows: { at: string; text: string }[] = [];
  for (const r of reports) {
    const notes = [
      r.final_observation && `Overall: ${r.final_observation}`,
      r.roof_observation && `Roof: ${r.roof_observation}`,
      r.columns_observation && `Columns: ${r.columns_observation}`,
      r.foundations_observation && `Foundations: ${r.foundations_observation}`,
    ].filter(Boolean);
    rows.push({
      at: `${r.report_date}T${r.created_at.slice(11)}`,
      text: r.details
        ? `${r.report_date}, engineer report ${r.report_number ?? ""} by ${r.engineer_name}:\n${detailsSummary(r.details, {
            classification: CLASSIFICATION[r.colour],
            remarks: r.final_observation,
          })}`
        : `${r.report_date}, engineer report by ${r.engineer_name}: ${RATING_WORD[r.colour]}. ${notes.join(" ")}`,
    });
  }
  for (const a of assessments) {
    const d = a.data;
    const damage = ITEMS.filter((i) => {
      const rating = d.items?.[i.id]?.rating;
      return rating === "moderate" || rating === "severe";
    }).map((i) => `${i.label} ${RATING_LABEL[d.items[i.id].rating!]}`);
    rows.push({
      at: a.created_at,
      text: `${a.created_at.slice(0, 10)}, EMT safety assessment by ${a.inspector_name}: posted ${POSTING_LABEL[a.posting]}${
        a.stopped_reason ? ` (stopped at a danger: ${a.stopped_reason})` : ""
      }. Damage: ${damage.join("; ") || "none recorded"}. ${d.restrictions ? `Restrictions: ${d.restrictions}.` : ""} ${
        d.comments ? `Comments: ${d.comments}` : ""
      }`,
    });
  }
  return rows
    .sort((x, y) => y.at.localeCompare(x.at))
    .map((r) => r.text.slice(0, 1500))
    .join("\n");
}

export async function latestDebrief(buildingId: string): Promise<Debrief | null> {
  const { data, error } = await createServerSupabase()
    .from("building_debriefs")
    .select("text, record_count, created_at")
    .eq("building_id", buildingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Debrief>();
  if (error) throw new Error(`latestDebrief: ${error.message}`);
  return data;
}

/** True when the record has grown since the last debrief, and Claude is connected. */
export function debriefIsStale(debrief: Debrief | null, recordCount: number) {
  return recordCount > 0 && claude() !== null && (debrief === null || debrief.record_count !== recordCount);
}

/** Write and store a fresh debrief. Runs after the response, so nobody waits for it. */
export async function refreshDebrief(buildingId: string, reports: Report[], assessments: Assessment[]) {
  try {
    const text = await writeDebrief(recordText(reports, assessments));
    if (!text) return;
    const { error } = await createServerSupabase()
      .from("building_debriefs")
      .insert({ building_id: buildingId, text, record_count: reports.length + assessments.length, model: CLAUDE_MODEL });
    if (error) console.error("save debrief failed:", error.message);
  } catch (err) {
    console.error("refreshDebrief failed:", err instanceof Error ? err.message : err);
  }
}
