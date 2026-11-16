import { NextResponse, type NextRequest } from "next/server";
import { engineerForToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Page access, checked on the server before any page renders:
 * - signed out: only /login and /signup
 * - waiting for approval: only /waiting
 * - approved: the map; /login, /signup and /waiting send you to it
 * Data routes check the session themselves (src/lib/api-auth.ts).
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

  if (!engineer) {
    // A cookie that no longer matches a session means the session ended: say so once, then drop it.
    const stale = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
    const res = isAuthPage ? NextResponse.next() : go(stale ? "/login?expired=1" : "/login");
    if (stale) res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  if (!engineer.approved) return path === "/waiting" ? NextResponse.next() : go("/waiting");
  if (isAuthPage || path === "/waiting") return go("/");
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/waiting"],
};
