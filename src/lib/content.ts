/**
 * Words on the report form, taken from docs/engineering.md Part A (draft, not yet
 * reviewed by the OEA contact). Change wording here, not in the components.
 */
import type { Area, Colour } from "./report";

export const NOT_YET_VERIFIED = "Not yet verified";
export const NOT_YET_INSPECTED = "Not yet inspected";
export const NOT_INSPECTED = "Not inspected";
/** Shown for an observation left empty (plan section 4, rule 1). */
export const NO_REMARKS = "No remarks";

/**
 * The report page (owner, 17 Nov 2026): short labels only, no help text,
 * examples or prompts. One line by the rating.
 */
export const REPORT_TEXT = {
  ratingLabel: "Rating",
  ratingNote: "Used for triage after an earthquake.",
  date: "Date",
  residents: "Residents",
  built: "Built",
  approximate: "Approx.",
  month: "Month",
  reason: "Reason",
  reasonPlaceholder: "Optional",
  previously: "Was",
  write: "Write…",
  notInspectedReason: "Reason (optional)",
  save: "Save report",
  saving: "Saving…",
  saveAgain: "Save report again",
  saved: "Saved",
  saveFailed: "We could not save this report. Your answers are still here.",
  offline: "We could not reach the registry. Your answers are still here.",
} as const;

/** Shown only after Save, one short line next to the field. */
export const REPORT_ERRORS = {
  date: "Enter a real date.",
  dateTooEarly: (min: number) => `Use a year from ${min}.`,
  dateFuture: "The date cannot be in the future.",
  residents: (max: number) => `Enter a number from 0 to ${max}.`,
  constructionYear: (min: number, max: number) => `Use a year from ${min} to ${max}.`,
  tooLong: (max: number) => `Use at most ${max} characters.`,
  rating: "Choose a rating.",
  reload: "Reload the page and try again.",
};

export const AREA_LABEL: Record<Area, string> = {
  roof: "Roof",
  columns: "Columns",
  foundations: "Foundations",
  final: "Final",
};

/**
 * Ratings are labelled by meaning, never by colour name (owner decision A1).
 * Data values stay green / yellow / red; the colour and arch icon show beside the label.
 */
export const COLOUR_CONTENT: Record<Colour, { word: string; label: string }> = {
  green: {
    word: "Good condition",
    label: "Good condition",
  },
  yellow: {
    word: "Needs some work",
    label: "Needs some work (restricted use)",
  },
  red: {
    word: "Imminent risk",
    label: "Imminent risk (unsafe, do not enter)",
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
    help: "You will use this to sign in. It is not shown on reports. Letters, numbers, dot, dash and underscore only.",
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
  loggedOut: "You have been signed out. Please sign in again.",
  draftLost: "Your draft was not saved.",
};

export const approvedMessage = (name: string) => `Account approved. Welcome, ${name}.`;

/** The small map key in the corner of the engineer map (DESIGN.md 14.10). */
export const MAP_KEY = {
  title: "Map key",
  emtOutline: "Outline: volunteer posting",
  stale: "Inspected more than 6 months ago",
};

/** "Go to building" in the top bar (plan.md item 11, engineer version). Text only, no icon (DESIGN.md 15.2). */
export const LOCATE = {
  button: "Go to building",
  typeAddress: "Type address",
  currentLocation: "Use current location",
} as const;
