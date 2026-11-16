/**
 * Copy building outlines for central Zahle from OpenStreetMap into Supabase.
 *
 * This is a one-time copy, not a live link: OpenStreetMap ids change when the
 * map is edited, so each building gets its own permanent id in our database
 * and the OSM id is kept only as a reference.
 *
 * Safe to re-run: buildings that were already imported are left untouched.
 *
 *   npm run import:buildings
 */
import { createClient } from "@supabase/supabase-js";
import type { MultiPolygon, Position } from "geojson";

// Central Zahle: south, west, north, east (WGS 84).
const BBOX = [33.835, 35.885, 33.86, 35.92] as const;

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const BATCH_SIZE = 500;

type LatLon = { lat: number; lon: number };
type OsmWay = { type: "way"; id: number; geometry?: LatLon[] };
type OsmRelation = {
  type: "relation";
  id: number;
  members: { type: string; role: string; geometry?: LatLon[] }[];
};
type OsmElement = OsmWay | OsmRelation;
type BuildingRow = { osm_id: string; geometry: MultiPolygon };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Add it to .env.local.`);
  return value;
}

async function fetchOsmBuildings(): Promise<OsmElement[]> {
  const bbox = BBOX.join(",");
  const query = `[out:json][timeout:120];
    (way["building"](${bbox}); relation["building"]["type"="multipolygon"](${bbox}););
    out geom;`;

  // The public Overpass server rate-limits (429) and times out (504) under load; wait and retry.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "zahle-registry/0.1 (github.com/CharbelMichelMoutran/zahle-registry)",
      },
      body: new URLSearchParams({ data: query }),
    });
    if (res.ok) return ((await res.json()) as { elements: OsmElement[] }).elements;

    const busy = res.status === 429 || res.status === 504;
    if (!busy || attempt === 5) {
      throw new Error(`Overpass returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const waitSeconds = 15 * attempt;
    console.log(`Overpass is busy (${res.status}); retrying in ${waitSeconds}s...`);
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
  }
}

const toPosition = (p: LatLon): Position => [p.lon, p.lat];
const samePoint = (a: Position, b: Position) => a[0] === b[0] && a[1] === b[1];
const isClosedRing = (ring: Position[]) => ring.length >= 4 && samePoint(ring[0], ring[ring.length - 1]);

/** Join way segments end to end into closed rings (OSM multipolygon members can be split). */
function assembleRings(segments: Position[][]): Position[][] | null {
  const pending = segments.map((s) => [...s]);
  const rings: Position[][] = [];

  while (pending.length) {
    const ring = pending.shift()!;
    while (!isClosedRing(ring)) {
      const end = ring[ring.length - 1];
      const i = pending.findIndex((s) => samePoint(s[0], end) || samePoint(s[s.length - 1], end));
      if (i === -1) return null; // broken relation; skip it
      const [next] = pending.splice(i, 1);
      if (!samePoint(next[0], end)) next.reverse();
      ring.push(...next.slice(1));
    }
    rings.push(ring);
  }
  return rings;
}

function toRow(el: OsmElement): BuildingRow | null {
  if (el.type === "way") {
    const ring = (el.geometry ?? []).map(toPosition);
    if (!isClosedRing(ring)) return null;
    return { osm_id: `way/${el.id}`, geometry: { type: "MultiPolygon", coordinates: [[ring]] } };
  }

  const segments = (role: string) =>
    el.members
      .filter((m) => m.type === "way" && m.role === role && m.geometry?.length)
      .map((m) => m.geometry!.map(toPosition));

  const outers = assembleRings(segments("outer"));
  const inners = assembleRings(segments("inner")) ?? [];
  if (!outers?.length) return null;

  // Holes go with the first outer ring; PostGIS repairs anything that is not quite right.
  const polygons = outers.map((outer, i) => (i === 0 ? [outer, ...inners] : [outer]));
  return { osm_id: `relation/${el.id}`, geometry: { type: "MultiPolygon", coordinates: polygons } };
}

async function main() {
  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false },
  });

  console.log(`Fetching buildings in bbox ${BBOX.join(", ")} from OpenStreetMap...`);
  const elements = await fetchOsmBuildings();
  const rows = elements.map(toRow).filter((r): r is BuildingRow => r !== null);
  const skipped = elements.length - rows.length;
  console.log(`Found ${elements.length} OSM buildings, ${rows.length} usable (${skipped} skipped as incomplete).`);

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { data, error } = await supabase.rpc("import_osm_buildings", {
      features: rows.slice(i, i + BATCH_SIZE),
    });
    if (error) throw new Error(`Import failed at batch ${i / BATCH_SIZE + 1}: ${error.message}`);
    inserted += data as number;
  }

  const { count, error } = await supabase.from("buildings").select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);

  console.log(`Inserted ${inserted} new buildings (${rows.length - inserted} already present).`);
  console.log(`Buildings in database: ${count}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
