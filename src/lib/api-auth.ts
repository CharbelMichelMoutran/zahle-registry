import "server-only";
import { connection, type NextRequest } from "next/server";
import type { Engineer } from "./account";
import { engineerForToken, RESIDENT_SESSION_COOKIE, residentForToken, SESSION_COOKIE } from "./session";

/**
 * Every data route starts with this. Before sign-in, or while an account is
 * waiting for approval, no building data is returned (plan rule 2).
 */
export async function requireEngineer(
  req: NextRequest,
): Promise<{ engineer: Engineer; denied?: never } | { engineer?: never; denied: Response }> {
  const deny = (status: number, error: string) => ({
    denied: Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } }),
  });
  await connection(); // always checked at request time, never prerendered
  try {
    const engineer = await engineerForToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (!engineer) return deny(401, "Please log in.");
    if (!engineer.approved) return deny(403, "Your account is waiting for approval.");
    return { engineer };
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return deny(500, "Something went wrong. Please try again.");
  }
}

/**
 * Every resident data route starts with this. Signed out, nothing is returned
 * (plan rule 2). Every query after it is scoped to the returned resident id.
 */
export async function requireResident(
  req: NextRequest,
): Promise<{ residentId: string; denied?: never } | { residentId?: never; denied: Response }> {
  const deny = (status: number, error: string) => ({
    denied: Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } }),
  });
  await connection();
  try {
    const residentId = await residentForToken(req.cookies.get(RESIDENT_SESSION_COOKIE)?.value);
    if (!residentId) return deny(401, "Please log in.");
    return { residentId };
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return deny(500, "Something went wrong. Please try again.");
  }
}
