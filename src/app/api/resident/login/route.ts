import { cookies } from "next/headers";
import { RESIDENT_NAME_MAX, RESIDENT_SIGN_IN } from "@/lib/content";
import { createResidentSupabase, RESIDENT_PHONE } from "@/lib/resident-auth";
import { clearedSessionCookie, deleteSession, SESSION_COOKIE } from "@/lib/session";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Check the one-time code, start the resident's Supabase session (httpOnly
 * cookies), and save the name they typed to their `residents` row.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 2048) return json({ error: RESIDENT_SIGN_IN.failed }, 400);
  let name = "";
  let code = "";
  try {
    const body = JSON.parse(raw);
    name = String(body.name ?? "").trim();
    code = String(body.code ?? "");
  } catch {
    return json({ error: RESIDENT_SIGN_IN.failed }, 400);
  }
  if (!name) return json({ error: RESIDENT_SIGN_IN.missingName }, 400);
  if (name.length > RESIDENT_NAME_MAX) return json({ error: RESIDENT_SIGN_IN.nameTooLong(RESIDENT_NAME_MAX) }, 400);
  if (!/^\d{6}$/.test(code)) return json({ error: RESIDENT_SIGN_IN.failed }, 400);

  try {
    const supabase = await createResidentSupabase();
    const { error } = await supabase.auth.verifyOtp({ phone: RESIDENT_PHONE, token: code, type: "sms" });
    if (error) {
      console.error("resident verify failed:", error.message);
      return json({ error: RESIDENT_SIGN_IN.failed }, 401);
    }
    // Runs as the resident (row-level security), now that the client holds their session.
    const saved = await supabase.rpc("save_resident_name", { p_name: name });
    if (saved.error) {
      console.error("save_resident_name failed:", saved.error.message);
      await supabase.auth.signOut({ scope: "local" });
      return json({ error: RESIDENT_SIGN_IN.failed }, 500);
    }

    // One role at a time: a leftover engineer session on this browser ends here.
    const store = await cookies();
    const engineerToken = store.get(SESSION_COOKIE)?.value;
    if (engineerToken) {
      await deleteSession(engineerToken).catch(() => {});
      store.set(clearedSessionCookie());
    }
    return json({ status: "signed in" });
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return json({ error: RESIDENT_SIGN_IN.failed }, 500);
  }
}
