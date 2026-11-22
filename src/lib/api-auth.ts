import "server-only";
import { connection, type NextRequest } from "next/server";
import type { Engineer } from "./account";
import { LOGIN_FROZEN, MAP_HEADER, mapNamed } from "./maps";
import { demoEngineer, engineerForToken, SESSION_COOKIE } from "./session";

/**
 * Every data route starts with this. Before sign-in, or while an account is
 * waiting for approval, no building data is returned (plan rule 2). While login
 * is frozen, the request is signed by the stand-in account of the map it came from.
 */
export async function requireEngineer(
  req: NextRequest,
): Promise<{ engineer: Engineer; denied?: never } | { engineer?: never; denied: Response }> {
  const deny = (status: number, error: string) => ({
    denied: Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } }),
  });
  await connection(); // always checked at request time, never prerendered
  try {
    const engineer = LOGIN_FROZEN
      ? await demoEngineer(mapNamed(req.headers.get(MAP_HEADER)))
      : await engineerForToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (!engineer) {
      if (LOGIN_FROZEN) throw new Error("stand-in account missing: apply migration 20261122000100_demo_accounts");
      return deny(401, "Please sign in.");
    }
    if (!engineer.approved) return deny(403, "Your account is waiting for approval.");
    return { engineer };
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return deny(500, "Something went wrong. Please try again.");
  }
}
