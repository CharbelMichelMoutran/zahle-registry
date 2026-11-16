/**
 * Words on the report form, taken from docs/engineering.md Part A (draft, not yet
 * reviewed by the OEA contact). Change wording here, not in the components.
 */
import type { Area, Colour } from "./report";

export const FORM_TITLE = "Create report";
export const DRAFT_BANNER = "Draft template. Not the final report form.";
export const NOT_YET_VERIFIED = "Not yet verified";
export const NOT_YET_INSPECTED = "Not yet inspected";
export const NOT_INSPECTED = "Not inspected";

export const FIELDS = {
  engineerName: {
    label: "Engineer name",
    help: "Your full name as it appears on your OEA registration.",
  },
  engineerContact: {
    label: "Contact (phone or email)",
    help: "How the next engineer can reach you about this report. Only engineers see this.",
  },
  reportDate: {
    label: "Date of report",
    help: "The day you inspected the building. If you are entering an old paper report, use the date written on it. If only the year is known, use 1 January and say so in the final observation.",
  },
  residents: {
    label: "People currently living in the building",
    help: 'Your best count on the day of your visit, from the owner, the doorbell panel or the neighbours. 0 means empty. Tick "Not yet verified" if you could not find out. This is not a census. Do not count people who only work or shop in the building.',
    caveat: "Reported on the day, not checked.",
  },
  construction: {
    label: "Construction date",
    help: 'When the main building was finished, not later added floors. If you do not know, tick "Not yet verified", do not guess. Change it only if you have a document or clear evidence.',
    approximate: "Approximate (estimated)",
  },
  constructionReason: {
    label: "Reason for changing the construction date",
    prompt:
      "Why are you changing it? For example: 'Occupancy certificate dated 1974', 'Owner confirmed, no document', 'Previous report was a rough estimate'.",
  },
  notInspected: {
    label: NOT_INSPECTED,
    help: "Tick this if you could not see or check this part. You must say why.",
    reasonLabel: "Reason it was not inspected",
  },
} as const;

type AreaContent = {
  label: string;
  prompt: string;
  lookAt: string;
  examples: string[];
  note?: string;
};

export const AREA_CONTENT: Record<Area, AreaContent> = {
  roof: {
    label: "Roof",
    prompt: "What did you see on the roof and the top floor? Say where and how bad.",
    lookAt:
      "Water leaks and damp stains on the top-floor ceiling; cracks in the roof slab or at the edges; condition of waterproofing; heavy added loads (water tanks, solar panels, added rooms or floors); parapet and chimney stability; for old stone buildings, the vault or timber roof and any tiles.",
    examples: [
      "Roof slab dry, no visible cracks. Waterproofing in fair condition.",
      "Damp stains on top-floor ceiling, north-east corner. Waterproofing worn. Needs repair before winter.",
      "Added room on the roof, not shown on earlier reports. Weight and connection to the frame not checked.",
      "Parapet cracked at the base, may fall. Needs securing.",
    ],
    note: 'If the roof cannot be reached, do not write a phrase. Tick "Not inspected" and give the reason, for example "Roof locked, no key".',
  },
  columns: {
    label: "Columns",
    prompt: "What did you see on the columns and beams? Say which ones and how bad.",
    lookAt:
      "Cracks (especially diagonal or at column ends); spalled concrete and exposed or rusted rebar; leaning or bulging; short or slender columns; a weak ground floor (open parking or shops with few walls); columns changed or removed for shops; for masonry, cracks in load-bearing walls and piers.",
    examples: [
      "Columns visible on ground and first floor, no cracks seen. Concrete in good condition.",
      "Rusted rebar exposed on two ground-floor columns, concrete spalling. Needs repair.",
      "Diagonal cracks at the top of three ground-floor columns (shop side). Serious. Recommend propping and a detailed study.",
      "Ground floor open for parking with few walls. Weak storey in an earthquake. Needs a study.",
      "Only the ground-floor columns are visible. Upper columns are behind finishes and were not seen.",
    ],
    note: 'If no columns can be seen, tick "Not inspected" instead.',
  },
  foundations: {
    label: "Foundations",
    prompt:
      "What did you see at the foundations and the ground around the building? If you could not see them, say so.",
    lookAt:
      "Settlement, cracks running from the base upward; signs of water or poor drainage near the base; erosion or a cut slope or retaining wall next to the building; neighbouring excavation; visible footings in basements; whether foundations could be seen at all.",
    examples: [
      "Foundations not visible. Ground-floor walls and floor show no settlement cracks.",
      "Vertical crack running from ground to first floor at the corner. Possible settlement. Monitor and recheck.",
      "Excavation next to the north wall, depth about 3 m. Recommend checking support of the foundation.",
      "Water pooling at the base on the west side. Drainage needs to be fixed.",
      "Basement foundation walls dry, no cracks. Good condition.",
    ],
  },
  final: {
    label: "Final observation",
    prompt:
      "Your overall view of the building, and what you recommend. This is what the colour is based on.",
    lookAt:
      "How the three observations fit together; what the main concern is; what should happen next and how soon; what you could not check.",
    examples: [
      "No significant defects seen in the parts inspected. Routine maintenance only. Foundations not visible.",
      "Needs repair of roof waterproofing and two columns within the year. Safe to use meanwhile. Recheck after work.",
      "Serious damage to ground-floor columns. Restrict use of the ground floor. Detailed engineering study needed.",
      "Imminent risk. Recommend people leave. Authority informed on [date].",
      "Inspection limited to the exterior. This is not a full structural assessment.",
    ],
  },
};

/** The final observation prompt follows the chosen colour (Part A, D5). */
export const FINAL_PROMPT_BY_COLOUR: Partial<Record<Colour, string>> = {
  yellow: "Which parts or uses are restricted, and what work is needed?",
  red: "What is the danger, and what did you tell the owner or authority?",
};

export const COLOUR_FIELD = {
  label: "Colour rating for natural disasters",
  help: "How the building is rated for natural disasters such as earthquakes, based on your four observations.",
  required: "Choose a colour to save this report.",
  locked: "Complete all four observations to choose a colour.",
  warningTitle: "Choose carefully.",
  warning:
    "After an earthquake, these colours are used to decide which buildings are checked first and who may enter. Good condition means no restriction on use at the time of your visit. It does not mean the building is earthquake-resistant. Choose the colour your observations support. A saved report cannot be changed. If something changes later, add a new report.",
  warningShort:
    "After an earthquake these colours are used for triage. Choose carefully. Your observations are always shown with the colour. A saved report cannot be changed.",
};

/**
 * Ratings are labelled by meaning, never by colour name (owner decision A1).
 * Data values stay green / yellow / red; the colour and arch icon show beside the label.
 */
export const COLOUR_CONTENT: Record<Colour, { word: string; label: string; description: string }> = {
  green: {
    word: "Good condition",
    label: "Good condition",
    description:
      "No serious defect found in the parts you inspected. No restriction on use at the time of your visit.",
  },
  yellow: {
    word: "Needs some work",
    label: "Needs some work (restricted use)",
    description:
      "Defects found. Work is needed. Parts of the building may be used only under the conditions in your observations.",
  },
  red: {
    word: "Imminent risk",
    label: "Imminent risk (unsafe, do not enter)",
    description:
      "Serious danger found. People should not enter or stay, unless the engineer or authority allows it. This is not a demolition order.",
  },
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ---------------------------------------------------------------------------
// Accounts: sign-up, waiting, login (docs/engineering.md D9). No "demo" wording
// anywhere in the app (owner decision, DESIGN.md section 7).
// ---------------------------------------------------------------------------

export const SIGNUP_FIELDS = {
  fullName: {
    label: "Full name",
    help: "Your name as it will appear on every report you write. It cannot be changed later.",
  },
  discipline: {
    label: "Discipline",
    help: "Your profession, as you are registered with the OEA. It is shown next to your name on every report you write and cannot be changed later.",
  },
  contact: {
    label: "Contact number",
    help: "A phone or messaging number. It is shown on your reports to every signed-in engineer, so the next engineer can call you about a building.",
  },
  oeaNumber: {
    label: "OEA membership number",
    help: "Your Order of Engineers and Architects membership number. It is shown on your reports to every signed-in engineer.",
  },
  username: {
    label: "Username",
    help: "You will use this to log in. It is not shown on reports. Letters, numbers, dot, dash and underscore only.",
  },
  password: {
    label: "Password",
    help: "At least 8 characters. Do not use a password from anywhere else. If you forget it there is no reset; create a new account.",
  },
} as const;

export const SIGNUP_ERRORS = {
  missing: "Please fill this in.",
  fullName: "Please enter your full name.",
  discipline: "Choose your discipline.",
  contactEmail: "Enter a phone number. Email addresses are not used.",
  contact: "Enter a phone number: 7 to 20 digits, spaces, plus sign or dashes.",
  oeaNumber: "Use 5 to 12 letters, numbers or dashes.",
  username: "Use 3 to 30 letters, numbers, dots, dashes or underscores.",
  passwordShort: "Use at least 8 characters.",
  passwordLong: (max: number) => `Use at most ${max} characters.`,
};

export const WAITING = {
  title: "Waiting for OEA approval.",
  body: [
    "Your account has been created. Press Refresh to check.",
  ],
};

export const LOGIN_TEXT = {
  wrong: "Username or password is not correct.",
  failed: "Something went wrong. Please try again.",
  missing: "Enter your username and password.",
  forgot: "Forgot your password? There is no reset. Create a new account.",
  loggedOut: "You have been logged out. Please log in again.",
  draftLost: "Your draft was not saved.",
};

export const approvedMessage = (name: string) => `Account approved. Welcome, ${name}.`;
