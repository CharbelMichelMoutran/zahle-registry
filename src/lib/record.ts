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

const beirutDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Beirut" });

/**
 * Newest first. A report counts on its inspection day; an assessment on the day
 * it was saved (Beirut time). Same day: the one saved later. Matches building_colours().
 */
export function mergedRecord(reports: Report[], assessments: Assessment[]): RecordEntry[] {
  const entries: (RecordEntry & { day?: string })[] = [
    ...reports.map((r) => ({ kind: "report" as const, id: r.id, at: r.created_at, day: r.report_date, report: r })),
    ...assessments.map((a) => ({ kind: "assessment" as const, id: a.id, at: a.created_at, day: beirutDay(a.created_at), assessment: a })),
  ];
  return entries
    .sort((x, y) => y.day!.localeCompare(x.day!) || y.at.localeCompare(x.at));
}

export const entryColour = (e: RecordEntry): Colour =>
  e.kind === "report" ? e.report.colour : POSTING_COLOUR[e.assessment.posting];

/** One record as the map needs it: its colour and the day it counts from. */
export type MapEntry = { colour: Colour; day: string; at: string };
/** A building's latest engineer report and latest EMT posting, as building_map_records() sends them. */
export type MapRecord = { report: MapEntry | null; emt: MapEntry | null };

/** A colour as the map draws it: a green older than 6 months is "stale", drawn dark grey. */
export type Shade = Colour | "stale";
/**
 * How a building is drawn (owner, 23 Nov 2026, plan.md item 26). The fill comes
 * from the latest engineer report. An EMT posting newer than that report only
 * colours the outline; a newer report takes over the whole building again.
 */
export type MapLook = { fill: Shade | null; outline: Shade | null };

const STALE_AFTER_MONTHS = 6;

/** Today's date in Beirut, YYYY-MM-DD. */
export const beirutToday = () => beirutDay(new Date().toISOString());

/** Green fades to dark grey 6 months after its day, so nothing reads as safe forever. Yellow and red never fade. */
export function shadeOf(e: Pick<MapEntry, "colour" | "day">, today = beirutToday()): Shade {
  if (e.colour !== "green") return e.colour;
  const fades = new Date(`${e.day}T00:00:00Z`);
  fades.setUTCMonth(fades.getUTCMonth() + STALE_AFTER_MONTHS);
  return fades.toISOString().slice(0, 10) <= today ? "stale" : "green";
}

/** Same order as mergedRecord(): the later day wins, then the later save. Checked against today in Beirut. */
export function mapLook({ report, emt }: MapRecord): MapLook | undefined {
  if (!report && !emt) return undefined;
  const today = beirutToday();
  const emtNewer = !!emt && (!report || emt.day > report.day || (emt.day === report.day && emt.at > report.at));
  return { fill: report && shadeOf(report, today), outline: emtNewer ? shadeOf(emt, today) : null };
}

/** The map's view of a record the panel already holds, so the map stays in step after a load or a save. */
export function mapRecordOf(reports: Report[], assessments: Assessment[]): MapRecord {
  const merged = mergedRecord(reports, assessments);
  const r = merged.find((e) => e.kind === "report");
  const a = merged.find((e) => e.kind === "assessment");
  return {
    report: r?.kind === "report" ? { colour: r.report.colour, day: r.report.report_date, at: r.at } : null,
    emt: a?.kind === "assessment" ? { colour: POSTING_COLOUR[a.assessment.posting], day: beirutDay(a.at), at: a.at } : null,
  };
}

export const sameLook = (a: MapLook | undefined, b: MapLook | undefined) => a?.fill === b?.fill && a?.outline === b?.outline;
