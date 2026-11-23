import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import type { Draft } from "@/lib/atc20";
import { claude, claudeAllowed, suggestPosting } from "@/lib/claude";
import { visitorHash } from "@/lib/session";

export const maxDuration = 90;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Claude's recommended posting, actions and damage estimate for a draft. The EMT may change all of it. */
export async function POST(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;
  const raw = await req.text();
  if (raw.length > 200_000) return json({ error: "This assessment is too large." }, 413);
  let draft: Draft;
  try {
    draft = JSON.parse(raw).draft;
    if (!draft || typeof draft !== "object" || typeof draft.items !== "object" || !Array.isArray(draft.photos)) throw new Error();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!claude()) return json({ result: null, claudeStatus: "off" });
  try {
    if (!(await claudeAllowed(visitorHash(req.headers), "posting"))) return json({ result: null, claudeStatus: "busy" });
    const result = await suggestPosting(draft);
    return json({ result, claudeStatus: result ? "ok" : "failed" });
  } catch (err) {
    console.error("suggestPosting failed:", err instanceof Error ? err.message : err);
    return json({ result: null, claudeStatus: "failed" });
  }
}
