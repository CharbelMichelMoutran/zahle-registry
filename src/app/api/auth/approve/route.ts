import type { NextRequest } from "next/server";
import { engineerForToken, SESSION_COOKIE } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabase-server";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Simulated OEA approval: pressing Refresh on the waiting screen approves the
 * signed-in account. Stands in for the real membership check (out of scope).
 */
export async function POST(req: NextRequest) {
  try {
    const engineer = await engineerForToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (!engineer) return json({ error: "Please log in." }, 401);
    if (!engineer.approved) {
      const { error } = await createServerSupabase()
        .from("engineers")
        .update({ approved_at: new Date().toISOString() })
        .eq("id", engineer.id)
        .is("approved_at", null);
      if (error) throw new Error(error.message);
    }
    return json({ status: "approved", fullName: engineer.fullName });
  } catch (err) {
    console.error("approve failed:", err instanceof Error ? err.message : err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
