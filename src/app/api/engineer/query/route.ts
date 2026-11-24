import type { NextRequest } from "next/server";
import { requireEngineer } from "@/lib/api-auth";
import { loadBuildingFacts } from "@/lib/building-facts";
import { claude, claudeAllowed, readQuery } from "@/lib/claude";
import type { BuildingFacts } from "@/lib/priority";
import { isQueryPreset, type QueryResult } from "@/lib/query";
import { describeFilter, FilterSchema, PRESET_FILTERS, runFilter, type Filter } from "@/lib/query-filter";
import { beirutToday } from "@/lib/record";
import { visitorHash } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabase-server";

export const maxDuration = 60;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const MAX_QUESTION = 500;
const PAGE = 1000; // the most rows the database returns per request

async function allBuildingIds(): Promise<{ id: string }[]> {
  const supabase = createServerSupabase();
  const all: { id: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from("buildings").select("id").order("id").range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    all.push(...data);
    if (data.length < PAGE) return all;
  }
}

/**
 * "Ask" on the engineer map (plan.md items 21 and 29). A ready-made search
 * runs without Claude. A question goes to Claude, which only fills the filter;
 * the filter is checked against its schema and applied here, then ranked by
 * lib/priority.ts.
 */
export async function POST(req: NextRequest) {
  const { denied } = await requireEngineer(req);
  if (denied) return denied;
  let body: { preset?: unknown; question?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  let filter: Filter;
  if (isQueryPreset(body.preset)) {
    filter = PRESET_FILTERS[body.preset];
  } else if (typeof body.question === "string" && body.question.trim()) {
    const question = body.question.trim().slice(0, MAX_QUESTION);
    if (!claude()) return json({ claudeStatus: "off" });
    try {
      if (!(await claudeAllowed(visitorHash(req.headers), "query"))) return json({ claudeStatus: "busy" });
      const read = await readQuery(question, beirutToday());
      // Checked again here: Claude's answer is input like any other.
      const parsed = read ? FilterSchema.safeParse(read) : null;
      if (!parsed?.success) return json({ claudeStatus: "failed" });
      if (!parsed.data.understood) return json({ claudeStatus: "not-understood" });
      filter = parsed.data;
    } catch (err) {
      console.error("readQuery failed:", err instanceof Error ? err.message : err);
      return json({ claudeStatus: "failed" });
    }
  } else {
    return json({ error: "Invalid request." }, 400);
  }

  try {
    const facts = await loadBuildingFacts();
    let others: BuildingFacts[] = [];
    if (filter.mapColour.includes("not_inspected")) {
      const inspected = new Set(facts.map((b) => b.id));
      others = (await allBuildingIds())
        .filter((b) => !inspected.has(b.id))
        .map((b) => ({ id: b.id, name: "", report: null, emt: null, reportCount: 0, assessmentCount: 0 }));
    }
    const { total, rows } = runFilter(facts, filter, () => others);
    const result: QueryResult = { reading: describeFilter(filter), total, rows };
    return json({ result, claudeStatus: "ok" });
  } catch (err) {
    console.error("query failed:", err instanceof Error ? err.message : err);
    return json({ error: "Could not search the record. Please try again." }, 500);
  }
}
