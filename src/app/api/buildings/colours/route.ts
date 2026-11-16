import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase-server";

/** Colour of each building's latest report. Buildings with no report are left out (grey on the map). */
export async function GET(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;
  const { data, error } = await createServerSupabase().rpc("building_colours");

  if (error) {
    console.error("building_colours failed:", error.message);
    return Response.json({ error: "Could not load building colours." }, { status: 500 });
  }
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
