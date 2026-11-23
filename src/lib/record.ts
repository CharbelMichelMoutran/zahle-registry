import { POSTING_COLOUR, type Assessment } from "./atc20";
import type { Colour, Report } from "./report";

/**
 * A building's whole record, as both maps show it: engineer reports and EMT
 * assessments together, newest first (plan.md item 25).
 */
export type RecordEntry =
  | { kind: "report"; id: string; at: string; report: Report }
  | { kind: "assessment"; id: string; at: string; assessment: Assessment };

/** Claude's stored debrief of the record, as the API returns it. */
export type Debrief = { text: string; record_count: number; created_at: string };

/**
 * Newest first. A report counts on its inspection day; an assessment on the day
 * it was saved (Beirut time). Same day: the one saved later. Matches building_colours().
 */
export function mergedRecord(reports: Report[], assessments: Assessment[]): RecordEntry[] {
  const beirutDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Beirut" });
  const entries: (RecordEntry & { day?: string })[] = [
    ...reports.map((r) => ({ kind: "report" as const, id: r.id, at: r.created_at, day: r.report_date, report: r })),
    ...assessments.map((a) => ({ kind: "assessment" as const, id: a.id, at: a.created_at, day: beirutDay(a.created_at), assessment: a })),
  ];
  return entries
    .sort((x, y) => y.day!.localeCompare(x.day!) || y.at.localeCompare(x.at));
}

export const entryColour = (e: RecordEntry): Colour =>
  e.kind === "report" ? e.report.colour : POSTING_COLOUR[e.assessment.posting];

export const latestColour = (reports: Report[], assessments: Assessment[]): Colour | undefined => {
  const latest = mergedRecord(reports, assessments)[0];
  return latest && entryColour(latest);
};
