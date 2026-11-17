import type { NextRequest } from "next/server";
import { requireResident } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase-server";

/** Every building outline (geometry only, no rating) for the faint resident map. */
export async function GET(req: NextRequest) {
  const { denied } = await requireResident(req);
  if (denied) return denied;
  const { data, error } = await createServerSupabase().rpc("resident_building_outlines");
  if (error) {
    console.error("resident_building_outlines failed:", error.message);
    return Response.json({ error: "Could not load buildings." }, { status: 500 });
  }
  // Signed-in residents only, so never cached by a shared CDN.
  return Response.json(data, { headers: { "Cache-Control": "private, max-age=3600" } });
}
