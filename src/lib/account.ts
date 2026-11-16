/**
 * Demo engineer accounts (docs/engineering.md D9): fields, limits, wording and
 * validation. Shared by the sign-up form and the server.
 */

export const DISCIPLINES = ["civil", "structural", "architect"] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  civil: "Civil engineer",
  structural: "Structural engineer",
  architect: "Architect",
};

/**
 * Short word after the name in History rows ("Dana Haddad, Structural").
 * Civil-engineer recommendation, built as the default; set to false to drop it.
 */
export const SHOW_DISCIPLINE_IN_HISTORY = true;
export const DISCIPLINE_SHORT: Record<Discipline, string> = {
  civil: "Civil",
  structural: "Structural",
  architect: "Architect",
};

/** Label of the locked engineer box on reports (civil-engineer suggestion; "Engineer" in D2.1). */
export const REPORT_BY_LABEL = "Report by";

/** The engineer as shown on reports. Never includes the username. */
export type Engineer = {
  id: string;
  fullName: string;
  discipline: Discipline;
  contact: string;
  oeaNumber: string;
  approved: boolean;
};

export const DEMO_NOTICE = {
  title: "This is a demo.",
  body: "Use made-up details. Do not enter your real name, phone number, OEA membership number, or a password you use anywhere else. Approval is simulated. The OEA is not involved and does not check anyone here. Demo data may be reset at any time.",
  short: "Demo only. Use made-up details. The OEA is not involved.",
};

export const SIGNUP_FIELDS = {
  fullName: {
    label: "Full name",
    help: "Your name as it will appear on every report you write. It cannot be changed later. Demo: use a made-up name.",
  },
  discipline: {
    label: "Discipline",
    help: "Your profession, as you are registered with the OEA. It is shown next to your name on every report you write and cannot be changed later. In the demo it is not checked. Choose any.",
  },
  contact: {
    label: "Contact number",
    help: "A phone or messaging number. It is shown on your reports to every signed-in engineer, so the next engineer can call you about a building. Demo: use a made-up number such as +961 00 000 000.",
  },
  oeaNumber: {
    label: "OEA membership number",
    help: "Your Order of Engineers and Architects membership number. It is shown on your reports to every signed-in engineer. In the demo it is not checked. Use a made-up number in this form: DEMO-12345.",
  },
  username: {
    label: "Username",
    help: "You will use this to log in. It is not shown on reports. Letters, numbers, dot, dash and underscore only.",
  },
  password: {
    label: "Password",
    help: "At least 8 characters. Do not use a password from anywhere else. If you forget it there is no reset in this demo; create a new account.",
  },
} as const;

export const WAITING = {
  title: "Waiting for OEA approval.",
  body: [
    "Your account has been created. In the real registry, the Order of Engineers and Architects would confirm your membership before you can write reports.",
    "In this demo, approval is simulated. Press Refresh.",
  ],
};

export const LOGIN_TEXT = {
  wrong: "Username or password is not correct.",
  failed: "Something went wrong. Please try again.",
  missing: "Enter your username and password.",
  forgot: "Forgot your password? There is no reset in this demo. Create a new account.",
  loggedOut: "You have been logged out. Please log in again.",
  draftLost: "Your draft was not saved.",
};

export const approvedMessage = (name: string) => `Account approved (demo). Welcome, ${name}.`;

export type SignupInput = {
  fullName: string;
  discipline: string;
  contact: string;
  oeaNumber: string;
  username: string;
  password: string;
};

export const PASSWORD_MAX = 200; // keeps hashing cost bounded

const len = (s: string) => [...s].length;

/** Field errors, worded as in D9.2. */
export function validateSignup(input: SignupInput): Partial<Record<keyof SignupInput, string>> {
  const errors: Partial<Record<keyof SignupInput, string>> = {};
  const missing = "Please fill this in.";
  const name = input.fullName.trim();
  const contact = input.contact.trim();
  const oea = input.oeaNumber.trim();
  const username = input.username.trim();

  if (!name) errors.fullName = missing;
  else if (len(name) < 2 || len(name) > 100) errors.fullName = "Please enter your full name.";

  if (!DISCIPLINES.includes(input.discipline as Discipline)) errors.discipline = "Choose your discipline.";

  if (!contact) errors.contact = missing;
  else if (contact.includes("@")) errors.contact = "Enter a phone number. Email addresses are not used in this demo.";
  else if (!/^[0-9 +-]{7,20}$/.test(contact) || !/[0-9]/.test(contact))
    errors.contact = "Enter a phone number: 7 to 20 digits, spaces, plus sign or dashes.";

  if (!oea) errors.oeaNumber = missing;
  else if (!/^[A-Za-z0-9-]{5,12}$/.test(oea))
    errors.oeaNumber = "Use 5 to 12 letters, numbers or dashes, for example DEMO-12345.";

  if (!username) errors.username = missing;
  else if (!/^[A-Za-z0-9._-]{3,30}$/.test(username))
    errors.username = "Use 3 to 30 letters, numbers, dots, dashes or underscores.";

  if (!input.password) errors.password = missing;
  else if (input.password.length < 8) errors.password = "Use at least 8 characters.";
  else if (input.password.length > PASSWORD_MAX) errors.password = `Use at most ${PASSWORD_MAX} characters.`;

  return errors;
}
