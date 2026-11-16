import { NextResponse, type NextRequest } from "next/server";
import { clearedSessionCookie, deleteSession, SESSION_COOKIE } from "@/lib/session";

/** End the session on the server too, so the old cookie cannot be reused. */
export async function POST(req: NextRequest) {
  try {
    await deleteSession(req.cookies.get(SESSION_COOKIE)?.value);
  } catch (err) {
    console.error("logout failed:", err instanceof Error ? err.message : err);
  }
  const res = NextResponse.json({ status: "logged out" }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(clearedSessionCookie());
  return res;
}
