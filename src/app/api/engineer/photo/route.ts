import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase-server";

export { GET } from "../../emt/photo/route";

const BUCKET = "assessment-photos";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Photos are shrunk in the browser to about 300 KB; base64 adds a third. */
const MAX_IMAGE_CHARS = 4 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Store one engineer report photo (plan.md item 27). Claude reads it only when
 * the engineer taps "Read photo" (/api/engineer/claude).
 */
export async function POST(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;

  let body: { buildingId?: unknown; image?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const { buildingId, image } = body;
  if (typeof buildingId !== "string" || !UUID.test(buildingId)) return json({ error: "Unknown building." }, 404);
  if (typeof image !== "string" || image.length === 0 || image.length > MAX_IMAGE_CHARS) {
    return json({ error: "This photo is too large. Try another." }, 413);
  }
  const bytes = Buffer.from(image, "base64");
  // JPEG files start with FF D8 FF.
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return json({ error: "That file is not a photo." }, 415);
  }

  const path = `${buildingId}/${randomUUID()}.jpg`;
  const upload = await createServerSupabase().storage.from(BUCKET).upload(path, bytes, { contentType: "image/jpeg" });
  if (upload.error) {
    console.error("report photo upload failed:", upload.error.message);
    return json({ error: "Could not save the photo. Please try again." }, 500);
  }
  return json({ path });
}
