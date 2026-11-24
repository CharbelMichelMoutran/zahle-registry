/**
 * The professional engineer report (owner, 23 Nov 2026, plan.md item 27):
 * ASCE 11 part-by-part condition, the Eurocode 8-3 knowledge level, the ATC-20
 * scale and damage estimate, and the Lebanon form's location and construction
 * lists. Stored in reports.details. Shared by the form and the server.
 *
 * Date, residents, construction date, the overall classification and the
 * remarks keep their own report columns, so the map, tray and debrief read
 * them as before.
 */
import { CONSTRUCTION, DAMAGE_ESTIMATES, FEATURES, OCCUPANCY, RATING_LABEL, RATINGS, type Rating } from "./atc20";

export { CONSTRUCTION, DAMAGE_ESTIMATES, FEATURES, OCCUPANCY, RATING_LABEL, RATINGS, type Rating };

export const PARTS = [
  { id: "foundations", label: "Foundations" },
  { id: "columns", label: "Columns" },
  { id: "beams", label: "Beams and slabs" },
  { id: "walls", label: "Walls" },
  { id: "stairs", label: "Stairs" },
  { id: "roof", label: "Roof", hint: "incl. tanks and solar panels" },
  { id: "facade", label: "Facade and balconies", hint: "incl. parapets" },
] as const;
export type PartId = (typeof PARTS)[number]["id"];

export const METHODS = [
  { id: "visual", label: "Visual only" },
  { id: "drawings", label: "Visual and drawings" },
  { id: "tests", label: "On-site tests" },
] as const;
export type Method = (typeof METHODS)[number]["id"];

export const RECOMMENDED_ACTIONS = [
  "No action",
  "Monitor",
  "Repair",
  "Detailed investigation",
  "Restrict use",
  "Evacuate",
] as const;

/** Section titles, numbered as on the paper form. */
export const SECTIONS = [
  "Identification",
  "Building description",
  "Inspection method",
  "Condition of structural elements",
  "Observations and remarks",
  "Overall classification",
  "Recommended actions",
  "Certification",
] as const;

/** The overall classification in engineering terms (owner, 23 Nov 2026). Colours unchanged. */
export const CLASSIFICATION = {
  green: "Satisfactory",
  yellow: "Repair required",
  red: "Unsafe",
} as const;

export const DETAIL_LIMITS = {
  short: 120,
  note: 2000,
  photosPerPart: 4,
  number: 3, // floors, basements, units: up to 999
} as const;

export type PartEntry = { condition: Rating | null; note: string; photos: string[] };

export type Details = {
  version: 1;
  identification: { buildingName: string; street: string; landmark: string; plot: string; coverPhoto: string | null };
  description: {
    floors: string;
    basements: string;
    addedOnRoof: string;
    units: string;
    structure: string | null;
    use: string[];
    features: string[];
  };
  method: Method | null;
  parts: Record<PartId, PartEntry>;
  damage: string | null;
  actions: { picks: string[]; inspectBy: string; note: string };
  /** Set by the server from the building, never by the form. */
  gps?: { lat: number; lng: number };
};

const emptyPart = (): PartEntry => ({ condition: null, note: "", photos: [] });

export function emptyDetails(): Details {
  return {
    version: 1,
    identification: { buildingName: "", street: "", landmark: "", plot: "", coverPhoto: null },
    description: { floors: "", basements: "", addedOnRoof: "", units: "", structure: null, use: [], features: [] },
    method: null,
    parts: Object.fromEntries(PARTS.map((p) => [p.id, emptyPart()])) as Record<PartId, PartEntry>,
    damage: null,
    actions: { picks: [], inspectBy: "", note: "" },
  };
}

/**
 * A new report starts from the last one: the building's name, address and
 * description carry over (the record shows what each report said, so a change
 * keeps the old value). Observations, photos and the verdict start empty.
 */
export function prefillDetails(previous: Details | null | undefined): Details {
  const d = emptyDetails();
  if (!previous) return d;
  const p = sanitizeDetails(previous);
  return { ...d, identification: { ...p.identification, coverPhoto: null }, description: p.description };
}

/** Every photo path in the report, cover first. */
export function detailPhotos(d: Details): string[] {
  return [...(d.identification.coverPhoto ? [d.identification.coverPhoto] : []), ...PARTS.flatMap((p) => d.parts[p.id].photos)];
}

// ---------------------------------------------------------------------------
// Checking: rebuild from known keys only, so nothing unexpected is stored.
// ---------------------------------------------------------------------------

const str = (v: unknown) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim() : "");
const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | null =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;
const picks = (v: unknown, allowed: readonly string[]) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && allowed.includes(x)))] : [];
const digits = (v: unknown) => str(v).replace(/\D/g, "").slice(0, DETAIL_LIMITS.number);
const paths = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const obj = (v: unknown): Record<string, unknown> => (typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {});

/** The report with only known keys and allowed values. Text is trimmed, not cut: length is checked separately. */
export function sanitizeDetails(raw: unknown): Details {
  const r = obj(raw);
  const id = obj(r.identification);
  const desc = obj(r.description);
  const parts = obj(r.parts);
  const actions = obj(r.actions);
  const inspectBy = str(actions.inspectBy);
  return {
    version: 1,
    identification: {
      buildingName: str(id.buildingName),
      street: str(id.street),
      landmark: str(id.landmark),
      plot: str(id.plot),
      coverPhoto: typeof id.coverPhoto === "string" ? id.coverPhoto : null,
    },
    description: {
      floors: digits(desc.floors),
      basements: digits(desc.basements),
      addedOnRoof: digits(desc.addedOnRoof),
      units: digits(desc.units),
      structure: pick(desc.structure, CONSTRUCTION.map((c) => c.id)),
      use: picks(desc.use, OCCUPANCY),
      features: picks(desc.features, FEATURES),
    },
    method: pick(r.method, METHODS.map((m) => m.id)),
    parts: Object.fromEntries(
      PARTS.map((p) => {
        const e = obj(parts[p.id]);
        return [p.id, { condition: pick(e.condition, RATINGS), note: str(e.note), photos: paths(e.photos) }];
      }),
    ) as Record<PartId, PartEntry>,
    damage: pick(r.damage, DAMAGE_ESTIMATES),
    actions: {
      picks: picks(actions.picks, RECOMMENDED_ACTIONS),
      inspectBy: /^\d{4}-\d{2}-\d{2}$/.test(inspectBy) ? inspectBy : "",
      note: str(actions.note),
    },
  };
}

/** Field messages, keyed as the form names its fields. Only limits that protect the system. */
export function detailErrors(d: Details): Record<string, string> {
  const errors: Record<string, string> = {};
  const long = (s: string, max: number) => [...s].length > max;
  const tooLong = (max: number) => `Use at most ${max} characters.`;
  for (const k of ["buildingName", "street", "landmark", "plot"] as const) {
    if (long(d.identification[k], DETAIL_LIMITS.short)) errors[`id.${k}`] = tooLong(DETAIL_LIMITS.short);
  }
  for (const p of PARTS) {
    const e = d.parts[p.id];
    if (long(e.note, DETAIL_LIMITS.note)) errors[`part.${p.id}`] = tooLong(DETAIL_LIMITS.note);
    if (e.photos.length > DETAIL_LIMITS.photosPerPart) errors[`part.${p.id}`] = `Use at most ${DETAIL_LIMITS.photosPerPart} photos.`;
  }
  if (long(d.actions.note, DETAIL_LIMITS.note)) errors["actions.note"] = tooLong(DETAIL_LIMITS.note);
  return errors;
}

/** The report as plain text, for Claude's "Draft remarks" and for the debrief. */
export function detailsSummary(d: Details, extra: { classification?: string | null; remarks?: string | null } = {}): string {
  const lines: string[] = [];
  const desc = d.description;
  const structure = CONSTRUCTION.find((c) => c.id === desc.structure)?.label;
  const facts = [
    desc.floors && `${desc.floors} floors`,
    desc.basements && `${desc.basements} basements`,
    desc.addedOnRoof && `${desc.addedOnRoof} floors added on the roof`,
    desc.units && `${desc.units} units`,
    structure,
    desc.use.length > 0 && `use: ${desc.use.join(", ")}`,
    desc.features.length > 0 && `features: ${desc.features.join(", ")}`,
  ].filter(Boolean);
  if (facts.length > 0) lines.push(`Building: ${facts.join("; ")}.`);
  const method = METHODS.find((m) => m.id === d.method)?.label;
  if (method) lines.push(`Inspection method: ${method}.`);
  for (const p of PARTS) {
    const e = d.parts[p.id];
    if (!e.condition && !e.note) continue;
    lines.push(`${p.label}: ${e.condition ? RATING_LABEL[e.condition] : "not rated"}${e.note ? `. ${e.note}` : ""}`);
  }
  if (extra.remarks) lines.push(`Remarks: ${extra.remarks}`);
  if (extra.classification) lines.push(`Overall classification: ${extra.classification}.`);
  if (d.damage) lines.push(`Estimated damage: ${d.damage}.`);
  if (d.actions.picks.length > 0) lines.push(`Recommended actions: ${d.actions.picks.join(", ")}.`);
  if (d.actions.inspectBy) lines.push(`Inspect again by ${d.actions.inspectBy}.`);
  if (d.actions.note) lines.push(`Actions note: ${d.actions.note}`);
  return lines.join("\n");
}
