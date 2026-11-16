import { MONTHS, NOT_YET_VERIFIED } from "./content";
import type { ConstructionDate, Report } from "./report";

/** "2026-11-16" -> "16/11/2026" (day/month/year, as engineers in Lebanon write it). */
export function formatDate(isoDate: string) {
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Save time in Beirut, e.g. "16/11/2026, 14:05". */
export function formatSaveTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Beirut",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

/** First line of a text, cut at about `max` characters with "...". */
export function firstLine(text: string, max = 120) {
  const line = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const chars = [...line.trim()];
  return chars.length > max ? chars.slice(0, max).join("").trimEnd() + "..." : chars.join("");
}

export function formatConstructionDate(c: ConstructionDate) {
  if (c.notVerified || c.year === null) return NOT_YET_VERIFIED;
  const base = c.month ? `${MONTHS[c.month - 1]} ${c.year}` : String(c.year);
  return c.approximate ? `${base} (approximate)` : base;
}

export function sortNewestFirst(reports: Report[]) {
  return [...reports].sort(
    (a, b) =>
      b.report_date.localeCompare(a.report_date) || b.created_at.localeCompare(a.created_at),
  );
}
