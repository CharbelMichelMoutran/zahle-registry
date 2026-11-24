/**
 * THE PRIORITY FORMULA (owner, 23 Nov 2026, plan.md item 29).
 *
 * This file is the one source of truth for how buildings are ranked: the
 * "Priority list", the default order of every "Ask" result, and the steps shown
 * on the landing page and under "How this list is ranked" (PRIORITY_STEPS).
 * Change the ranking here and nowhere else, and keep PRIORITY_STEPS in step
 * with priorityKey() below: the owner wants the formula transparent.
 *
 * In short, top to bottom:
 *   group 0  evacuations: a volunteer assessment that stopped with "Order evacuation"
 *   group 1  volunteer postings a person decided alone: Claude not used, or the
 *            volunteer overrode Claude (ranked by the worse of the two postings)
 *   group 2  volunteer postings Claude agreed with
 *   group 3  buildings an engineer has reported on since the last volunteer posting
 * Inside a group: colour, then damage estimate, then people inside, then Claude's
 * confidence (red and yellow: more sure first; green: less sure first), then the
 * building that has waited longest since its last visit.
 * Buildings never inspected are left out unless a question asks for them.
 */
import { DAMAGE_ESTIMATES, POSTING_SEVERITY, type Posting, type Rating } from "./atc20";
import type { Shade } from "./record";
import type { Colour } from "./report";

/** What the ranking and the "Ask" filters know about one building (built on the server, lib/building-facts.ts). */
export type BuildingFacts = {
  id: string;
  /** Building name or street from the latest volunteer assessment, if written; else empty. */
  name: string;
  /** Latest engineer report. */
  report: {
    colour: Colour;
    /** The colour as the map shows it today: green over 6 months is "stale". */
    shade: Shade;
    day: string;
    at: string;
    residents: number | null;
    constructionYear: number | null;
    /** Every engineer report's written text, lower case, for "mentions" searches. */
    text: string;
  } | null;
  /** Latest volunteer (EMT) assessment. */
  emt: {
    posting: Posting;
    claudePosting: Posting | null;
    claudeConfidence: number | null;
    stopped: boolean;
    reinspection: boolean;
    damage: string;
    floors: number | null;
    construction: string[];
    occupancy: string[];
    peopleInside: number | null;
    items: Record<string, Rating>;
    day: string;
    at: string;
  } | null;
  reportCount: number;
  assessmentCount: number;
};

/** One plain-words line per step, shown on the landing page and under every ranked list. */
export const PRIORITY_STEPS = [
  "Evacuations first: a volunteer assessment that stopped with “Order evacuation”.",
  "Then volunteer postings a person decided alone: Claude was not used, or the volunteer overrode Claude. These are ranked by the worse of the two postings.",
  "Then volunteer postings Claude agreed with.",
  "Then buildings an engineer has reported on since: red, yellow, faded green, green.",
  "Inside each group: the colour (red, yellow, green), then the damage estimate, then the number of people inside, then Claude’s confidence. For red and yellow, the surer Claude is, the higher; for green, the less sure, the higher. Unknown damage or people rank below known numbers but above zero. Ties: the building waiting longest since its last visit.",
] as const;

/**
 * "Near me" on the volunteer map (owner, 23 Nov 2026): distance and importance
 * together. Each building's distance is divided by its weight, taken from its
 * newest record, and the smallest result comes first. Keep NEAR_ME_STEP in step.
 */
export const NEAR_ME_WEIGHT = { red: 4, yellow: 2, never: 1.5, green: 1 } as const;

export const NEAR_ME_STEP =
  "Nearest first, weighted by danger: a building last posted unsafe counts as 4 times closer, restricted use 2 times, never inspected 1.5 times. So an unsafe building 400 m away comes before a safe one 150 m away.";

/** Smaller is sooner. `colour` is the newest record's colour, or null if never inspected. */
export function nearMeScore(metres: number, colour: Colour | null): number {
  return metres / NEAR_ME_WEIGHT[colour ?? "never"];
}

export const PRIORITY_NOTE = "Buildings never inspected are not ranked unless a question asks for them.";

/** The volunteer posting is the newest record: no engineer report since (same order as the map). */
export function unreviewed(b: BuildingFacts): boolean {
  const { report, emt } = b;
  return !!emt && (!report || emt.day > report.day || (emt.day === report.day && emt.at > report.at));
}

export type PriorityGroup = 0 | 1 | 2 | 3;

export function priorityGroup(b: BuildingFacts): PriorityGroup | null {
  if (unreviewed(b)) {
    const e = b.emt!;
    if (e.stopped) return 0;
    if (!e.claudePosting || e.claudePosting !== e.posting) return 1;
    return 2;
  }
  return b.report ? 3 : null;
}

/** Unknown sits between zero and the smallest known amount (owner, Q28). */
const amount = (n: number | null) => (n === null ? 0.5 : n === 0 ? 0 : 1 + n);

/** "None" is 0, then each band up; unknown sits just above "None". */
function damageRank(d: string): number {
  const i = (DAMAGE_ESTIMATES as readonly string[]).indexOf(d);
  return i < 0 ? 0.5 : i;
}

const SHADE_SEVERITY: Record<Shade, number> = { red: 3, yellow: 2, stale: 1, green: 0 };

/** People inside: the newest number from either record (owner, Q29). */
export function peopleInside(b: BuildingFacts): number | null {
  const fromReport = b.report?.residents ?? null;
  const fromEmt = b.emt?.peopleInside ?? null;
  if (fromReport === null) return fromEmt;
  if (fromEmt === null) return fromReport;
  return unreviewed(b) ? fromEmt : fromReport;
}

/** When the building was last visited, by anyone. */
export function lastVisit(b: BuildingFacts): string {
  return [b.report?.at, b.emt?.at].filter((x): x is string => !!x).sort().at(-1) ?? "";
}

/**
 * The sort key: compare element by element, larger first. The order of the
 * elements is the formula; see PRIORITY_STEPS.
 */
export function priorityKey(b: BuildingFacts): number[] {
  const group = priorityGroup(b);
  if (group === null) return [-99];
  const waited = -Date.parse(lastVisit(b) || "2100-01-01");
  const people = amount(peopleInside(b));
  if (group === 3) {
    return [-group, SHADE_SEVERITY[b.report!.shade], 0, people, 0, waited];
  }
  const e = b.emt!;
  const worse = Math.max(POSTING_SEVERITY[e.posting], e.claudePosting ? POSTING_SEVERITY[e.claudePosting] : -1);
  // Group 2 only: Claude agreed, so its confidence is about the posting on the map.
  const confidence =
    group === 2 && e.claudeConfidence !== null ? (e.posting === "inspected" ? 100 - e.claudeConfidence : e.claudeConfidence) : 0;
  return [-group, worse, damageRank(e.damage), people, confidence, waited];
}

export function comparePriority(a: BuildingFacts, b: BuildingFacts): number {
  const ka = priorityKey(a);
  const kb = priorityKey(b);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const d = (kb[i] ?? 0) - (ka[i] ?? 0);
    if (d !== 0) return d;
  }
  return a.id.localeCompare(b.id);
}

/** Why a building sits where it does, in a few words, for the result row. */
export function priorityReason(b: BuildingFacts): string {
  switch (priorityGroup(b)) {
    case 0:
      return "Evacuation ordered";
    case 1:
      return b.emt!.claudePosting ? "Volunteer overrode Claude: check first" : "Claude not used: check first";
    case 2:
      return "Claude agreed with the volunteer";
    case 3:
      return "Reviewed by an engineer";
    default:
      return "Not yet inspected";
  }
}
