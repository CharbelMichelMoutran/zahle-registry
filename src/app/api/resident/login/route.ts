import { NextResponse, type NextRequest } from "next/server";
import { RESIDENT_NAME_MAX, RESIDENT_SIGN_IN } from "@/lib/content";
import {
  clearedSessionCookie,
  createResidentSession,
  deleteResidentSession,
  deleteSession,
  RESIDENT_SESSION_COOKIE,
  SESSION_COOKIE,
} from "@/lib/session";
import { createServerSupabase } from "@/lib/supabase-server";

/** The one resident sign-in number. Every visitor is this same resident (plan.md item 12). */
const RESIDENT_PHONE = "+15550100000";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Log in as the resident. The phone number and code screens are a front-end
 * show only (owner, 17 Nov 2026): no code is checked. Saves the name typed to
 * the one resident row and starts a resident session in our own login system.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 2048) return json({ error: RESIDENT_SIGN_IN.failed }, 400);
  let name = "";
  try {
    name = String(JSON.parse(raw).name ?? "").trim();
  } catch {
    return json({ error: RESIDENT_SIGN_IN.failed }, 400);
  }
  if (!name) return json({ error: RESIDENT_SIGN_IN.missingName }, 400);
  if (name.length > RESIDENT_NAME_MAX) return json({ error: RESIDENT_SIGN_IN.nameTooLong(RESIDENT_NAME_MAX) }, 400);

  try {
    const { data: residentId, error } = await createServerSupabase().rpc("resident_sign_in", {
      p_phone: RESIDENT_PHONE,
      p_name: name,
    });
    if (error || typeof residentId !== "string") throw new Error(`resident_sign_in: ${error?.message}`);

    const res = json({ status: "signed in" });
    // A login replaces this browser's earlier resident session, and ends a leftover engineer session (one role at a time).
    await deleteResidentSession(req.cookies.get(RESIDENT_SESSION_COOKIE)?.value).catch(() => {});
    const engineerToken = req.cookies.get(SESSION_COOKIE)?.value;
    if (engineerToken) {
      await deleteSession(engineerToken).catch(() => {});
      res.cookies.set(clearedSessionCookie());
    }
    res.cookies.set(await createResidentSession(residentId));
    return res;
  } catch (err) {
    console.error("resident login failed:", err instanceof Error ? err.message : err);
    return json({ error: RESIDENT_SIGN_IN.failed }, 500);
  }
}
