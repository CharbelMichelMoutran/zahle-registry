import { NextResponse, type NextRequest } from "next/server";
import { engineerForToken, RESIDENT_SESSION_COOKIE, residentForToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Page access, checked on the server before any page renders (plan rule 2):
 * - signed out: only /login and /signup
 * - engineer waiting for approval: only /waiting
 * - approved engineer: the engineer map at /; every other page sends them to it
 * - resident: only the resident map at /resident; every other page sends them to it
 * Engineers and residents have separate session cookies and tables, so one can
 * never be read as the other. Data routes check the session themselves with
 * src/lib/api-auth.ts: requireEngineer refuses a resident session, and
 * requireResident scopes everything to the session's resident.
 */
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  let engineer = null;
  try {
    engineer = await engineerForToken(req.cookies.get(SESSION_COOKIE)?.value);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
  }

  const go = (to: string) => NextResponse.redirect(new URL(to, req.url));
  const isAuthPage = path === "/login" || path === "/signup";
  const isResidentPage = path === "/resident";

  if (engineer) {
    if (!engineer.approved) return path === "/waiting" ? NextResponse.next() : go("/waiting");
    if (isAuthPage || path === "/waiting" || isResidentPage) return go("/");
    return NextResponse.next();
  }

  const residentToken = req.cookies.get(RESIDENT_SESSION_COOKIE)?.value;
  if (residentToken) {
    let residentId = null;
    try {
      residentId = await residentForToken(residentToken);
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
    }
    if (residentId) return isResidentPage ? NextResponse.next() : go("/resident");
  }

  // Signed out. A cookie that no longer matches a session means the session ended: say so once, then drop it.
  const staleEngineer = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const stale = staleEngineer || Boolean(residentToken);
  const res = isAuthPage ? NextResponse.next() : go(stale ? "/login?expired=1" : "/login");
  if (staleEngineer) res.cookies.delete(SESSION_COOKIE);
  if (residentToken) res.cookies.delete(RESIDENT_SESSION_COOKIE);
  return res;
}

export const config = {
  matcher: ["/", "/login", "/signup", "/waiting", "/resident"],
};
