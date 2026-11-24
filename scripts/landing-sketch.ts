/**
 * Claude's real sketch of the landing page's damaged-building photo (plan.md
 * item 28): runs the product's own drawSketch once and saves its answer, so the
 * page shows real output, drawn by the app's own SketchView. One Claude call.
 *
 *   npx tsx --env-file=.env.local --conditions=react-server scripts/landing-sketch.ts
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { drawSketch } from "../src/lib/claude";

const jpeg = await sharp("public/landing/damaged-building.webp").jpeg({ quality: 85 }).toBuffer();
const sketch = await drawSketch(jpeg.toString("base64"), "image/jpeg");
if (!sketch) throw new Error("Claude returned no sketch");
writeFileSync("src/lib/landing-sketch.json", JSON.stringify(sketch, null, 2) + "\n");
console.log(`${sketch.title}: ${sketch.lines.length} lines, ${sketch.boxes.length} boxes, ${sketch.marks.length} marks`);
