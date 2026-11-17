import { requireResident } from "@/lib/resident-auth";

/** Every building outline (geometry only, no rating) for the faint resident map. */
export async function GET() {
  const { supabase, denied } = await requireResident();
  if (denied) return denied;
  const { data, error } = await supabase.rpc("resident_building_outlines");
  if (error) {
    console.error("resident_building_outlines failed:", error.message);
    return Response.json({ error: "Could not load buildings." }, { status: 500 });
  }
  // Signed-in residents only, so never cached by a shared CDN.
  return Response.json(data, { headers: { "Cache-Control": "private, max-age=3600" } });
}
