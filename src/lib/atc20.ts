/**
 * The EMT safety assessment (plan.md item 25): the ATC-20 Detailed Evaluation
 * at its core (items, the Minor/None, Moderate, Severe scale, posting and
 * damage estimate), with the Lebanese parts of the owner's form
 * (Lebanon_Building_Safety_Assessment_Form_Phone.pdf): scene safety first,
 * location fields, local construction types, and the Actions page.
 *
 * Shared by the screens and by the server (Claude's instructions and checks).
 */

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

/** ATC-20's three columns, plus "not seen" for what the EMT could not look at. */
export const RATINGS = ["none", "moderate", "severe", "unseen"] as const;
export type Rating = (typeof RATINGS)[number];

export const RATING_LABEL: Record<Rating, string> = {
  none: "Minor / none",
  moderate: "Moderate",
  severe: "Severe",
  unseen: "Not seen",
};

export const POSTINGS = ["inspected", "restricted", "unsafe"] as const;
export type Posting = (typeof POSTINGS)[number];

export const POSTING_LABEL: Record<Posting, string> = {
  inspected: "Inspected",
  restricted: "Restricted use",
  unsafe: "Unsafe",
};

/** The placard's one-line meaning (ATC-20). */
export const POSTING_MEANING: Record<Posting, string> = {
  inspected: "Lawful occupancy permitted. No apparent hazard found.",
  restricted: "Enter only as the restrictions say. Some hazard found.",
  unsafe: "Do not enter or occupy. Serious hazard found.",
};

export const POSTING_COLOUR = { inspected: "green", restricted: "yellow", unsafe: "red" } as const;

// ---------------------------------------------------------------------------
// Scene safety (owner's form, page 2). Any Yes stops the assessment.
// ---------------------------------------------------------------------------

export const SCENE_CHECKS = [
  { id: "S1", label: "Gas or chemical smell, or hissing" },
  { id: "S2", label: "Fire, smoke or smouldering" },
  { id: "S3", label: "Wires down, sparking or hanging" },
  { id: "S4", label: "Rocks or soil falling, or strong aftershocks now" },
] as const;

/** Asked again on entering, before going further inside (owner's form, I18 and I19). */
export const INSIDE_CHECKS = [
  { id: "I1", label: "Gas smell, or a damaged gas cylinder or pipe" },
  { id: "I2", label: "Sparking, burning smell or live wiring" },
] as const;

export type CheckId = (typeof SCENE_CHECKS)[number]["id"] | (typeof INSIDE_CHECKS)[number]["id"];

export const STOP_ORDER = "Order evacuation immediately. Do not enter.";

/** Lebanese emergency numbers (owner's form, page 2). */
export const EMERGENCY_NUMBERS = [
  { number: "125", name: "Civil Defense" },
  { number: "140", name: "Lebanese Red Cross" },
  { number: "112", name: "Internal Security Forces" },
  { number: "175", name: "Beirut Fire Brigade" },
] as const;

// ---------------------------------------------------------------------------
// ATC-20 Detailed Evaluation items. `where` says on which walk they are rated.
// Each level has one plain line, so an EMT knows what counts.
// ---------------------------------------------------------------------------

export type Group = "overall" | "structural" | "nonstructural" | "geotechnical";

export const GROUP_LABEL: Record<Group, string> = {
  overall: "Overall hazards",
  structural: "Structural hazards",
  nonstructural: "Non-structural hazards",
  geotechnical: "Ground hazards",
};

export type Item = {
  id: string;
  group: Group;
  label: string;
  where: "outside" | "inside" | "both";
  /** What Minor/none, Moderate and Severe look like for this item. */
  levels: { none: string; moderate: string; severe: string };
};

export const ITEMS: readonly Item[] = [
  {
    id: "O1", group: "overall", where: "outside", label: "Collapse or partial collapse",
    levels: {
      none: "Nothing has fallen down.",
      moderate: "A small part (a stair, a canopy, a section of roof) has dropped.",
      severe: "A floor, roof or part of the building has collapsed.",
    },
  },
  {
    id: "O2", group: "overall", where: "outside", label: "Building or storey leaning",
    levels: {
      none: "Walls and columns look straight against the neighbours.",
      moderate: "A slight lean you only see when you look hard.",
      severe: "A clear lean of the building or of one floor, or a floor squashed shorter than the others.",
    },
  },
  {
    id: "S1", group: "structural", where: "both", label: "Foundations",
    levels: {
      none: "No movement at the base.",
      moderate: "Small cracks at the base or a little settlement.",
      severe: "The building slid, sank or tilted on its base.",
    },
  },
  {
    id: "S2", group: "structural", where: "both", label: "Roofs and floors",
    levels: {
      none: "Floors and ceilings level, no cracks that matter.",
      moderate: "Cracks in slabs or ceilings, some concrete fallen with bars showing.",
      severe: "A floor or ceiling sagging, or a gap where the slab meets a wall or beam.",
    },
  },
  {
    id: "S3", group: "structural", where: "both", label: "Columns, pilasters, corbels",
    levels: {
      none: "Hairline cracks or none.",
      moderate: "A crack in a beam or column that fits a coin edge, no bars showing.",
      severe: "Concrete burst, bars exposed or bent, X or diagonal cracks, or a crack wider than 2 mm in a column.",
    },
  },
  {
    id: "S4", group: "structural", where: "both", label: "Diaphragms, horizontal bracing",
    levels: {
      none: "Floors still tied to the walls.",
      moderate: "Cracks along the edge of a floor or roof.",
      severe: "A floor or roof pulling away from its walls.",
    },
  },
  {
    id: "S5", group: "structural", where: "both", label: "Walls, vertical bracing",
    levels: {
      none: "Hairline cracks or none.",
      moderate: "Diagonal or X cracks in block walls, a corner cracked, or block infill partly fallen out.",
      severe: "Stone or load-bearing wall cracked through, bulging, or with stones out.",
    },
  },
  {
    id: "S6", group: "structural", where: "both", label: "Precast connections",
    levels: {
      none: "No precast parts, or joints look sound.",
      moderate: "Cracking at a joint between precast parts.",
      severe: "A precast part has slipped or a joint has opened.",
    },
  },
  {
    id: "N1", group: "nonstructural", where: "outside", label: "Parapets, ornamentation, balconies",
    levels: {
      none: "Firm.",
      moderate: "Cracked at the base, or loose stonework that could fall.",
      severe: "Leaning, sagging or pulling away over a street or doorway.",
    },
  },
  {
    id: "N2", group: "nonstructural", where: "outside", label: "Cladding, glass panels, roof items",
    levels: {
      none: "Firm.",
      moderate: "Loose plaster or tiles, a tank, solar panel or sign shifted.",
      severe: "Broken glass hanging, or heavy items about to fall from the roof or facade.",
    },
  },
  {
    id: "N3", group: "nonstructural", where: "inside", label: "Ceilings, light fixtures",
    levels: {
      none: "In place.",
      moderate: "Some false ceiling or lights fallen or hanging.",
      severe: "Large ceiling areas down or about to fall on a way out.",
    },
  },
  {
    id: "N4", group: "nonstructural", where: "inside", label: "Interior walls, partitions",
    levels: {
      none: "Hairline cracks or none.",
      moderate: "Diagonal cracks or a partition partly fallen.",
      severe: "Partitions fallen across rooms or ways out.",
    },
  },
  {
    id: "N5", group: "nonstructural", where: "inside", label: "Elevators",
    levels: {
      none: "No damage seen.",
      moderate: "Shaft walls cracked.",
      severe: "Shaft badly damaged or the car stuck between floors.",
    },
  },
  {
    id: "N6", group: "nonstructural", where: "both", label: "Stairs, exits",
    levels: {
      none: "Usable.",
      moderate: "Cracks in stairs or landings, or one exit blocked.",
      severe: "Stairs broken, sagging or separated from the walls, or no safe way out.",
    },
  },
  {
    id: "N7", group: "nonstructural", where: "both", label: "Electric, gas, water",
    levels: {
      none: "No leak, no damage seen.",
      moderate: "Water leaking or flooding, a pipe or cable damaged but not live.",
      severe: "Gas smell, live wiring or sparking.",
    },
  },
  {
    id: "G1", group: "geotechnical", where: "outside", label: "Slope failure, debris",
    levels: {
      none: "No slope movement.",
      moderate: "Small rockfall or soil movement nearby.",
      severe: "Landslide, rockfall onto the building, or a retaining wall cracked, bulging or collapsed.",
    },
  },
  {
    id: "G2", group: "geotechnical", where: "outside", label: "Ground movement, fissures",
    levels: {
      none: "Ground intact.",
      moderate: "Small ground cracks, pavement sunk or lifted.",
      severe: "A ground crack wider than 2 cm or a step next to the building.",
    },
  },
];

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const itemsFor = (walk: "outside" | "inside") => ITEMS.filter((i) => i.where === walk || i.where === "both");

// ---------------------------------------------------------------------------
// Photo prompts: what Claude asks for on each walk, in order.
// ---------------------------------------------------------------------------

export const PHOTO_PROMPTS = {
  outside: [
    { id: "front", text: "The whole front of the building, from across the street." },
    { id: "sides", text: "Each other side you can reach safely." },
    { id: "ground-floor", text: "The ground-floor columns and walls, close up (parking or shops first)." },
    { id: "roof-edge", text: "The roof edge, balconies, and anything on the roof." },
    { id: "ground", text: "The ground and any slope or retaining wall around the building." },
  ],
  inside: [
    { id: "stairs", text: "The stairs and the way out." },
    { id: "columns", text: "Columns and beams in the basement or on the ground floor." },
    { id: "floors", text: "Floors and ceilings, especially any that dip or crack." },
    { id: "fittings", text: "Interior walls, false ceilings and lights." },
  ],
} as const;

export type Walk = keyof typeof PHOTO_PROMPTS;

// ---------------------------------------------------------------------------
// Building facts (owner's form, pages 3 to 5)
// ---------------------------------------------------------------------------

export const GOVERNORATES = [
  "Beirut", "Mount Lebanon", "North", "Akkar", "South", "Nabatieh", "Bekaa", "Baalbek-Hermel",
] as const;

export const FOOTPRINTS = ["< 100 m²", "100–300 m²", "300–1000 m²", "> 1000 m²"] as const;
export const AGES = ["Before 1950", "1950–1990", "1990–2010", "After 2010", "Don't know"] as const;

export const CONSTRUCTION = [
  { id: "frame-blocks", label: "Concrete frame + blocks", hint: "hollow blocks between" },
  { id: "open-ground", label: "Concrete frame, open ground floor", hint: "shops, parking, pillars" },
  { id: "stone", label: "Traditional stone", hint: "thick walls, arches" },
  { id: "block-walls", label: "Block walls, no columns", hint: "1–2 storeys" },
  { id: "steel", label: "Steel frame / metal shed", hint: "" },
  { id: "mixed", label: "Mixed", hint: "stone base + concrete floors" },
  { id: "other", label: "Other / not sure", hint: "" },
] as const;

export const OCCUPANCY = [
  "Residential", "Shops + homes", "Shops / commercial", "Offices", "School", "Hospital / clinic",
  "Place of worship", "Government", "Industrial / storage", "Other",
] as const;

export const FEATURES = [
  "Shares a wall with a neighbour", "Floors added on roof", "Large balconies", "Heavy roof items",
  "Unfinished", "Damaged before the event", "Heritage / listed", "Slope / retaining wall",
] as const;

export const DAMAGE_ESTIMATES = ["None", "0–1%", "1–10%", "10–30%", "30–60%", "60–100%", "100%"] as const;

export const ACTIONS = {
  engineer: ["Structural", "Ground / slope", "Other"],
  shutOff: ["Gas (cylinders / main)", "Electricity", "Water", "Generator / fuel"],
  notify: ["Civil Defense", "Red Cross", "ISF", "Lebanese Army", "Municipality", "DGA (heritage)"],
} as const;

export const ORGANIZATIONS = ["Lebanese Red Cross", "Civil Defense", "Municipality", "Other"] as const;

// ---------------------------------------------------------------------------
// The draft and the saved record
// ---------------------------------------------------------------------------

/** One item's answer: what Claude suggested, and what stands (the EMT's word wins). */
export type ItemAnswer = {
  rating: Rating | null;
  /** Who set `rating`. */
  by: "claude" | "emt" | null;
  claude: Rating | null;
  reason: string;
  /** Photo numbers that show it. */
  photos: number[];
};

/** A simple line sketch Claude drew from one photo: only what the photo shows. */
export type Sketch = {
  title: string;
  /** Coordinates are 0 to 100 in both directions. */
  lines: { x1: number; y1: number; x2: number; y2: number }[];
  boxes: { x: number; y: number; w: number; h: number; label: string }[];
  marks: { x: number; y: number; item: string; rating: "moderate" | "severe"; note: string }[];
  north: { x: number; y: number; angle: number } | null;
  street: string | null;
};

export type Photo = {
  number: number;
  path: string;
  walk: Walk;
  prompt: string;
  caption: string;
  sketch: Sketch | null;
};

export type Facts = {
  buildingName: string;
  governorate: string;
  district: string;
  municipality: string;
  street: string;
  landmark: string;
  lat: string;
  lng: string;
  cadastral: string;
  contactName: string;
  contactPhone: string;
  floors: string;
  basements: string;
  addedOnRoof: string;
  units: string;
  notHabitable: string;
  peopleInside: string;
  footprint: string;
  age: string;
  construction: string[];
  constructionOther: string;
  occupancy: string[];
  features: string[];
};

export type Draft = {
  version: 1;
  clientRequestId: string;
  buildingId: string;
  startedAt: string;
  step: Step;
  inspector: string;
  team: string;
  organization: string;
  event: "earthquake" | "other";
  visit: "first" | "re-inspection";
  previous: { posting: Posting | null; inspector: string; date: string };
  facts: Facts;
  /** Which fields Claude filled (and the EMT has not changed since). */
  claudeFacts: string[];
  checks: Partial<Record<CheckId, "yes" | "no">>;
  items: Record<string, ItemAnswer>;
  photos: Photo[];
  sidesSeen: string[];
  sidesNotSeen: string;
  gate: "enter" | "do-not-enter" | null;
  floorsWalked: string;
  areasNotInspected: string;
  claudePosting: { posting: Posting; because: string[]; reason: string } | null;
  posting: Posting | null;
  restrictions: string;
  actions: { barricade: string; engineer: string[]; shutOff: string[]; neighbours: boolean; notify: string[]; other: string };
  damage: string;
  comments: string;
  stopped: { check: string; at: string } | null;
};

/** Outside comes before Building, so the Building page shows what Claude read from the photos. */
export const STEPS = ["start", "scene", "outside", "building", "gate", "inside", "posting", "actions", "review"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_LABEL: Record<Step, string> = {
  start: "Start",
  scene: "Scene safety",
  building: "Building",
  outside: "Outside",
  gate: "Go inside?",
  inside: "Inside",
  posting: "Posting",
  actions: "Actions",
  review: "Save",
};

export const emptyAnswer = (): ItemAnswer => ({ rating: null, by: null, claude: null, reason: "", photos: [] });

export const EMPTY_FACTS: Facts = {
  buildingName: "", governorate: "", district: "", municipality: "", street: "", landmark: "",
  lat: "", lng: "", cadastral: "", contactName: "", contactPhone: "",
  floors: "", basements: "", addedOnRoof: "", units: "", notHabitable: "", peopleInside: "",
  footprint: "", age: "", construction: [], constructionOther: "", occupancy: [], features: [],
};

/** What the posting step and the map read from a stopped assessment. */
export function stoppedPosting(d: Pick<Draft, "stopped">): Posting | null {
  return d.stopped ? "unsafe" : null;
}

/** Item answers in ATC-20 order, for prompts and the saved record. */
export function answeredItems(items: Record<string, ItemAnswer>) {
  return ITEMS.filter((i) => items[i.id]?.rating).map((i) => ({ item: i, answer: items[i.id] }));
}

/** The saved record as the API returns it. */
export type Assessment = {
  id: string;
  building_id: string;
  inspector_name: string;
  posting: Posting;
  claude_posting: Posting | null;
  overrode_claude: boolean;
  stopped_reason: string | null;
  data: Draft;
  photos: string[];
  created_at: string;
};

export const ASSESSMENT_LIMITS = {
  text: 2000,
  short: 200,
  photos: 40,
} as const;
