/**
 * The engineer's "Ask" and the volunteer's "Near me", as the screens see them
 * (plan.md item 29). The filter and the ranking live on the server
 * (lib/query-filter.ts, lib/priority.ts).
 */

/** Ready-made searches that work without Claude (owner, Q7 and Q23). */
export const QUERY_PRESETS = [
  { id: "priority", label: "Priority list" },
  { id: "unsafe", label: "Unsafe by a volunteer" },
  { id: "unreviewed", label: "Not reviewed by an engineer" },
  { id: "overrode", label: "Volunteer overrode Claude" },
  { id: "stale", label: "Green over 6 months" },
] as const;

export type QueryPreset = (typeof QUERY_PRESETS)[number]["id"];

export const isQueryPreset = (v: unknown): v is QueryPreset => QUERY_PRESETS.some((p) => p.id === v);

/** One building in a result list. Every word is written by the app from the record. */
export type QueryRow = {
  id: string;
  name: string;
  line: string;
  /** Why it ranks where it does (lib/priority.ts). */
  reason: string;
  /** "Engineer report since: green, 25 Nov" when an engineer has reported after the volunteer. */
  note: string | null;
  people: number | null;
  /** The volunteer chose a lower posting than Claude: shown as a warning. */
  downgraded: boolean;
};

export type QueryResult = {
  /** How the question was read, in plain words. */
  reading: string;
  total: number;
  rows: QueryRow[];
};

/** "Near me" (owner, Q24): not visited in this long, or never. */
export const NEAR_ME_WINDOWS = [
  { id: "week", label: "1 week", days: 7 },
  { id: "month", label: "1 month", days: 30 },
  { id: "half-year", label: "6 months", days: 182 },
  { id: "year", label: "1 year", days: 365 },
] as const;

export const NEAR_ME_COUNT = 20;
