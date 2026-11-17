import { NextResponse, type NextRequest } from "next/server";
import { clearedResidentSessionCookie, deleteResidentSession, RESIDENT_SESSION_COOKIE } from "@/lib/session";

/** End this browser's resident session only. Everyone shares one resident, so other visitors stay logged in. */
export async function POST(req: NextRequest) {
  try {
    await deleteResidentSession(req.cookies.get(RESIDENT_SESSION_COOKIE)?.value);
  } catch (err) {
    console.error("resident logout failed:", err instanceof Error ? err.message : err);
  }
  const res = NextResponse.json({ status: "logged out" }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(clearedResidentSessionCookie());
  return res;
}
