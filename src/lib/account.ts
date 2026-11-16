/**
 * Engineer accounts (docs/engineering.md D9): fields, limits and
 * validation. Shared by the sign-up form and the server.
 */

import { SIGNUP_ERRORS } from "./content";

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
  const e = SIGNUP_ERRORS;
  const name = input.fullName.trim();
  const contact = input.contact.trim();
  const oea = input.oeaNumber.trim();
  const username = input.username.trim();

  if (!name) errors.fullName = e.missing;
  else if (len(name) < 2 || len(name) > 100) errors.fullName = e.fullName;

  if (!DISCIPLINES.includes(input.discipline as Discipline)) errors.discipline = e.discipline;

  if (!contact) errors.contact = e.missing;
  else if (contact.includes("@")) errors.contact = e.contactEmail;
  else if (!/^[0-9 +-]{7,20}$/.test(contact) || !/[0-9]/.test(contact))
    errors.contact = e.contact;

  if (!oea) errors.oeaNumber = e.missing;
  else if (!/^[A-Za-z0-9-]{5,12}$/.test(oea))
    errors.oeaNumber = e.oeaNumber;

  if (!username) errors.username = e.missing;
  else if (!/^[A-Za-z0-9._-]{3,30}$/.test(username))
    errors.username = e.username;

  if (!input.password) errors.password = e.missing;
  else if (input.password.length < 8) errors.password = e.passwordShort;
  else if (input.password.length > PASSWORD_MAX) errors.password = e.passwordLong(PASSWORD_MAX);

  return errors;
}
