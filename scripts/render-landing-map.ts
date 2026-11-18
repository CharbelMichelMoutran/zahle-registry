/**
 * Render the landing page's map picture once, into public/landing/zahle-map-*.webp
 * (DESIGN.md sections 13 and 14.9, item 9).
 *
 * The public landing page must show nothing from our database (plan rule 2), so
 * this picture is drawn only from open sources, never from the registry:
 * - building outlines, the Berdawni and the main roads from OpenStreetMap
 *   (fetched live from the public Overpass API, not from Supabase);
 * - the stage-1 Zahle hillshade (public/map/hillshade-zahle.webp, SRTM via Mapzen).
 * Every footprint is the same grey. There are no ratings and no building ids in
 * the output: it is a flat image.
 *
 * It also writes src/lib/landing-map.json (the picture's size), so the page can
 * reserve its space. Run again only to change the area or the look:
 *
 *   npm run render:landing
 *
 * Map data © OpenStreetMap contributors (ODbL). Terrain: SRTM (USGS) via Mapzen.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Central Zahle and the valley sides around it. South, west, north, east (WGS 84).
const AREA = { south: 33.829, west: 35.874, north: 33.864, east: 35.932 };
const WIDTH = 2400; // the large picture; a 1200 px copy is made for phones

const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Look: cool off-white ground, quiet relief, white roads, a pale river, grey footprints.
const GROUND = "#F6F7F8"; // the page ground (DESIGN.md 15)
const RELIEF_STRENGTH = 0.42; // 0 = no relief, 1 = the hillshade at full strength
const ROAD = "#FFFFFF";
const ROAD_CASING = "#DDE1E6";
const RIVER = "#A9BFD2";
const FOOTPRINT_FILL = "#CDD0D5";
const FOOTPRINT_LINE = "#A3A8B3";

const HILLSHADE_IMAGE = "public/map/hillshade-zahle.webp";
const HILLSHADE_BOUNDS = "src/lib/hillshade-bounds.json";
const OUT_DIR = "public/landing";
const OUT_JSON = "src/lib/landing-map.json";

type LatLon = { lat: number; lon: number };
type Way = { type: "way"; id: number; tags?: Record<string, string>; geometry?: LatLon[] };

// Web Mercator, as a share of the world (0 to 1), so the picture lines up with map tiles.
const mx = (lon: number) => (lon + 180) / 360;
const my = (lat: number) => {
  const r = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
};

const X0 = mx(AREA.west);
const X1 = mx(AREA.east);
const Y0 = my(AREA.north);
const Y1 = my(AREA.south);
const HEIGHT = Math.round((WIDTH * (Y1 - Y0)) / (X1 - X0));
const px = (p: LatLon) => [((mx(p.lon) - X0) / (X1 - X0)) * WIDTH, ((my(p.lat) - Y0) / (Y1 - Y0)) * HEIGHT];

async function fetchOsm(): Promise<Way[]> {
  const bbox = `${AREA.south},${AREA.west},${AREA.north},${AREA.east}`;
  const query = `[out:json][timeout:120];
    (
      way["building"](${bbox});
      way["waterway"~"^(river|stream)$"](${bbox});
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"](${bbox});
    );
    out geom;`;
  for (let attempt = 0; attempt < 9; attempt++) {
    const url = OVERPASS[attempt % OVERPASS.length];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "zahle-registry/0.1 (github.com/CharbelMichelMoutran/zahle-registry)",
        },
        body: new URLSearchParams({ data: query }),
      });
      if (res.ok) return ((await res.json()) as { elements: Way[] }).elements;
      console.warn(`${url} returned ${res.status}; trying again`);
    } catch (err) {
      console.warn(`${url} failed: ${err instanceof Error ? err.message : err}`);
    }
    await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
  }
  throw new Error("No Overpass server answered. Try again later.");
}

const path = (g: LatLon[], close: boolean) =>
  g.map((p, i) => `${i ? "L" : "M"}${px(p).map((v) => v.toFixed(1)).join(" ")}`).join("") + (close ? "Z" : "");

function svgFor(ways: Way[]) {
  const buildings: string[] = [];
  const rivers: string[] = [];
  const roads: { d: string; w: number }[] = [];
  const ROAD_WIDTH: Record<string, number> = { motorway: 7, trunk: 7, primary: 6, secondary: 5, tertiary: 4 };
  for (const w of ways) {
    if (!w.geometry || w.geometry.length < 2) continue;
    const t = w.tags ?? {};
    if (t.building) buildings.push(path(w.geometry, true));
    else if (t.waterway) rivers.push(path(w.geometry, false));
    else if (t.highway) roads.push({ d: path(w.geometry, false), w: ROAD_WIDTH[t.highway] ?? 4 });
  }
  console.log(`${buildings.length} buildings, ${rivers.length} waterways, ${roads.length} roads`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    ${rivers.map((d) => `<path d="${d}" stroke="${RIVER}" stroke-width="5"/>`).join("")}
    ${roads.map((r) => `<path d="${r.d}" stroke="${ROAD_CASING}" stroke-width="${r.w + 2}"/>`).join("")}
    ${roads.map((r) => `<path d="${r.d}" stroke="${ROAD}" stroke-width="${r.w}"/>`).join("")}
  </g>
  <g fill="${FOOTPRINT_FILL}" stroke="${FOOTPRINT_LINE}" stroke-width="1" stroke-linejoin="round">
    ${buildings.map((d) => `<path d="${d}"/>`).join("")}
  </g>
</svg>`;
}

/** The part of the stage-1 hillshade under AREA, softened, at the picture's size. */
async function relief() {
  const b = JSON.parse(await readFile(HILLSHADE_BOUNDS, "utf8")) as { south: number; west: number; north: number; east: number };
  const img = sharp(HILLSHADE_IMAGE);
  const { width = 0, height = 0 } = await img.metadata();
  const hx0 = mx(b.west), hx1 = mx(b.east), hy0 = my(b.north), hy1 = my(b.south);
  const left = Math.round(((X0 - hx0) / (hx1 - hx0)) * width);
  const top = Math.round(((Y0 - hy0) / (hy1 - hy0)) * height);
  const w = Math.round(((X1 - X0) / (hx1 - hx0)) * width);
  const h = Math.round(((Y1 - Y0) / (hy1 - hy0)) * height);
  const k = RELIEF_STRENGTH;
  return sharp(HILLSHADE_IMAGE)
    .extract({ left, top, width: w, height: h })
    .resize(WIDTH, HEIGHT, { kernel: "cubic" })
    .greyscale()
    .linear(k, 255 * (1 - k)) // lighten: flat ground stays white, slopes stay soft
    .toColourspace("srgb")
    .png()
    .toBuffer();
}

async function main() {
  const [ways, shade] = await Promise.all([fetchOsm(), relief()]);
  const svg = Buffer.from(svgFor(ways));
  const picture = await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: GROUND } })
    .composite([{ input: shade, blend: "multiply" }, { input: svg }])
    .png()
    .toBuffer();

  await mkdir(OUT_DIR, { recursive: true });
  await sharp(picture).webp({ quality: 78 }).toFile(`${OUT_DIR}/zahle-map-2400.webp`);
  await sharp(picture).resize(1200).webp({ quality: 80 }).toFile(`${OUT_DIR}/zahle-map-1200.webp`);
  await writeFile(OUT_JSON, JSON.stringify({ width: WIDTH, height: HEIGHT }, null, 2) + "\n");
  console.log(`Saved ${OUT_DIR}/zahle-map-2400.webp and -1200.webp (${WIDTH} x ${HEIGHT}).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
