import type { NextRequest } from "next/server";
import { requireResident } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase-server";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Save the building found by location as the resident's building. If they
 * already have one, that one is kept and returned (a building does not change
 * on every login). Scoped to the session's resident.
 */
export async function POST(req: NextRequest) {
  const { residentId, denied } = await requireResident(req);
  if (denied) return denied;
  const raw = await req.text();
  let buildingId = "";
  try {
    buildingId = String(JSON.parse(raw).buildingId ?? "");
  } catch {}
  if (raw.length > 512 || !UUID.test(buildingId)) return json({ error: "Choose a building." }, 400);

  const supabase = createServerSupabase();
  const chosen = await supabase.rpc("choose_resident_building", {
    p_resident_id: residentId,
    p_building_id: buildingId,
  });
  if (chosen.error) {
    console.error("choose_resident_building failed:", chosen.error.message);
    return json({ error: "Could not save your building." }, 500);
  }
  const { data, error } = await supabase.rpc("resident_building", { p_resident_id: residentId });
  if (error) {
    console.error("resident_building failed:", error.message);
    return json({ error: "Could not load your building." }, 500);
  }
  return json(data);
}
