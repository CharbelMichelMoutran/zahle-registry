import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import { claude, claudeAllowed, drawSketch } from "@/lib/claude";
import { visitorHash } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabase-server";

export const maxDuration = 90;

const PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/i;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Redraw the sketch for one stored photo ("Redraw" on the photo card). */
export async function POST(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;
  let path: unknown;
  try {
    path = (await req.json()).path;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (typeof path !== "string" || !PATH.test(path)) return json({ error: "Unknown photo." }, 404);
  if (!claude()) return json({ sketch: null, claudeStatus: "off" });

  try {
    if (!(await claudeAllowed(visitorHash(req.headers), "sketch"))) return json({ sketch: null, claudeStatus: "busy" });
    const file = await createServerSupabase().storage.from("assessment-photos").download(path);
    if (file.error || !file.data) return json({ error: "Unknown photo." }, 404);
    const image = Buffer.from(await file.data.arrayBuffer()).toString("base64");
    const sketch = await drawSketch(image, "image/jpeg");
    return json({ sketch, claudeStatus: sketch ? "ok" : "failed" });
  } catch (err) {
    console.error("drawSketch failed:", err instanceof Error ? err.message : err);
    return json({ sketch: null, claudeStatus: "failed" });
  }
}
