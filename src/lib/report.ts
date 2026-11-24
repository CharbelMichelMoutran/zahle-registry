/**
 * The demo report (docs/engineering.md, Part A): types, limits and validation.
 * Shared by the form (to enable Save) and the server (to reject bad input).
 */
import type { Discipline } from "./account";
import { REPORT_ERRORS as E } from "./content";
import { detailErrors, detailPhotos, sanitizeDetails, type Details } from "./engineer-report";

// ---------------------------------------------------------------------------
// Owner decision (plan section 7): easy to flip.
// ---------------------------------------------------------------------------

/** Offer the "Not inspected" tick box on the final observation (roof, columns, foundations always have it). */
export const FINAL_OBSERVATION_ALLOWS_NOT_INSPECTED = false;

// ---------------------------------------------------------------------------
// Limits. Only the ones that protect the system (owner, 17 Nov 2026): no
// minimum lengths, nothing that tells the engineer what to write.
// ---------------------------------------------------------------------------

export const LIMITS = {
  reportYearMin: 1990,
  constructionYearMin: 1800,
  residentsMax: 1000,
  observationMax: 2000,
  reasonMax: 300,
} as const;

export const COLOURS = ["green", "yellow", "red"] as const;
export type Colour = (typeof COLOURS)[number];

export const AREAS = ["roof", "columns", "foundations", "final"] as const;
export type Area = (typeof AREAS)[number];

export const areaAllowsNotInspected = (area: Area) =>
  area !== "final" || FINAL_OBSERVATION_ALLOWS_NOT_INSPECTED;

/** Construction date as stored. */
export type ConstructionDate = {
  year: number | null;
  month: number | null;
  approximate: boolean;
  notVerified: boolean;
};

/** A saved report, as returned by the API. */
export type Report = {
  id: string;
  building_id: string;
  /** Copied from the account when the report was saved. Empty on early reports, which had typed details. */
  engineer_id: string | null;
  engineer_name: string;
  engineer_contact: string;
  engineer_discipline: Discipline | null;
  engineer_oea_number: string | null;
  report_date: string; // YYYY-MM-DD
  residents_count: number | null;
  residents_not_verified: boolean;
  construction_year: number | null;
  construction_month: number | null;
  construction_approximate: boolean;
  construction_not_verified: boolean;
  roof_observation: string | null;
  roof_not_inspected_reason: string | null;
  columns_observation: string | null;
  columns_not_inspected_reason: string | null;
  foundations_observation: string | null;
  foundations_not_inspected_reason: string | null;
  final_observation: string | null;
  final_not_inspected_reason: string | null;
  colour: Colour;
  created_at: string;
  /** The professional engineer report (plan.md item 27). Null on EMT simple reports. */
  details: Details | null;
  photos: string[];
  /** ZR-<year>-<0001>, only on reports with details. */
  report_number: string | null;
};

export type ConstructionDateChange = {
  id: string;
  report_id: string;
  previous_year: number | null;
  previous_month: number | null;
  previous_approximate: boolean;
  previous_not_verified: boolean;
  new_year: number | null;
  new_month: number | null;
  new_approximate: boolean;
  new_not_verified: boolean;
  /** Optional since the report redesign: null when no reason was given. */
  reason: string | null;
  changed_by: string;
  changed_at: string;
};

export const reportConstructionDate = (r: Report): ConstructionDate => ({
  year: r.construction_year,
  month: r.construction_month,
  approximate: r.construction_approximate,
  notVerified: r.construction_not_verified,
});

export function sameConstructionDate(a: ConstructionDate, b: ConstructionDate) {
  return (
    a.notVerified === b.notVerified &&
    a.year === b.year &&
    a.month === b.month &&
    a.approximate === b.approximate
  );
}

// ---------------------------------------------------------------------------
// Form input: what the form holds, as strings, before validation.
// ---------------------------------------------------------------------------

export type ObservationInput = { text: string; notInspected: boolean; reason: string };

export type ReportInput = {
  clientRequestId: string;
  basedOnReportId: string | null;
  day: string;
  month: string;
  year: string;
  residents: string;
  residentsNotVerified: boolean;
  constructionYear: string;
  constructionMonth: string; // "" = not given
  constructionApproximate: boolean;
  constructionNotVerified: boolean;
  constructionChangeReason: string;
  observations: Record<Area, ObservationInput>;
  colour: Colour | null;
  /** Engineer map only (plan.md item 27). Absent on the EMT simple report. */
  details?: Details | null;
};

/** The row the server sends to the database. */
export type ReportPayload = {
  building_id: string;
  client_request_id: string;
  based_on_report_id: string | null;
  report_date: string;
  residents_count: number | null;
  residents_not_verified: boolean;
  construction_year: number | null;
  construction_month: number | null;
  construction_approximate: boolean;
  construction_not_verified: boolean;
  construction_change_reason: string | null;
} & Record<`${Area}_observation` | `${Area}_not_inspected_reason`, string | null> & {
    colour: Colour;
    details: Details | null;
    photos: string[];
  };

export type FieldErrors = Partial<Record<string, string>>;

const INTEGER = /^\d+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Remove invisible control characters (keep new lines and tabs) and trim. */
export const clean = (s: string) =>
  s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

const len = (s: string) => [...s].length; // count characters, not UTF-16 units

/** Today's date as [year, month, day] in the given time zone (default: the device's). */
export function todayParts(timeZone?: string): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return [get("year"), get("month"), get("day")];
}

const iso = (y: number, m: number, d: number) =>
  `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/**
 * The construction date the form holds. An empty year means "Not yet verified"
 * (plan rule 3): an unknown is never a finding.
 */
export function inputConstructionDate(input: ReportInput): ConstructionDate {
  const y = input.constructionYear.trim();
  if (!y) {
    return { year: null, month: null, approximate: false, notVerified: true };
  }
  const year = INTEGER.test(y) ? Number(y) : null;
  const month = input.constructionMonth ? Number(input.constructionMonth) : null;
  return { year, month, approximate: input.constructionApproximate === true, notVerified: false };
}

/**
 * Validate the whole form. Only the rating is required (owner, 17 Nov 2026);
 * everything else is optional and only checked against limits that protect
 * the system. `previous` is the construction date the form was prefilled from
 * (null for a building's first report); `today` is [y, m, d].
 */
export function validateReport(
  input: ReportInput,
  previous: ConstructionDate | null,
  today: [number, number, number],
): { errors: FieldErrors; constructionChanged: boolean } {
  const errors: FieldErrors = {};
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  // Date of report: a real calendar date, 1990 or later, not in the future.
  const [y, m, d] = [input.year, input.month, input.day].map((s) => str(s).trim());
  let reportYear: number | null = null;
  if (!INTEGER.test(y) || !INTEGER.test(m) || !INTEGER.test(d)) {
    errors.reportDate = E.date;
  } else {
    const [yy, mm, dd] = [Number(y), Number(m), Number(d)];
    const date = new Date(Date.UTC(yy, mm - 1, dd));
    const real = date.getUTCFullYear() === yy && date.getUTCMonth() === mm - 1 && date.getUTCDate() === dd;
    if (!real) errors.reportDate = E.date;
    else if (yy < LIMITS.reportYearMin) errors.reportDate = E.dateTooEarly(LIMITS.reportYearMin);
    else if (iso(yy, mm, dd) > iso(...today)) errors.reportDate = E.dateFuture;
    else reportYear = yy;
  }

  // Residents: optional. If given, a whole number 0 to 1000.
  const residents = str(input.residents).trim();
  if (!input.residentsNotVerified && residents && (!INTEGER.test(residents) || Number(residents) > LIMITS.residentsMax)) {
    errors.residents = E.residents(LIMITS.residentsMax);
  }

  // Construction date: optional. If given, a 4-digit year from 1800 to the report year.
  const construction = inputConstructionDate(input);
  if (!construction.notVerified) {
    const maxYear = reportYear ?? today[0];
    if (
      construction.year === null ||
      str(input.constructionYear).trim().length !== 4 ||
      construction.year < LIMITS.constructionYearMin ||
      construction.year > maxYear ||
      (construction.month !== null && !(Number.isInteger(construction.month) && construction.month >= 1 && construction.month <= 12))
    ) {
      errors.constructionYear = E.constructionYear(LIMITS.constructionYearMin, maxYear);
    }
  }

  // A change keeps the previous value; the reason is optional.
  const constructionChanged = previous !== null && !sameConstructionDate(previous, construction);
  if (constructionChanged && len(clean(str(input.constructionChangeReason))) > LIMITS.reasonMax) {
    errors.constructionChangeReason = E.tooLong(LIMITS.reasonMax);
  }

  for (const area of AREAS) {
    const o = input.observations[area];
    if (typeof o !== "object" || o === null) {
      errors.form = E.reload;
      continue;
    }
    if (o.notInspected && areaAllowsNotInspected(area)) {
      if (len(clean(str(o.reason))) > LIMITS.reasonMax) errors[area] = E.tooLong(LIMITS.reasonMax);
    } else if (len(clean(str(o.text))) > LIMITS.observationMax) {
      errors[area] = E.tooLong(LIMITS.observationMax);
    }
  }

  if (input.details) Object.assign(errors, detailErrors(sanitizeDetails(input.details)));

  if (!input.colour || !COLOURS.includes(input.colour)) {
    errors.colour = E.rating;
  }

  if (!UUID.test(str(input.clientRequestId))) errors.form = E.reload;
  if (input.basedOnReportId !== null && !UUID.test(str(input.basedOnReportId))) errors.form = E.reload;

  return { errors, constructionChanged };
}

/** Turn a validated form into the database row. Call only when there are no errors. */
export function toPayload(
  buildingId: string,
  input: ReportInput,
  constructionChanged: boolean,
): ReportPayload {
  const c = inputConstructionDate(input);
  const residentsUnknown = input.residentsNotVerified === true || input.residents.trim() === "";
  const obs = Object.fromEntries(
    AREAS.flatMap((area) => {
      const o = input.observations[area];
      const notInspected = o.notInspected && areaAllowsNotInspected(area);
      // Empty text is "No remarks" (null). "Not inspected" keeps its reason, even empty ('').
      return [
        [`${area}_observation`, notInspected ? null : clean(o.text) || null],
        [`${area}_not_inspected_reason`, notInspected ? clean(o.reason) : null],
      ];
    }),
  ) as Record<`${Area}_observation` | `${Area}_not_inspected_reason`, string | null>;

  return {
    building_id: buildingId,
    client_request_id: input.clientRequestId,
    based_on_report_id: input.basedOnReportId,
    report_date: iso(Number(input.year), Number(input.month), Number(input.day)),
    // Left empty is an unknown: stored as "Not yet verified" (plan rule 3).
    residents_count: residentsUnknown ? null : Number(input.residents.trim()),
    residents_not_verified: residentsUnknown,
    construction_year: c.year,
    construction_month: c.month,
    construction_approximate: c.approximate,
    construction_not_verified: c.notVerified,
    construction_change_reason: constructionChanged ? clean(input.constructionChangeReason) || null : null,
    ...obs,
    colour: input.colour!,
    details: input.details ? sanitizeDetails(input.details) : null,
    photos: input.details ? detailPhotos(sanitizeDetails(input.details)) : [],
  };
}
