import { requireResident } from "@/lib/resident-auth";

/** The signed-in resident's name and their building (with its latest rating), read under row-level security. */
export async function GET() {
  const { supabase, userId, denied } = await requireResident();
  if (denied) return denied;
  const [resident, building] = await Promise.all([
    supabase.from("residents").select("name").eq("id", userId).maybeSingle<{ name: string }>(),
    supabase.rpc("my_resident_building"),
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
