import { RESIDENT_SIGN_IN } from "@/lib/content";
import { createResidentSupabase, RESIDENT_PHONE } from "@/lib/resident-auth";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Ask Supabase Auth for a one-time code. The number is fixed on the server, so
 * this route can never be used to text anyone else.
 */
export async function POST() {
  try {
    const supabase = await createResidentSupabase();
    const { error } = await supabase.auth.signInWithOtp({ phone: RESIDENT_PHONE });
    if (error) {
      console.error("resident send-code failed:", error.message);
      return json({ error: RESIDENT_SIGN_IN.failed }, 502);
    }
    return json({ status: "sent" });
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return json({ error: RESIDENT_SIGN_IN.failed }, 500);
  }
}
