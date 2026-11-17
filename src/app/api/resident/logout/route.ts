import { createResidentSupabase } from "@/lib/resident-auth";

/**
 * End this browser's resident session. "local" scope: everyone signs in with the
 * same number, so a global sign-out would log out every other visitor too.
 */
export async function POST() {
  try {
    const supabase = await createResidentSupabase();
    await supabase.auth.signOut({ scope: "local" });
  } catch (err) {
    console.error("resident logout failed:", err instanceof Error ? err.message : err);
  }
  return Response.json({ status: "logged out" }, { headers: { "Cache-Control": "no-store" } });
}
