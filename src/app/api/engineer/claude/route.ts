import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import { claude, claudeAllowed, draftRemarks, readPartPhoto } from "@/lib/claude";
import { CLASSIFICATION, detailsSummary, PARTS, RECOMMENDED_ACTIONS, sanitizeDetails } from "@/lib/engineer-report";
import { visitorHash } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabase-server";

export const maxDuration = 120;

const BUCKET = "assessment-photos";
const PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/i;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Whether Claude is connected: the form shows its two links only when it is. */
export async function GET(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;
  return json({ on: claude() !== null });
}

/**
 * Claude lends a hand on the engineer report, only when asked (plan.md item 27):
 * "photo" reads one stored photo for one part; "remarks" drafts the remarks and
 * suggests actions. Every answer is a suggestion the form shows greyed out.
 */
export async function POST(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;
  if (!claude()) return json({ status: "off" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  try {
    if (!(await claudeAllowed(visitorHash(req.headers), `engineer-${body.kind}`))) return json({ status: "busy" });

    if (body.kind === "photo") {
      const part = PARTS.find((p) => p.id === body.part);
      if (!part || typeof body.path !== "string" || !PATH.test(body.path)) return json({ error: "Invalid request." }, 400);
      const file = await createServerSupabase().storage.from(BUCKET).download(body.path);
      if (file.error || !file.data) return json({ error: "Unknown photo." }, 404);
      const image = Buffer.from(await file.data.arrayBuffer()).toString("base64");
      const result = await readPartPhoto({
        image,
        part: part.label,
        note: typeof body.note === "string" ? body.note.slice(0, 2000) : "",
      });
      return json(result ? { status: "ok", result } : { status: "failed" });
    }

    if (body.kind === "remarks") {
      const colour = body.colour;
      const summary = detailsSummary(sanitizeDetails(body.details), {
        classification: colour === "green" || colour === "yellow" || colour === "red" ? CLASSIFICATION[colour] : null,
        remarks: typeof body.remarks === "string" ? body.remarks.slice(0, 2000) : null,
      });
      if (!summary) return json({ status: "empty" });
      const result = await draftRemarks(summary, RECOMMENDED_ACTIONS);
      return json(result ? { status: "ok", result } : { status: "failed" });
    }

    return json({ error: "Invalid request." }, 400);
  } catch (err) {
    console.error("engineer claude failed:", err instanceof Error ? err.message : err);
    return json({ status: "failed" });
  }
}
