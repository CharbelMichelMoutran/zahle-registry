import {
  emptyAnswer,
  EMPTY_FACTS,
  ITEM_BY_ID,
  RATING_LABEL,
  type Assessment,
  type Draft,
  type Facts,
  type Rating,
} from "@/lib/atc20";
import { buildingCentre } from "@/lib/location";
import type { Report } from "@/lib/report";

/**
 * The EMT assessment draft: started with what is already known, filled by
 * Claude, and changed freely by the EMT, whose answers Claude never overwrites.
 * Kept on the phone until it is saved, so a reload or lost signal loses nothing.
 */

const storageKey = (buildingId: string) => `zahle-registry:emt:assessment:${buildingId}`;

export function loadDraft(buildingId: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(storageKey(buildingId));
    const d = raw ? (JSON.parse(raw) as Draft) : null;
    return d?.version === 1 && d.buildingId === buildingId ? d : null;
  } catch {
    return null;
  }
}

export function storeDraft(d: Draft) {
  try {
    window.localStorage.setItem(storageKey(d.buildingId), JSON.stringify(d));
  } catch {}
}

export function clearDraft(buildingId: string) {
  try {
    window.localStorage.removeItem(storageKey(buildingId));
  } catch {}
}

/** Start: Claude fills in what the map and the record already know. */
export function newDraft(buildingId: string, inspector: string, latestReport: Report | null, latestAssessment: Assessment | null): Draft {
  const centre = buildingCentre(buildingId);
  const before = latestAssessment?.data.facts;
  // A field taken from an earlier visit counts as Claude's fill: the EMT checks it.
  const facts: Facts = {
    ...EMPTY_FACTS,
    ...(before ?? {}),
    governorate: "Bekaa",
    district: "Zahle",
    municipality: "Zahle",
    lat: centre ? centre.lat.toFixed(6) : before?.lat ?? "",
    lng: centre ? centre.lng.toFixed(6) : before?.lng ?? "",
    peopleInside: "",
  };
  const claudeFacts = Object.entries(facts)
    .filter(([k, v]) => k !== "peopleInside" && (Array.isArray(v) ? v.length > 0 : v !== ""))
    .map(([k]) => k);

  const lastDate = [latestAssessment?.created_at.slice(0, 10), latestReport?.report_date].filter(Boolean).sort().pop() ?? "";
  return {
    version: 1,
    clientRequestId: crypto.randomUUID(),
    buildingId,
    startedAt: new Date().toISOString(),
    step: "start",
    inspector,
    team: "",
    organization: "Lebanese Red Cross",
    event: "earthquake",
    visit: latestReport || latestAssessment ? "re-inspection" : "first",
    previous: {
      posting: latestAssessment?.posting ?? null,
      inspector: latestAssessment?.inspector_name ?? latestReport?.engineer_name ?? "",
      date: lastDate,
    },
    facts,
    claudeFacts,
    checks: {},
    items: {},
    photos: [],
    sidesSeen: [],
    sidesNotSeen: "",
    gate: null,
    floorsWalked: "",
    areasNotInspected: "",
    claudePosting: null,
    posting: null,
    restrictions: "",
    actions: { barricade: "", engineer: [], shutOff: [], neighbours: false, notify: [], other: "" },
    damage: "",
    comments: "",
    stopped: null,
  };
}

const SEVERITY: Record<Rating, number> = { unseen: 0, none: 1, moderate: 2, severe: 3 };

export type PhotoClaude = {
  caption: string;
  suggestions: { id: string; rating: "none" | "moderate" | "severe"; reason: string }[];
  facts: {
    floors: string | null;
    addedOnRoof: string | null;
    construction: string[];
    occupancy: string[];
    features: string[];
    footprint: string | null;
    age: string | null;
  };
  sketch: Draft["photos"][number]["sketch"];
  next: string;
};

/**
 * Fold one photo's suggestions into the draft. Across photos, the most severe
 * suggestion for an item stands. An item or fact the EMT set is never changed.
 */
export function applyClaude(d: Draft, photoNumber: number, c: PhotoClaude): Draft {
  const items = { ...d.items };
  for (const s of c.suggestions) {
    if (!ITEM_BY_ID[s.id]) continue;
    const prev = items[s.id] ?? emptyAnswer();
    const worse = prev.claude === null || SEVERITY[s.rating] >= SEVERITY[prev.claude];
    const claude = worse ? s.rating : prev.claude;
    items[s.id] = {
      ...prev,
      claude,
      rating: prev.by === "emt" ? prev.rating : claude,
      by: prev.by === "emt" ? "emt" : "claude",
      reason: worse ? s.reason : prev.reason,
      photos: prev.photos.includes(photoNumber) ? prev.photos : [...prev.photos, photoNumber],
    };
  }

  const facts = { ...d.facts };
  const claudeFacts = new Set(d.claudeFacts);
  const mayFill = (k: keyof Facts) => claudeFacts.has(k) || (Array.isArray(facts[k]) ? facts[k].length === 0 : facts[k] === "");
  const fill = (k: keyof Facts, v: string | string[] | null) => {
    if (v === null || (Array.isArray(v) && v.length === 0) || !mayFill(k)) return;
    const next = Array.isArray(v) ? [...new Set([...(facts[k] as string[]), ...v])] : v;
    (facts as Record<string, unknown>)[k] = next;
    claudeFacts.add(k);
  };
  fill("floors", c.facts.floors);
  fill("addedOnRoof", c.facts.addedOnRoof);
  fill("construction", c.facts.construction);
  fill("occupancy", c.facts.occupancy);
  fill("features", c.facts.features);
  fill("footprint", c.facts.footprint);
  fill("age", c.facts.age);

  return { ...d, items, facts, claudeFacts: [...claudeFacts] };
}

/** What is already recorded, for Claude's next photo. */
export function knownSoFar(d: Draft): string {
  const lines = Object.entries(d.items)
    .filter(([, a]) => a.rating)
    .map(([id, a]) => `${id} ${ITEM_BY_ID[id]?.label}: ${RATING_LABEL[a.rating!]}${a.by === "emt" ? " (set by the EMT)" : ""}`);
  const f = d.facts;
  if (f.floors) lines.push(`Floors above ground: ${f.floors}`);
  if (f.construction.length) lines.push(`Construction: ${f.construction.join(", ")}`);
  return lines.join("\n");
}

/** Shrink a photo on the phone (longest side 1600 px, JPEG) and return it as base64. */
export async function shrinkPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read this photo."))), "image/jpeg", 0.8),
  );
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
