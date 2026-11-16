import { NextResponse, type NextRequest } from "next/server";
import { PASSWORD_MAX } from "@/lib/account";
import { LOGIN_TEXT } from "@/lib/content";
import { createSession, verifyPassword } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabase-server";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Log in with username and password. An unknown username and a wrong password
 * get the same message and take the same time. No attempt limit (owner decision).
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 2048) return json({ error: LOGIN_TEXT.wrong }, 401);

  let username = "";
  let password = "";
  try {
    const body = JSON.parse(raw);
    username = String(body.username ?? "").trim();
    password = String(body.password ?? "");
  } catch {
    return json({ error: LOGIN_TEXT.failed }, 400);
  }
  if (!username || !password) return json({ error: LOGIN_TEXT.missing }, 400);

  try {
    const valid = /^[A-Za-z0-9._-]{3,30}$/.test(username) && password.length <= PASSWORD_MAX;
    const { data, error } = valid
      ? await createServerSupabase()
          .from("engineers")
          .select("id, password_hash, approved_at")
          .ilike("username", username.replace(/[_%\\]/g, "\\$&"))
          .maybeSingle<{ id: string; password_hash: string; approved_at: string | null }>()
      : { data: null, error: null };
    if (error) throw new Error(error.message);

    const ok = await verifyPassword(password.slice(0, PASSWORD_MAX), data?.password_hash ?? null);
    if (!ok || !data) return json({ error: LOGIN_TEXT.wrong }, 401);

    const res = json({ status: data.approved_at ? "approved" : "pending" });
    res.cookies.set(await createSession(data.id));
    return res;
  } catch (err) {
    console.error("login failed:", err instanceof Error ? err.message : err);
    return json({ error: LOGIN_TEXT.failed }, 500);
  }
}
