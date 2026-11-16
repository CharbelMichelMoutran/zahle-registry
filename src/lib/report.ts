/**
 * The demo report (docs/engineering.md, Part A): types, limits and validation.
 * Shared by the form (to enable Save) and the server (to reject bad input).
 */

// ---------------------------------------------------------------------------
// Open decisions (plan section 7). Defaults chosen by the orchestrator; easy to flip.
// ---------------------------------------------------------------------------

/** Show a gentle, non-blocking warning when Green is chosen but an area is "Not inspected". */
export const WARN_GREEN_WITH_NOT_INSPECTED = true;

/** Offer the "Not inspected" tick box on the final observation (roof, columns, foundations always have it). */
export const FINAL_OBSERVATION_ALLOWS_NOT_INSPECTED = false;

// ---------------------------------------------------------------------------
// Limits (Part A, D2). Accepted for the demo, not verified.
// ---------------------------------------------------------------------------

export const LIMITS = {
  nameMin: 2,
  nameMax: 100,
  contactMin: 7,
  phoneMax: 20,
  emailMax: 254,
  reportYearMin: 1990,
  constructionYearMin: 1800,
  residentsMax: 1000,
  observationMin: 10,
  observationMax: 2000,
  reasonMin: 10,
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
  engineer_name: string;
  engineer_contact: string;
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
  reason: string;
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
  engineerName: string;
  engineerContact: string;
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
};

/** The row the server sends to the database. */
export type ReportPayload = {
  building_id: string;
  client_request_id: string;
  based_on_report_id: string | null;
  engineer_name: string;
  engineer_contact: string;
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
  };

export type FieldErrors = Partial<Record<string, string>>;

const PHONE = /^\+?[0-9][0-9 -]*[0-9]$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTEGER = /^\d+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Remove invisible control characters (keep new lines and tabs) and trim. */
export const clean = (s: string) =>
  // eslint-disable-next-line no-control-regex
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

export function isAreaComplete(area: Area, o: ObservationInput) {
  if (o.notInspected && areaAllowsNotInspected(area)) {
    const n = len(clean(o.reason));
    return n >= LIMITS.reasonMin && n <= LIMITS.reasonMax;
  }
  const n = len(clean(o.text));
  return n >= LIMITS.observationMin && n <= LIMITS.observationMax;
}

export const allAreasComplete = (obs: Record<Area, ObservationInput>) =>
  AREAS.every((a) => isAreaComplete(a, obs[a]));

export function inputConstructionDate(input: ReportInput): ConstructionDate {
  if (input.constructionNotVerified) {
    return { year: null, month: null, approximate: false, notVerified: true };
  }
  const year = INTEGER.test(input.constructionYear.trim()) ? Number(input.constructionYear) : null;
  const month = input.constructionMonth ? Number(input.constructionMonth) : null;
  return { year, month, approximate: input.constructionApproximate, notVerified: false };
}

/**
 * Validate the whole form. `previous` is the construction date the form was
 * prefilled from (null for a building's first report); `today` is [y, m, d].
 */
export function validateReport(
  input: ReportInput,
  previous: ConstructionDate | null,
  today: [number, number, number],
): { errors: FieldErrors; constructionChanged: boolean } {
  const errors: FieldErrors = {};

  const name = clean(input.engineerName);
  if (len(name) < LIMITS.nameMin || len(name) > LIMITS.nameMax) {
    errors.engineerName = `Enter your name (${LIMITS.nameMin} to ${LIMITS.nameMax} characters).`;
  }

  const contact = clean(input.engineerContact);
  const isPhone = PHONE.test(contact) && len(contact) >= LIMITS.contactMin && len(contact) <= LIMITS.phoneMax;
  const isEmail = EMAIL.test(contact) && len(contact) <= LIMITS.emailMax;
  if (!isPhone && !isEmail) {
    errors.engineerContact =
      "Enter a phone number (7 to 20 digits, spaces, + or -) or an email address.";
  }

  // Date of report: a real calendar date, 1990 or later, not in the future.
  const [y, m, d] = [input.year, input.month, input.day].map((s) => s.trim());
  let reportYear: number | null = null;
  if (!INTEGER.test(y) || !INTEGER.test(m) || !INTEGER.test(d)) {
    errors.reportDate = "Enter the full date: day, month and year.";
  } else {
    const [yy, mm, dd] = [Number(y), Number(m), Number(d)];
    const date = new Date(Date.UTC(yy, mm - 1, dd));
    const real = date.getUTCFullYear() === yy && date.getUTCMonth() === mm - 1 && date.getUTCDate() === dd;
    if (!real) errors.reportDate = "This date does not exist. Check the day and month.";
    else if (yy < LIMITS.reportYearMin) errors.reportDate = `The year must be ${LIMITS.reportYearMin} or later.`;
    else if (iso(yy, mm, dd) > iso(...today)) errors.reportDate = "The date of report cannot be in the future.";
    else reportYear = yy;
  }

  // Residents: a whole number 0 to 1000, or "Not yet verified".
  if (!input.residentsNotVerified) {
    const r = input.residents.trim();
    if (!INTEGER.test(r) || Number(r) > LIMITS.residentsMax) {
      errors.residents = `Enter a whole number from 0 to ${LIMITS.residentsMax}, or tick "Not yet verified".`;
    }
  }

  // Construction date: 1800 up to the report year, or "Not yet verified".
  const construction = inputConstructionDate(input);
  if (!construction.notVerified) {
    const maxYear = reportYear ?? today[0];
    if (construction.year === null || input.constructionYear.trim().length !== 4) {
      errors.constructionYear = 'Enter a 4-digit year, or tick "Not yet verified".';
    } else if (construction.year < LIMITS.constructionYearMin || construction.year > maxYear) {
      errors.constructionYear = `The year must be from ${LIMITS.constructionYearMin} to ${maxYear} (not after the report year).`;
    }
    if (construction.month !== null && !(construction.month >= 1 && construction.month <= 12)) {
      errors.constructionYear = "Choose a month from the list, or leave it empty.";
    }
  }

  const constructionChanged = previous !== null && !sameConstructionDate(previous, construction);
  if (constructionChanged) {
    const n = len(clean(input.constructionChangeReason));
    if (n < LIMITS.reasonMin || n > LIMITS.reasonMax) {
      errors.constructionChangeReason = `Say why you are changing it (${LIMITS.reasonMin} to ${LIMITS.reasonMax} characters).`;
    }
  }

  for (const area of AREAS) {
    const o = input.observations[area];
    if (o.notInspected && !areaAllowsNotInspected(area)) {
      errors[area] = "Write an observation.";
    } else if (!isAreaComplete(area, o)) {
      errors[area] = o.notInspected
        ? `Say why it was not inspected (${LIMITS.reasonMin} to ${LIMITS.reasonMax} characters).`
        : `Write at least ${LIMITS.observationMin} characters (at most ${LIMITS.observationMax}).`;
    }
  }

  if (!input.colour || !COLOURS.includes(input.colour)) {
    errors.colour = "Choose a colour to save this report.";
  }

  if (!UUID.test(input.clientRequestId)) errors.form = "Reload the page and try again.";
  if (input.basedOnReportId !== null && !UUID.test(input.basedOnReportId)) errors.form = "Reload the page and try again.";

  return { errors, constructionChanged };
}

/** Turn a validated form into the database row. Call only when there are no errors. */
export function toPayload(
  buildingId: string,
  input: ReportInput,
  constructionChanged: boolean,
): ReportPayload {
  const c = inputConstructionDate(input);
  const obs = Object.fromEntries(
    AREAS.flatMap((area) => {
      const o = input.observations[area];
      const notInspected = o.notInspected && areaAllowsNotInspected(area);
      return [
        [`${area}_observation`, notInspected ? null : clean(o.text)],
        [`${area}_not_inspected_reason`, notInspected ? clean(o.reason) : null],
      ];
    }),
  ) as Record<`${Area}_observation` | `${Area}_not_inspected_reason`, string | null>;

  return {
    building_id: buildingId,
    client_request_id: input.clientRequestId,
    based_on_report_id: input.basedOnReportId,
    engineer_name: clean(input.engineerName),
    engineer_contact: clean(input.engineerContact),
    report_date: iso(Number(input.year), Number(input.month), Number(input.day)),
    residents_count: input.residentsNotVerified ? null : Number(input.residents.trim()),
    residents_not_verified: input.residentsNotVerified,
    construction_year: c.year,
    construction_month: c.month,
    construction_approximate: c.approximate,
    construction_not_verified: c.notVerified,
    construction_change_reason: constructionChanged ? clean(input.constructionChangeReason) : null,
    ...obs,
    colour: input.colour!,
  };
}
