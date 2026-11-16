import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase-server";

/** All building outlines as GeoJSON, read from our database (not live OpenStreetMap). */
export async function GET(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc("buildings_geojson");

  if (error) {
    console.error("buildings_geojson failed:", error.message);
    return Response.json({ error: "Could not load buildings." }, { status: 500 });
  }

  return Response.json(data, {
    headers: {
      // Signed-in engineers only, so never cached by a shared CDN. Outlines change
      // only when the import script is re-run, so the browser may keep them for an hour.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
