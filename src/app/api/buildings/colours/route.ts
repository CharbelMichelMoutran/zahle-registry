import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

/** Colour of each building's latest report. Buildings with no report are left out (grey on the map). */
export async function GET() {
  await connection();
  const { data, error } = await createServerSupabase().rpc("building_colours");

  if (error) {
    console.error("building_colours failed:", error.message);
    return Response.json({ error: "Could not load building colours." }, { status: 500 });
  }
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
