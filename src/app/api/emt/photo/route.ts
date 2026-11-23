import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import { PHOTO_PROMPTS, type Walk } from "@/lib/atc20";
import { assessPhoto, claude, claudeAllowed } from "@/lib/claude";
import { visitorHash } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabase-server";

export const maxDuration = 120;

const BUCKET = "assessment-photos";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A path we wrote: `<building id>/<uuid>.jpg`. */
const PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/i;
/** Photos are shrunk on the phone to about 300 KB; base64 adds a third. */
const MAX_IMAGE_CHARS = 4 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Store one assessment photo, then ask Claude what it shows. The photo is kept
 * even if Claude is not connected or fails: the EMT then fills in by hand.
 */
export async function POST(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;

  let body: { buildingId?: unknown; walk?: unknown; prompt?: unknown; image?: unknown; known?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const { buildingId, walk, prompt, image, known } = body;
  if (typeof buildingId !== "string" || !UUID.test(buildingId)) return json({ error: "Unknown building." }, 404);
  if (walk !== "outside" && walk !== "inside") return json({ error: "Invalid request." }, 400);
  if (typeof image !== "string" || image.length === 0 || image.length > MAX_IMAGE_CHARS) {
    return json({ error: "This photo is too large. Try again." }, 413);
  }
  const promptText =
    typeof prompt === "string" && prompt.length <= 300 ? prompt : PHOTO_PROMPTS[walk as Walk][0].text;
  const knownText = typeof known === "string" ? known.slice(0, 6000) : "";

  const bytes = Buffer.from(image, "base64");
  // JPEG files start with FF D8 FF.
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return json({ error: "That file is not a photo." }, 415);
  }

  const path = `${buildingId}/${randomUUID()}.jpg`;
  const upload = await createServerSupabase().storage.from(BUCKET).upload(path, bytes, { contentType: "image/jpeg" });
  if (upload.error) {
    console.error("photo upload failed:", upload.error.message);
    return json({ error: "Could not save the photo. Check your signal and try again." }, 500);
  }

  if (!claude()) return json({ path, claude: null, claudeStatus: "off" });
  try {
    if (!(await claudeAllowed(visitorHash(req.headers), "photo"))) {
      return json({ path, claude: null, claudeStatus: "busy" });
    }
    const result = await assessPhoto({ image, walk: walk as Walk, prompt: promptText, known: knownText });
    return json({ path, claude: result, claudeStatus: result ? "ok" : "failed" });
  } catch (err) {
    console.error("assessPhoto failed:", err instanceof Error ? err.message : err);
    return json({ path, claude: null, claudeStatus: "failed" });
  }
}

/** View a stored photo: a short-lived private link. */
export async function GET(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (!PATH.test(path)) return json({ error: "Unknown photo." }, 404);
  const { data, error } = await createServerSupabase().storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) return json({ error: "Unknown photo." }, 404);
  return Response.redirect(data.signedUrl, 302);
}
