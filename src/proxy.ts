import { NextResponse, type NextRequest } from "next/server";
import { hasResidentCookie, residentForProxy } from "@/lib/resident-auth";
import { engineerForToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Page access, checked on the server before any page renders (plan rule 2):
 * - signed out: only /login and /signup
 * - engineer waiting for approval: only /waiting
 * - approved engineer: the engineer map at /; every other page sends them to it
 * - resident: only the resident map at /resident; every other page sends them to it
 * Data routes check the session themselves: engineer routes with src/lib/api-auth.ts
 * (a resident session is not an engineer session, so they are refused), resident
 * routes with requireResident in src/lib/resident-auth.ts.
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

  let finish = (res: NextResponse) => res;
  if (hasResidentCookie(req)) {
    try {
      const resident = await residentForProxy(req, () => NextResponse.next());
      if (resident.userId) return resident.finish(isResidentPage ? NextResponse.next() : go("/resident"));
      finish = (res) => resident.finish(res); // drops an ended session's cookies
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
    }
  }

  // Signed out. A cookie that no longer matches a session means the session ended: say so once, then drop it.
  const stale = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const res = isAuthPage ? NextResponse.next() : go(stale ? "/login?expired=1" : "/login");
  if (stale) res.cookies.delete(SESSION_COOKIE);
  return finish(res);
}

export const config = {
  matcher: ["/", "/login", "/signup", "/waiting", "/resident"],
};
