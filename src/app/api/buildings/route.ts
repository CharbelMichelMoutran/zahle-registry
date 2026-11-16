import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

/** All building outlines as GeoJSON, read from our database (not live OpenStreetMap). */
export async function GET() {
  await connection(); // read the database at request time, not during the build
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc("buildings_geojson");

  if (error) {
    console.error("buildings_geojson failed:", error.message);
    return Response.json({ error: "Could not load buildings." }, { status: 500 });
  }

  return Response.json(data, {
    headers: {
      // Outlines change only when the import script is re-run.
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
