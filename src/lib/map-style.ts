/** Footprint colours on the map (DESIGN.md sections 3 and 14.9), shared by the map and its key. */
import type { Shade } from "./record";
import type { Colour } from "./report";

/** Fills: vine green, apricot amber, roof-tile red. */
export const RATING_FILL: Record<Colour, string> = { green: "#1FA971", yellow: "#F5A524", red: "#D6402B" };
/** A darker outline of each fill's own hue. Red's is 7.7:1 on the limestone ground. */
export const RATING_EDGE: Record<Colour, string> = { green: "#137A50", yellow: "#B9740B", red: "#8F2A1C" };
/** Green and amber sit back a little; red is drawn solid, above them. */
export const CALM_FILL_OPACITY = 0.7;
/** Outline width in px: red gets a stronger edge. */
export const RATING_EDGE_WEIGHT: Record<Colour, number> = { green: 1, yellow: 1, red: 2 };

/** Green over 6 months old (plan.md item 26): dark grey, darker than the "Not yet inspected" hatch. */
export const SHADE_FILL: Record<Shade, string> = { ...RATING_FILL, stale: "#4A5059" };
export const SHADE_EDGE: Record<Shade, string> = { ...RATING_EDGE, stale: "#2F343B" };
export const SHADE_EDGE_WEIGHT: Record<Shade, number> = { ...RATING_EDGE_WEIGHT, stale: 1 };
/** An EMT posting colours only the outline, in the bright hue. Red is the thickest and is drawn on top. */
export const EMT_OUTLINE_WEIGHT: Record<Shade, number> = { green: 2.5, yellow: 2.5, stale: 2.5, red: 3 };
