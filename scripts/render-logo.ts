/**
 * Draw the "Zahle on Record" logo once, into src/components/ui/logo-data.ts
 * (DESIGN.md section 15.2).
 *
 * The construction: the word "Record" (IBM Plex Serif 500) is the solid mark.
 * Behind it, larger, the Arabic زحلة (Amiri, a Naskh display face) is set in
 * river blue at low opacity, its left edge on the R's left edge, its tall
 * strokes rising above the English and the long tail of the ز sweeping under
 * it. Two layers, one lockup: the English reads first, the Arabic is the ground
 * it stands on. The landing ribbon grows out of the tip of that ز tail.
 *
 * The letters are outlined here with HarfBuzz, the shaping engine browsers use,
 * so the Arabic joins exactly as it should (right to left) and the logo draws
 * the same on every device, with no web font to load. Run again only to change
 * the drawing:
 *
 *   npm run render:logo
 *
 * Fonts: Amiri and IBM Plex Serif, SIL Open Font License, from Google Fonts.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as hb from "harfbuzzjs";

const FONTS = {
  arabic: "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf",
  latin: "https://github.com/google/fonts/raw/main/ofl/ibmplexserif/IBMPlexSerif-Medium.ttf",
};
const OUT = "src/components/ui/logo-data.ts";

/** "Record" size in drawing units. Everything else is measured against it. */
const EN_SIZE = 100;

/**
 * Three cuts of the same lockup.
 * - large: landing page and sign-in screens. The Arabic at full presence.
 * - small: the top bar, at about 30 px tall. The Arabic is set smaller against
 *   the English, so "Record" fills more of the height and still reads, and a
 *   touch stronger, so the blue does not turn to mist at that size.
 * - footer: the large drawing, its Arabic waiting in a fainter tone until the
 *   landing ribbon ties back into the ز (Ribbon.tsx).
 *
 * `ar` is the Arabic size against EN_SIZE; `drop` lowers the Arabic baseline
 * under the English one; `opacity` is the Arabic's fill opacity.
 */
const CUTS = {
  large: { ar: 270, drop: 10, opacity: 0.2 },
  small: { ar: 160, drop: 5, opacity: 0.32 },
  footer: { ar: 270, drop: 10, opacity: 0.2 },
} as const;

async function fontFile(url: string) {
  const dir = join(tmpdir(), "zahle-logo-fonts");
  const file = join(dir, decodeURIComponent(url.split("/").pop()!));
  if (!existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not download ${url} (${res.status})`);
    await mkdir(dir, { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  return readFile(file);
}

const num = (n: number) => Number(n.toFixed(2));

type Pt = { x: number; y: number };

/**
 * Shape `text` and return one SVG path, y down, baseline at 0, starting at x = 0,
 * shifted by (dx, dy). Also returns every outline point per glyph, in visual order.
 */
function outline(data: Buffer, text: string, size: number, dx = 0, dy = 0) {
  const face = new hb.Face(new hb.Blob(data));
  const font = new hb.Font(face);
  const s = size / face.upem;
  const buffer = new hb.Buffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const positions = buffer.getGlyphPositions();
  let x = 0;
  let d = "";
  const glyphs: Pt[][] = [];
  buffer.getGlyphInfos().forEach((glyph, i) => {
    const p = positions[i];
    const ox = (x + p.xOffset) * s + dx;
    const oy = -p.yOffset * s + dy;
    const pts: Pt[] = [];
    d += font.glyphToPath(glyph.codepoint).replace(/([MLQCZ])([^MLQCZ]*)/g, (_m: string, cmd: string, args: string) => {
      const n = args.trim() ? args.trim().split(/[ ,]+/).map(Number) : [];
      const out: number[] = [];
      for (let k = 0; k < n.length; k += 2) {
        const X = num(ox + n[k] * s);
        const Y = num(oy - n[k + 1] * s);
        out.push(X, Y);
        pts.push({ x: X, y: Y });
      }
      return cmd + out.join(" ");
    });
    glyphs.push(pts);
    x += p.xAdvance;
  });
  const all = glyphs.flat();
  return {
    d,
    glyphs,
    minX: Math.min(...all.map((q) => q.x)),
    maxX: Math.max(...all.map((q) => q.x)),
    minY: Math.min(...all.map((q) => q.y)),
    maxY: Math.max(...all.map((q) => q.y)),
  };
}

async function main() {
  const [arabicData, latinData] = await Promise.all([fontFile(FONTS.arabic), fontFile(FONTS.latin)]);
  const en = outline(latinData, "Record", EN_SIZE);

  const cuts = Object.fromEntries(
    Object.entries(CUTS).map(([name, c]) => {
      // Measure once, then place: the Arabic's left edge (the ة) on the R's left edge.
      const probe = outline(arabicData, "زحلة", c.ar);
      const ar = outline(arabicData, "زحلة", c.ar, en.minX - probe.minX, c.drop);
      // The ز is the rightmost glyph (last in visual order). The tip of its tail is
      // its leftmost point below the baseline: where the pen lifts off.
      const zay = ar.glyphs[ar.glyphs.length - 1].filter((q) => q.y > c.drop);
      const tip = zay.reduce((a, b) => (b.x < a.x ? b : a));
      const pad = 3;
      const minX = Math.min(en.minX, ar.minX) - pad;
      const minY = Math.min(en.minY, ar.minY) - pad;
      const maxX = Math.max(en.maxX, ar.maxX) + pad;
      const maxY = Math.max(en.maxY, ar.maxY) + pad;
      return [
        name,
        {
          arabic: ar.d,
          opacity: c.opacity,
          /** The tip of the ز tail, where the landing ribbon leaves and returns. */
          tail: tip,
          /** The English baseline runs at y = 0 from here to there: the footer tie lands under it. */
          baseline: { from: num(en.minX), to: num(en.maxX) },
          viewBox: [num(minX), num(minY), num(maxX - minX), num(maxY - minY)] as const,
        },
      ];
    }),
  );

  const body =
    `// Generated by scripts/render-logo.ts. Do not edit by hand; run \`npm run render:logo\`.\n` +
    `// Amiri and IBM Plex Serif outlines, SIL Open Font License.\n\n` +
    `export const LOGO_RECORD = ${JSON.stringify(en.d)};\n\n` +
    `export const LOGO_CUTS = ${JSON.stringify(cuts, null, 2)} as const;\n`;
  await writeFile(OUT, body);
  console.log(`Saved ${OUT}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
