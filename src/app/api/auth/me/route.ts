import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";

/** The signed-in engineer's account details, as copied onto their reports. */
export async function GET(req: NextRequest) {
  const { engineer, denied } = await requireEngineer(req);
  if (denied) return denied;
  return Response.json(engineer, { headers: { "Cache-Control": "no-store" } });
}
