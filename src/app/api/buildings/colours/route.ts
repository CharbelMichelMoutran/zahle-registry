import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * Per building, the latest engineer report and the latest EMT posting with their days;
 * the app turns them into the map look (lib/record.ts). Buildings with neither are left out (hatch on the map).
 */
export async function GET(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;
  const { data, error } = await createServerSupabase().rpc("building_map_records");

  if (error) {
    console.error("building_map_records failed:", error.message);
    return Response.json({ error: "Could not load building colours." }, { status: 500 });
  }
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
