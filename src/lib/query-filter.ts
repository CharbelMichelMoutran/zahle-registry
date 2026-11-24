import "server-only";
import { z } from "zod";
import {
  CONSTRUCTION,
  DAMAGE_ESTIMATES,
  isDowngrade,
  ITEM_BY_ID,
  ITEMS,
  OCCUPANCY,
  POSTING_LABEL,
  POSTINGS,
  RATING_LABEL,
  RATINGS,
} from "./atc20";
import { comparePriority, lastVisit, peopleInside, priorityReason, unreviewed, type BuildingFacts } from "./priority";
import type { QueryPreset, QueryRow } from "./query";
import { shadeOf } from "./record";
import { formatDate } from "./format";

/**
 * The engineer's "Ask" (plan.md item 21 and 29). Claude turns a question into
 * this filter, never into database code; the server checks it against the
 * schema and applies it here. The ranking is lib/priority.ts.
 */

const nullableNumber = (what: string) => z.number().nullable().describe(what);
const day = (what: string) => z.string().nullable().describe(`${what}, YYYY-MM-DD, or null`);

const MAP_SHADES = ["green", "yellow", "red", "stale", "not_inspected"] as const;

export const FilterSchema = z.object({
  mapColour: z
    .array(z.enum(MAP_SHADES))
    .describe(
      "The building's colour on the map today, from its newest record. 'stale' = green older than 6 months (shown dark grey). 'not_inspected' = no record at all. Empty = any colour",
    ),
  engineer: z
    .object({
      colour: z.array(z.enum(["green", "yellow", "red"])).describe("Latest engineer report's rating. Empty = any"),
      from: day("Report date on or after"),
      to: day("Report date on or before"),
      builtFrom: nullableNumber("Construction year at least"),
      builtTo: nullableNumber("Construction year at most"),
      mentions: z.array(z.string()).describe("Words that must all appear in the engineer reports' written observations"),
    })
    .nullable()
    .describe("Conditions on the latest engineer report. Null = no condition. Not null = the building must have an engineer report"),
  volunteer: z
    .object({
      posting: z.array(z.enum(POSTINGS)).describe("Latest volunteer (EMT) posting: inspected = green, restricted = yellow, unsafe = red. Empty = any"),
      from: day("Assessment date on or after"),
      to: day("Assessment date on or before"),
      claude: z
        .enum(["any", "agreed", "disagreed", "downgraded", "not_used"])
        .describe("Claude's proposal vs the volunteer's posting. downgraded = the volunteer chose a lower posting than Claude"),
      confidenceMin: nullableNumber("Claude's confidence (0-100) in its own posting, at least"),
      confidenceMax: nullableNumber("Claude's confidence (0-100) in its own posting, at most"),
      evacuation: z.boolean().nullable().describe("true = the assessment stopped with an evacuation order"),
      reinspection: z.boolean().nullable(),
      damageAtLeast: z.enum(DAMAGE_ESTIMATES).nullable().describe("Damage estimate at least this band"),
      floorsMin: nullableNumber("Floors above ground at least"),
      floorsMax: nullableNumber("Floors above ground at most"),
      construction: z.array(z.enum(CONSTRUCTION.map((c) => c.id) as [string, ...string[]])).describe("Any of these. Empty = any"),
      occupancy: z.array(z.enum(OCCUPANCY)).describe("Any of these uses. Empty = any"),
      items: z
        .array(z.object({ id: z.string().describe("ATC-20 item id"), ratings: z.array(z.enum(RATINGS)) }))
        .describe("Item ratings, e.g. columns Severe. Every listed item must match"),
    })
    .nullable()
    .describe("Conditions on the latest volunteer assessment. Null = no condition. Not null = the building must have one"),
  reviewedByEngineer: z.enum(["any", "yes", "no"]).describe("yes = an engineer has reported since the latest volunteer posting"),
  peopleMin: nullableNumber("People inside (newest count from either record) at least"),
  peopleMax: nullableNumber("People inside at most"),
  recordsMin: nullableNumber("Number of records (reports and assessments) at least"),
  sort: z.enum(["priority", "newest", "oldest", "most_people"]).describe("priority = most dangerous first (the default)"),
  limit: nullableNumber("How many buildings at most, e.g. 10 for 'top 10'"),
  understood: z.boolean().describe("false if the question is not about the buildings in this registry or cannot be expressed with these fields"),
});

export type Filter = z.infer<typeof FilterSchema>;

/** For Claude: the item ids it may use. */
export const ITEM_IDS = ITEMS.map((i) => `${i.id} ${i.label}`).join("; ");

const ANY: Filter = {
  mapColour: [],
  engineer: null,
  volunteer: null,
  reviewedByEngineer: "any",
  peopleMin: null,
  peopleMax: null,
  recordsMin: null,
  sort: "priority",
  limit: null,
  understood: true,
};
const VOLUNTEER: NonNullable<Filter["volunteer"]> = {
  posting: [],
  from: null,
  to: null,
  claude: "any",
  confidenceMin: null,
  confidenceMax: null,
  evacuation: null,
  reinspection: null,
  damageAtLeast: null,
  floorsMin: null,
  floorsMax: null,
  construction: [],
  occupancy: [],
  items: [],
};

/** The ready-made searches (owner, Q7 and Q23): they work without Claude. */
export const PRESET_FILTERS: Record<QueryPreset, Filter> = {
  priority: ANY,
  unsafe: { ...ANY, volunteer: { ...VOLUNTEER, posting: ["unsafe"] } },
  unreviewed: { ...ANY, volunteer: VOLUNTEER, reviewedByEngineer: "no" },
  overrode: { ...ANY, volunteer: { ...VOLUNTEER, claude: "disagreed" } },
  stale: { ...ANY, mapColour: ["stale"] },
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** The newest record's colour as the map shows it. */
function mapShade(b: BuildingFacts): (typeof MAP_SHADES)[number] {
  if (unreviewed(b)) return shadeOf({ colour: ({ inspected: "green", restricted: "yellow", unsafe: "red" } as const)[b.emt!.posting], day: b.emt!.day });
  return b.report ? b.report.shade : "not_inspected";
}

const inRange = (v: number | null, min: number | null, max: number | null) =>
  (min === null || (v !== null && v >= min)) && (max === null || (v !== null && v <= max));
const onOrAfter = (d: string, from: string | null) => from === null || d >= from;
const onOrBefore = (d: string, to: string | null) => to === null || d <= to;

function matches(b: BuildingFacts, f: Filter): boolean {
  if (f.mapColour.length && !f.mapColour.includes(mapShade(b))) return false;
  if (!inRange(peopleInside(b), f.peopleMin, f.peopleMax)) return false;
  if (f.recordsMin !== null && b.reportCount + b.assessmentCount < f.recordsMin) return false;
  if (f.reviewedByEngineer !== "any") {
    if (!b.emt) return false;
    if ((f.reviewedByEngineer === "yes") === unreviewed(b)) return false;
  }

  const r = b.report;
  const e = f.engineer;
  if (e) {
    if (!r) return false;
    if (e.colour.length && !e.colour.includes(r.colour)) return false;
    if (!onOrAfter(r.day, e.from) || !onOrBefore(r.day, e.to)) return false;
    if (!inRange(r.constructionYear, e.builtFrom, e.builtTo)) return false;
    if (e.mentions.some((w) => w.trim() && !r.text.includes(w.trim().toLowerCase()))) return false;
  }

  const a = b.emt;
  const v = f.volunteer;
  if (v) {
    if (!a) return false;
    if (v.posting.length && !v.posting.includes(a.posting)) return false;
    if (!onOrAfter(a.day, v.from) || !onOrBefore(a.day, v.to)) return false;
    const used = a.claudePosting !== null;
    const agreed = used && a.claudePosting === a.posting;
    if (v.claude === "agreed" && !agreed) return false;
    if (v.claude === "disagreed" && (!used || agreed)) return false;
    if (v.claude === "not_used" && used) return false;
    if (v.claude === "downgraded" && !isDowngrade(a.claudePosting, a.posting)) return false;
    // Claude's confidence is about its own posting, so it counts only when Claude
    // agreed (owner, Q10). Claude not used: kept, and ranked first (owner, Q12).
    if (v.confidenceMin !== null || v.confidenceMax !== null) {
      if (used && (!agreed || !inRange(a.claudeConfidence, v.confidenceMin, v.confidenceMax))) return false;
    }
    if (v.evacuation !== null && v.evacuation !== a.stopped) return false;
    if (v.reinspection !== null && v.reinspection !== a.reinspection) return false;
    if (v.damageAtLeast && DAMAGE_ESTIMATES.indexOf(a.damage as never) < DAMAGE_ESTIMATES.indexOf(v.damageAtLeast)) return false;
    if (!inRange(a.floors, v.floorsMin, v.floorsMax)) return false;
    if (v.construction.length && !v.construction.some((c) => a.construction.includes(c))) return false;
    if (v.occupancy.length && !v.occupancy.some((o) => a.occupancy.includes(o))) return false;
    if (v.items.some((x) => ITEM_BY_ID[x.id] && x.ratings.length && !x.ratings.includes(a.items[x.id] as never))) return false;
  }
  return true;
}

const SORTS: Record<Filter["sort"], (a: BuildingFacts, b: BuildingFacts) => number> = {
  priority: comparePriority,
  newest: (a, b) => lastVisit(b).localeCompare(lastVisit(a)) || comparePriority(a, b),
  oldest: (a, b) => lastVisit(a).localeCompare(lastVisit(b)) || comparePriority(a, b),
  most_people: (a, b) => (peopleInside(b) ?? -1) - (peopleInside(a) ?? -1) || comparePriority(a, b),
};

const short = (d: string) => formatDate(d);

/** "Volunteer: Unsafe · Claude 86% sure · 22 Nov": written by the app from the record, never by Claude (owner, Q6). */
function rowLine(b: BuildingFacts): string {
  const a = b.emt;
  if (a) {
    const parts = [`Volunteer: ${POSTING_LABEL[a.posting]}`];
    if (!a.claudePosting) parts.push("Claude not used");
    else if (a.claudePosting === a.posting) parts.push(a.claudeConfidence !== null ? `Claude ${a.claudeConfidence}% sure` : "Claude agreed");
    else parts.push(`Claude proposed ${POSTING_LABEL[a.claudePosting]}${a.claudeConfidence !== null ? ` (${a.claudeConfidence}%)` : ""}`);
    parts.push(short(a.day));
    return parts.join(" · ");
  }
  if (b.report) return `Engineer: ${b.report.shade === "stale" ? "green, over 6 months old" : b.report.colour} · ${short(b.report.day)}`;
  return "Not yet inspected";
}

function toRow(b: BuildingFacts): QueryRow {
  const r = b.report;
  const note =
    b.emt && r && !unreviewed(b) ? `Engineer report since: ${r.shade === "stale" ? "green, over 6 months old" : r.colour}, ${short(r.day)}` : null;
  const people = peopleInside(b);
  return {
    id: b.id,
    name: b.name,
    line: rowLine(b),
    reason: priorityReason(b),
    note,
    people,
    downgraded: !!b.emt && isDowngrade(b.emt.claudePosting, b.emt.posting),
  };
}

export function runFilter(all: BuildingFacts[], f: Filter, neverInspected: () => BuildingFacts[]) {
  const pool = f.mapColour.includes("not_inspected") ? [...all, ...neverInspected()] : all;
  const found = pool.filter((b) => matches(b, f)).sort(SORTS[f.sort]);
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.round(f.limit ?? DEFAULT_LIMIT)));
  return { total: found.length, rows: found.slice(0, limit).map(toRow) };
}

/** How the question was read, in plain words, built from the filter itself so a misread shows (owner, Q6). */
export function describeFilter(f: Filter): string {
  const parts: string[] = [];
  const shadeWord = { green: "green", yellow: "yellow", red: "red", stale: "green over 6 months old", not_inspected: "not yet inspected" };
  if (f.mapColour.length) parts.push(`On the map: ${f.mapColour.map((c) => shadeWord[c]).join(" or ")}`);
  const v = f.volunteer;
  if (v) {
    parts.push(v.posting.length ? `Volunteer posting ${v.posting.map((p) => POSTING_LABEL[p]).join(" or ")}` : "Has a volunteer assessment");
    const claudeWord = { any: "", agreed: "Claude agreed", disagreed: "Volunteer and Claude disagreed", downgraded: "Volunteer downgraded Claude's posting", not_used: "Claude not used" };
    if (claudeWord[v.claude]) parts.push(claudeWord[v.claude]);
    if (v.confidenceMin !== null || v.confidenceMax !== null) {
      const range = [v.confidenceMin !== null && `at least ${v.confidenceMin}%`, v.confidenceMax !== null && `at most ${v.confidenceMax}%`].filter(Boolean).join(" and ");
      parts.push(`Claude's confidence ${range} (only where Claude agreed; Claude-not-used kept, first)`);
    }
    if (v.from || v.to) parts.push(`Assessed ${[v.from && `from ${short(v.from)}`, v.to && `to ${short(v.to)}`].filter(Boolean).join(" ")}`);
    if (v.evacuation !== null) parts.push(v.evacuation ? "Evacuation ordered" : "No evacuation");
    if (v.reinspection !== null) parts.push(v.reinspection ? "Re-inspection" : "First visit");
    if (v.damageAtLeast) parts.push(`Damage at least ${v.damageAtLeast}`);
    if (v.floorsMin !== null || v.floorsMax !== null) parts.push(`Floors ${v.floorsMin ?? 0}–${v.floorsMax ?? "any"}`);
    if (v.construction.length) parts.push(`Construction: ${v.construction.map((c) => CONSTRUCTION.find((x) => x.id === c)?.label ?? c).join(" or ")}`);
    if (v.occupancy.length) parts.push(`Use: ${v.occupancy.join(" or ")}`);
    for (const x of v.items) if (ITEM_BY_ID[x.id]) parts.push(`${ITEM_BY_ID[x.id].label}: ${x.ratings.map((r) => RATING_LABEL[r]).join(" or ")}`);
  }
  const e = f.engineer;
  if (e) {
    parts.push(e.colour.length ? `Engineer rating ${e.colour.join(" or ")}` : "Has an engineer report");
    if (e.from || e.to) parts.push(`Reported ${[e.from && `from ${short(e.from)}`, e.to && `to ${short(e.to)}`].filter(Boolean).join(" ")}`);
    if (e.builtFrom !== null || e.builtTo !== null) parts.push(`Built ${e.builtFrom ?? "…"}–${e.builtTo ?? "…"}`);
    if (e.mentions.length) parts.push(`Report mentions “${e.mentions.join("”, “")}”`);
  }
  if (f.reviewedByEngineer === "yes") parts.push("Engineer has reported since");
  if (f.reviewedByEngineer === "no") parts.push("Not reviewed by an engineer");
  if (f.peopleMin !== null || f.peopleMax !== null) parts.push(`People inside ${f.peopleMin ?? 0}–${f.peopleMax ?? "any"}`);
  if (f.recordsMin !== null) parts.push(`At least ${f.recordsMin} records`);
  if (!parts.length) parts.push("Every inspected building");
  const sortWord = { priority: "most dangerous first", newest: "newest first", oldest: "oldest first", most_people: "most people first" };
  parts.push(sortWord[f.sort] + (f.limit ? `, top ${Math.round(f.limit)}` : ""));
  return parts.join(" · ");
}
