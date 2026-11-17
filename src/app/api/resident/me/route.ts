import type { NextRequest } from "next/server";
import { requireResident } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase-server";

/** The signed-in resident's name and their building as `{id, colour}` only, scoped to the session's resident. */
export async function GET(req: NextRequest) {
  const { residentId, denied } = await requireResident(req);
  if (denied) return denied;
  const supabase = createServerSupabase();
  const [resident, building] = await Promise.all([
    supabase.from("residents").select("name").eq("id", residentId).maybeSingle<{ name: string }>(),
    supabase.rpc("resident_building", { p_resident_id: residentId }),
  ]);
  if (resident.error || building.error) {
    console.error("resident me failed:", resident.error?.message ?? building.error?.message);
    return Response.json({ error: "Could not load your account." }, { status: 500 });
  }
  return Response.json(
    { name: resident.data?.name ?? null, building: building.data ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
