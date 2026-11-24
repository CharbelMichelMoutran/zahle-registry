import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  ACTIONS,
  AGES,
  CONSTRUCTION,
  DAMAGE_ESTIMATES,
  FEATURES,
  FOOTPRINTS,
  GROUP_LABEL,
  ITEMS,
  itemsFor,
  OCCUPANCY,
  POSTINGS,
  RATING_LABEL,
  SCENE_CHECKS,
  type Draft,
  type Sketch,
  type Walk,
} from "./atc20";
import { createServerSupabase } from "./supabase-server";

/**
 * Claude for the EMT assessment and the building debrief (plan.md item 25).
 * The owner chose Claude Sonnet 5.5 (22 Nov 2026); switching to Opus is this one line.
 */
export const CLAUDE_MODEL = "claude-sonnet-5-5";

/** Claude calls per visitor per hour: a cost guard on the open link (the $50 limit is the hard stop). */
const CALLS_PER_HOUR = 150;

let client: Anthropic | null = null;

/** Null until the owner adds ANTHROPIC_API_KEY; the app then works without Claude. */
export function claude(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

/** True if this visitor may make another Claude call this hour; records the call. */
export async function claudeAllowed(ipHash: string, kind: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count, error } = await supabase
    .from("claude_calls")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if (error) throw new Error(`claudeAllowed: ${error.message}`);
  if ((count ?? 0) >= CALLS_PER_HOUR) return false;
  await supabase.from("claude_calls").insert({ ip_hash: ipHash, kind });
  return true;
}

// ---------------------------------------------------------------------------
// Shared instructions
// ---------------------------------------------------------------------------

const ROLE = `You help an emergency medical technician (EMT) from the Lebanese Red Cross carry out an ATC-20 style building safety assessment after an earthquake in Lebanon. The EMT is less trained than a structural engineer. You read their photos and suggest answers; the EMT confirms or changes every one, and their word is final.

Be practical and specific. Judge only what the photo shows. Never guess about parts of the building that are not visible: rate an item only when the photo gives clear evidence, and leave it out otherwise. Common Lebanese construction: reinforced concrete frames with hollow concrete block infill, open ground floors with shops or parking, traditional stone, and floors added on roofs.`;

const itemList = (walk: Walk) =>
  itemsFor(walk)
    .map(
      (i) =>
        `${i.id} (${GROUP_LABEL[i.group]}) ${i.label}. Minor/none: ${i.levels.none} Moderate: ${i.levels.moderate} Severe: ${i.levels.severe}`,
    )
    .join("\n");

const SketchSchema = z.object({
  title: z.string().describe("A few words, e.g. 'Front facade, from the street'"),
  lines: z
    .array(z.object({ x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() }))
    .describe("Outline lines on a 0-100 grid (x right, y down): building edges, floor lines, roof line"),
  boxes: z
    .array(z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number(), label: z.string() }))
    .describe("Rectangles on the 0-100 grid for clear elements: openings, columns, balconies. Label may be empty"),
  marks: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        item: z.string().describe("ATC item id, e.g. S3"),
        rating: z.enum(["moderate", "severe"]),
        note: z.string().describe("Two to six words"),
      }),
    )
    .describe("Where damage is, on the same grid"),
  north: z
    .object({ x: z.number(), y: z.number(), angle: z.number() })
    .nullable()
    .describe("Only if north is known from the photo; otherwise null"),
  street: z.string().nullable().describe("Street side label only if visible; otherwise null"),
});

const SKETCH_RULES = `Draw a simple line sketch of what this one photo shows, as an elevation (facade) or close-up. Use a 0-100 grid. Draw only what is visible: no hidden sides, no invented floors or openings. Mark each damage you rated with its item id. Keep it to the main lines (under 40 lines and 30 boxes).`;

// ---------------------------------------------------------------------------
// One photo: suggestions for the walk's items, building facts, a sketch
// ---------------------------------------------------------------------------

const PhotoSchema = z.object({
  caption: z.string().describe("One plain sentence: what the photo shows"),
  suggestions: z.array(
    z.object({
      id: z.string().describe("ATC item id from the list"),
      rating: z.enum(["none", "moderate", "severe"]),
      reason: z.string().describe("One short sentence the EMT can check against the photo"),
    }),
  ),
  facts: z.object({
    floors: z.string().nullable().describe("Floors above ground, as a number, only if all are visible"),
    addedOnRoof: z.string().nullable().describe("'Yes' if a floor or room was clearly added on the roof, else null"),
    construction: z.array(z.enum(CONSTRUCTION.map((c) => c.id) as [string, ...string[]])),
    occupancy: z.array(z.enum(OCCUPANCY)),
    features: z.array(z.enum(FEATURES)),
    footprint: z.enum(FOOTPRINTS).nullable(),
    age: z.enum(AGES).nullable(),
  }),
  sketch: SketchSchema.nullable(),
  next: z.string().describe("One short instruction for the EMT's next photo on this walk, or an empty string"),
});

export type PhotoResult = z.infer<typeof PhotoSchema>;

export async function assessPhoto(input: {
  image: string;
  walk: Walk;
  prompt: string;
  known: string;
}): Promise<PhotoResult | null> {
  const c = claude();
  if (!c) return null;
  const response = await c.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    output_config: { effort: "medium", format: zodOutputFormat(PhotoSchema) },
    system: ROLE,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: input.image } },
          {
            type: "text",
            text: `Walk: ${input.walk === "outside" ? "outside the building" : "inside the building"}.
The EMT was asked for: ${input.prompt}

ATC-20 items for this walk (rate only those the photo clearly shows):
${itemList(input.walk)}

What is already recorded (do not repeat unless this photo changes it):
${input.known || "Nothing yet."}

Also fill the building facts you can see. ${SKETCH_RULES} Return sketch null if the photo is too unclear to sketch.`,
          },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  const out = response.parsed_output;
  if (!out) return null;
  const allowed = new Set(itemsFor(input.walk).map((i) => i.id));
  return { ...out, suggestions: out.suggestions.filter((s) => allowed.has(s.id)) };
}

/** Redraw the sketch for one stored photo. */
export async function drawSketch(image: string, mediaType: "image/jpeg" | "image/png" | "image/webp"): Promise<Sketch | null> {
  const c = claude();
  if (!c) return null;
  const response = await c.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 6000,
    output_config: { effort: "low", format: zodOutputFormat(SketchSchema) },
    system: ROLE,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
          {
            type: "text",
            text: `${SKETCH_RULES}\nItem ids: ${ITEMS.map((i) => `${i.id} ${i.label}`).join("; ")}.`,
          },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}

// ---------------------------------------------------------------------------
// The posting
// ---------------------------------------------------------------------------

const PostingSchema = z.object({
  posting: z.enum(POSTINGS),
  because: z.array(z.string()).describe("ATC item ids behind the posting"),
  reason: z.string().describe("One or two plain sentences"),
  restrictions: z.string().describe("For Restricted use: what is restricted, exactly as it would be written on the placard. Else empty"),
  damage: z.enum(DAMAGE_ESTIMATES),
  actions: z.object({
    barricade: z.string().describe("Where to barricade, or empty"),
    engineer: z.array(z.enum(ACTIONS.engineer)),
    shutOff: z.array(z.enum(ACTIONS.shutOff)),
    neighbours: z.boolean(),
    notify: z.array(z.enum(ACTIONS.notify)),
    other: z.string(),
  }),
});

export type PostingResult = z.infer<typeof PostingSchema>;

/** A plain-text summary of the draft for Claude (no photos: their captions stand in). */
export function draftSummary(d: Draft): string {
  const lines: string[] = [];
  const f = d.facts;
  lines.push(`Building: ${f.floors || "?"} floors, ${f.basements || "?"} basements, construction ${f.construction.join(", ") || "unknown"}, occupancy ${f.occupancy.join(", ") || "unknown"}, age ${f.age || "unknown"}, features ${f.features.join(", ") || "none noted"}.`);
  lines.push(`Scene safety: ${SCENE_CHECKS.map((s) => `${s.label}: ${d.checks[s.id] ?? "not answered"}`).join("; ")}.`);
  lines.push(`Sides seen: ${d.sidesSeen.join(", ") || "not recorded"}. Not seen: ${d.sidesNotSeen || "-"}. Went inside: ${d.gate ?? "not decided"}.`);
  for (const i of ITEMS) {
    const a = d.items[i.id];
    if (a?.rating) lines.push(`${i.id} ${i.label}: ${RATING_LABEL[a.rating]}${a.reason ? ` (${a.reason})` : ""}`);
  }
  for (const p of d.photos) lines.push(`Photo ${p.number} (${p.walk}): ${p.caption}`);
  if (d.comments) lines.push(`EMT comments: ${d.comments}`);
  return lines.join("\n");
}

export async function suggestPosting(d: Draft): Promise<PostingResult | null> {
  const c = claude();
  if (!c) return null;
  const response = await c.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 6000,
    output_config: { effort: "medium", format: zodOutputFormat(PostingSchema) },
    system: ROLE,
    messages: [
      {
        role: "user",
        content: `Recommend the ATC-20 posting for this building from the assessment below.
ATC-20 guidance: Unsafe when there is an extreme hazard (collapse, a clear lean, severe structural damage, a severe falling or ground hazard). Restricted use when there is a hazard that limits use of part of the building, or when key parts could not be seen. Inspected when no apparent hazard was found. Also recommend the follow-up actions and the damage estimate.

${draftSummary(d)}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}

// ---------------------------------------------------------------------------
// The building debrief
// ---------------------------------------------------------------------------

const DebriefSchema = z.object({
  text: z.string().describe("2 to 4 short lines separated by newlines, under 500 characters"),
});

export async function writeDebrief(record: string): Promise<string | null> {
  const c = claude();
  if (!c) return null;
  const response = await c.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    output_config: { effort: "low", format: zodOutputFormat(DebriefSchema) },
    system:
      "You write the short debrief shown at the top of a building's record in a building registry for Zahle, Lebanon. Engineers and EMTs read it on a phone before the full history. Plain words, no jargon, no markdown. Never add facts that are not in the record.",
    messages: [
      {
        role: "user",
        content: `Write 2 to 4 short lines: the current state (latest posting or rating, who and when), the main damage, what changed since the visit before, and what to do next. Newest record first:\n\n${record}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  const text = response.parsed_output?.text.trim();
  return text ? text.slice(0, 1500) : null;
}

// ---------------------------------------------------------------------------
// The engineer report (plan.md item 27): help only when the engineer asks
// ---------------------------------------------------------------------------

const ENGINEER_ROLE = `You assist a licensed civil or structural engineer in Zahle, Lebanon, who is writing a building condition report for a lasting building registry (in the spirit of ASCE 11 and Eurocode 8 Part 3). The engineer asked for your help; they decide everything, and your text is only a suggestion they may use, change or ignore.

Write as one engineer to another: precise, technical, concise, no filler, no markdown. Judge only what is shown or written. Never invent dimensions, causes or parts that are not visible. Common Lebanese construction: reinforced concrete frames with hollow concrete block infill, open ground floors with shops or parking, traditional stone, and floors added on roofs.`;

const PartPhotoSchema = z.object({
  condition: z.enum(["none", "moderate", "severe"]).nullable().describe("Null if the photo does not show this part clearly"),
  note: z.string().describe("One to three technical sentences on what the photo shows of this part"),
});

export type PartPhotoResult = z.infer<typeof PartPhotoSchema>;

/** Read one photo for one building part: a suggested condition and a short note. */
export async function readPartPhoto(input: {
  image: string;
  part: string;
  note: string;
}): Promise<PartPhotoResult | null> {
  const c = claude();
  if (!c) return null;
  const response = await c.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    output_config: { effort: "medium", format: zodOutputFormat(PartPhotoSchema) },
    system: ENGINEER_ROLE,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: input.image } },
          {
            type: "text",
            text: `Building part: ${input.part}.
Suggest its condition on the ATC-20 scale (Minor/none: no or hairline damage. Moderate: clear damage that needs repair but no loss of capacity. Severe: damage that reduces capacity or is a hazard) and write a short technical note.
The engineer's note so far: ${input.note || "none"}`,
          },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}

const RemarksSchema = z.object({
  remarks: z.string().describe("The observations and remarks section: 3 to 8 sentences, under 1500 characters"),
  actions: z.array(z.string()).describe("Recommended actions, only from the allowed list"),
});

export type RemarksResult = z.infer<typeof RemarksSchema>;

/** Draft the remarks and suggest recommended actions from what the engineer filled in. */
export async function draftRemarks(report: string, allowedActions: readonly string[]): Promise<RemarksResult | null> {
  const c = claude();
  if (!c) return null;
  const response = await c.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    output_config: { effort: "medium", format: zodOutputFormat(RemarksSchema) },
    system: ENGINEER_ROLE,
    messages: [
      {
        role: "user",
        content: `Draft the "Observations and remarks" section of this report: a summary of the findings, the parts of concern, and what could not be inspected. Then suggest recommended actions, choosing only from: ${allowedActions.join(", ")}.

The report so far:
${report}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  const out = response.parsed_output;
  if (!out) return null;
  return { remarks: out.remarks.slice(0, 2000), actions: out.actions.filter((a) => allowedActions.includes(a)) };
}
