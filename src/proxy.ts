import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_FROZEN } from "@/lib/maps";
import { engineerForToken, SESSION_COOKIE } from "@/lib/session";

const MAP_PAGES = new Set(["/engineer", "/emt"]);

/**
 * Page access, checked on the server before any page renders.
 *
 * While login is frozen (src/lib/maps.ts): the landing page at / and both maps
 * are open to anyone; every other page sends you to /.
 *
 * With login on (plan rule 2):
 * - signed out: the landing page at /, /login and /signup
 * - engineer waiting for approval: only /waiting
 * - approved engineer: the maps; the sign-in pages send them to the engineer map
 * Data routes check the session themselves with src/lib/api-auth.ts.
 */
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const go = (to: string) => NextResponse.redirect(new URL(to, req.url));

  if (LOGIN_FROZEN) return path === "/" || MAP_PAGES.has(path) ? NextResponse.next() : go("/");

  let engineer = null;
  try {
    engineer = await engineerForToken(req.cookies.get(SESSION_COOKIE)?.value);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
  }
  const isAuthPage = path === "/login" || path === "/signup";

  if (engineer) {
    if (!engineer.approved) return path === "/waiting" ? NextResponse.next() : go("/waiting");
    if (isAuthPage || path === "/waiting" || path === "/resident") return go("/engineer");
    return NextResponse.next();
  }

  // Signed out. A cookie that no longer matches a session means the session ended: say so once, then drop it.
  const stale = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  let res: NextResponse;
  if (isAuthPage || (path === "/" && !stale)) res = NextResponse.next();
  else res = go(stale ? "/login?expired=1" : "/login");
  if (stale) res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const config = {
  matcher: ["/", "/engineer", "/emt", "/login", "/signup", "/waiting", "/resident", "/welcome"],
};
