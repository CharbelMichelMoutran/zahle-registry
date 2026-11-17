import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection, type NextRequest, type NextResponse } from "next/server";

/**
 * Residents sign in with Supabase Auth (phone one-time code, plan.md item 12).
 * Unlike engineers, everything a resident reads goes through their own session:
 * the publishable key plus their JWT, so row-level security applies in the
 * database (plan rule 2). The browser still talks only to our server; the
 * session lives in httpOnly cookies that only the server reads.
 */

/** The one resident sign-in number: a Supabase test number with a fixed code, so no SMS is sent. */
export const RESIDENT_PHONE = "+15550100000";

type CookieJar = {
  getAll(): { name: string; value: string }[];
  setAll(cookies: { name: string; value: string; options: object }[]): void;
};

function residentClient(jar: CookieJar): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set.");
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => jar.setAll(list),
    },
  });
}

/** For route handlers: reads and writes the session cookies of this request. */
export async function createResidentSupabase() {
  const store = await cookies();
  return residentClient({
    getAll: () => store.getAll(),
    setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
  });
}

/** True if the request carries a Supabase session cookie at all (no network call). */
export const hasResidentCookie = (req: NextRequest) =>
  req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

/**
 * For the proxy: the signed-in resident's user id, or null. Refreshed session
 * cookies are copied onto `res`, so an expiring session renews itself.
 */
export async function residentForProxy(req: NextRequest, res: () => NextResponse) {
  const pending: { name: string; value: string; options: object }[] = [];
  const supabase = residentClient({ getAll: () => req.cookies.getAll(), setAll: (list) => pending.push(...list) });
  const { data } = await supabase.auth.getUser();
  return {
    userId: data.user?.id ?? null,
    /** Apply any refreshed or cleared cookies to the response that is sent. */
    finish(response: NextResponse = res()) {
      for (const { name, value, options } of pending) response.cookies.set(name, value, options);
      return response;
    },
  };
}

/** Every resident data route starts with this. Signed out, nothing is returned (plan rule 2). */
export async function requireResident(): Promise<
  { supabase: SupabaseClient; userId: string; denied?: never } | { supabase?: never; userId?: never; denied: Response }
> {
  const deny = (status: number, error: string) => ({
    denied: Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } }),
  });
  await connection();
  try {
    const supabase = await createResidentSupabase();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return deny(401, "Please log in.");
    return { supabase, userId: data.user.id };
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return deny(500, "Something went wrong. Please try again.");
  }
}
