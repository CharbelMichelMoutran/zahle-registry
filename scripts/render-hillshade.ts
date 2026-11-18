/**
 * Render the Zahle hillshade once, into public/map/hillshade-zahle.webp
 * (DESIGN.md section 14.6, stage 1).
 *
 * Reads AWS Terrain Tiles (Mapzen "Terrarium" elevation, open data, no key),
 * shades them with light from the north-west, and saves a greyscale image that
 * the map lays over the base tiles in "multiply". Flat ground comes out white,
 * so it leaves the map untouched; only slopes turned away from the light darken.
 * The image fades to white at its edges, so the relief has no hard border.
 *
 * It also writes src/lib/hillshade-bounds.json, the image's corners, so the map
 * places it exactly. Run again only to change the area or the look:
 *
 *   npm run render:hillshade
 *
 * Terrain: SRTM terrain data courtesy of the U.S. Geological Survey, via Mapzen.
 */
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const ZOOM = 14; // about 8 m per pixel; the source data (SRTM, about 30 m) has no finer detail
const TILE = 256;

// The map's area (ZAHLE_BOUNDS in BuildingMap.tsx) plus a margin, so the relief
// still reaches the screen edge at the widest view. South, west, north, east.
const AREA = { south: 33.785, west: 35.82, north: 33.91, east: 35.985 };

const LIGHT_AZIMUTH = 315; // degrees clockwise from north: north-west
const LIGHT_ALTITUDE = 45; // degrees above the horizon
const EXAGGERATION = 1.4; // gentle; keeps the steep valley sides from going black
const FADE = 0.14; // share of each side over which the relief fades out
const SMOOTH_RADIUS = 2; // px; three box blurs of this radius remove SRTM speckle on the flat plain
const NOISE_FLOOR = 0.1; // shading lighter than this is left white
const QUALITY = 72;

const OUT_IMAGE = "public/map/hillshade-zahle.webp";
const OUT_BOUNDS = "src/lib/hillshade-bounds.json";

const tileX = (lng: number) => Math.floor(((lng + 180) / 360) * 2 ** ZOOM);
const tileY = (lat: number) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** ZOOM);
};
const tileLng = (x: number) => (x / 2 ** ZOOM) * 360 - 180;
const tileLat = (y: number) => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** ZOOM;
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
};

async function fetchTile(x: number, y: number): Promise<Float32Array> {
  const url = TILE_URL.replace("{z}", String(ZOOM)).replace("{x}", String(x)).replace("{y}", String(y));
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const { data } = await sharp(Buffer.from(await res.arrayBuffer()))
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const heights = new Float32Array(TILE * TILE);
      for (let i = 0; i < heights.length; i++) {
        // Terrarium: metres = (R * 256 + G + B / 256) - 32768
        heights[i] = data[i * 3] * 256 + data[i * 3 + 1] + data[i * 3 + 2] / 256 - 32768;
      }
      return heights;
    } catch (err) {
      if (attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

/** In-place box blur, rows then columns. Three passes approximate a Gaussian. */
function boxBlur(grid: Float32Array, width: number, height: number, r: number) {
  const line = new Float32Array(Math.max(width, height));
  const run = (get: (i: number) => number, set: (i: number, v: number) => void, n: number) => {
    for (let i = 0; i < n; i++) line[i] = get(i);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += line[Math.min(n - 1, Math.max(0, i + k))];
      set(i, sum / (2 * r + 1));
    }
  };
  for (let y = 0; y < height; y++) run((i) => grid[y * width + i], (i, v) => (grid[y * width + i] = v), width);
  for (let x = 0; x < width; x++) run((i) => grid[i * width + x], (i, v) => (grid[i * width + x] = v), height);
}

async function main() {
  const x0 = tileX(AREA.west);
  const x1 = tileX(AREA.east);
  const y0 = tileY(AREA.north);
  const y1 = tileY(AREA.south);
  const cols = x1 - x0 + 1;
  const rows = y1 - y0 + 1;
  const width = cols * TILE;
  const height = rows * TILE;
  console.log(`Fetching ${cols * rows} elevation tiles at zoom ${ZOOM} (${width} x ${height} px)…`);

  // Stitch the tiles into one height grid.
  const z = new Float32Array(width * height);
  const jobs: Promise<void>[] = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      jobs.push(
        fetchTile(tx, ty).then((tile) => {
          const ox = (tx - x0) * TILE;
          const oy = (ty - y0) * TILE;
          for (let r = 0; r < TILE; r++) z.set(tile.subarray(r * TILE, (r + 1) * TILE), (oy + r) * width + ox);
        }),
      );
    }
  }
  await Promise.all(jobs);
  for (let pass = 0; pass < 3; pass++) boxBlur(z, width, height, SMOOTH_RADIUS);

  const north = tileLat(y0);
  const south = tileLat(y1 + 1);
  const west = tileLng(x0);
  const east = tileLng(x1 + 1);
  const midLat = ((north + south) / 2) * (Math.PI / 180);
  const cell = (156543.03392 * Math.cos(midLat)) / 2 ** ZOOM; // metres per pixel on the ground

  // Light direction: x east, y north, z up.
  const az = (LIGHT_AZIMUTH * Math.PI) / 180;
  const alt = (LIGHT_ALTITUDE * Math.PI) / 180;
  const lx = Math.sin(az) * Math.cos(alt);
  const ly = Math.cos(az) * Math.cos(alt);
  const lz = Math.sin(alt);

  const at = (x: number, y: number) =>
    z[Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const out = Buffer.alloc(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Horn's method: slope from the 3 x 3 neighbourhood.
      const a = at(x - 1, y - 1), b = at(x, y - 1), c = at(x + 1, y - 1);
      const d = at(x - 1, y), f = at(x + 1, y);
      const g = at(x - 1, y + 1), h = at(x, y + 1), i = at(x + 1, y + 1);
      const dzEast = ((c + 2 * f + i) - (a + 2 * d + g)) / (8 * cell);
      const dzNorth = ((a + 2 * b + c) - (g + 2 * h + i)) / (8 * cell); // rows run south
      const nx = -dzEast * EXAGGERATION;
      const ny = -dzNorth * EXAGGERATION;
      const len = Math.hypot(nx, ny, 1);
      const shade = Math.max(0, (nx * lx + ny * ly + lz) / len);
      // Flat ground = 1 (white, no change under multiply); lit slopes stay white.
      let v = Math.min(1, shade / lz);
      // Drop the faintest shading: SRTM noise on the flat plain, not real relief.
      v = 1 - Math.max(0, 1 - v - NOISE_FLOOR) / (1 - NOISE_FLOOR);

      // Fade to white towards the edges.
      const edge = Math.min(x / width, (width - 1 - x) / width, y / height, (height - 1 - y) / height) / FADE;
      v = 1 - (1 - v) * smooth(Math.min(1, Math.max(0, edge)));
      out[y * width + x] = Math.round(v * 255);
    }
  }

  await mkdir("public/map", { recursive: true });
  const info = await sharp(out, { raw: { width, height, channels: 1 } })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(OUT_IMAGE);
  const bounds = { south, west, north, east, zoom: ZOOM };
  await writeFile(OUT_BOUNDS, JSON.stringify(bounds, null, 2) + "\n");
  console.log(`Saved ${OUT_IMAGE}: ${info.width} x ${info.height}, ${(info.size / 1024).toFixed(0)} KB`);
  console.log(`Saved ${OUT_BOUNDS}:`, bounds);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
