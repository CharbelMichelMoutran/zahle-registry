import { COLOUR_CONTENT, NOT_YET_INSPECTED } from "@/lib/content";
import type { Colour } from "@/lib/report";
import { RatingArches } from "../ui/Arch";

/** On-screen colour per rating (DESIGN.md section 3). Red is used for "Imminent risk" only. */
export const STATUS_TEXT: Record<Colour, string> = {
  green: "text-vine",
  yellow: "text-apricot",
  red: "text-rooftile",
};
const STATUS_BG: Record<Colour, string> = {
  green: "bg-vine/12 border-vine/30",
  yellow: "bg-apricot/15 border-apricot/40",
  red: "bg-rooftile/12 border-rooftile/35",
};
export const DOT_CLASS: Record<Colour, string> = {
  green: "bg-vine",
  yellow: "bg-apricot",
  red: "bg-rooftile",
};

const SIZE = {
  small: "min-h-7 gap-2 px-2.5 py-0.5 text-micro",
  // The preview tray leads with the status (DESIGN.md 14.9 item 7): the largest thing in it.
  large: "min-h-10 gap-2.5 pr-4 pl-3 py-1 text-lead",
} as const;

/** A rating is never shown alone: arches, colour and the word together (plan rule 1). */
export function ColourBadge({
  colour,
  long = false,
  size = "small",
}: {
  colour: Colour;
  long?: boolean;
  size?: keyof typeof SIZE;
}) {
  const c = COLOUR_CONTENT[colour];
  return (
    <span className={`inline-flex items-center rounded-chip border font-medium text-ink ${SIZE[size]} ${STATUS_BG[colour]}`}>
      <RatingArches colour={colour} large={size === "large"} className={STATUS_TEXT[colour]} />
      {long ? c.label : c.word}
    </span>
  );
}

/** Neutral, with the "unknown" hatch; never styled as a warning (plan rule 3). */
export function NotYetInspectedBadge({ size = "small" }: { size?: keyof typeof SIZE }) {
  return (
    <span className={`inline-flex items-center rounded-chip border border-line bg-surface font-medium text-muted ${SIZE[size]}`}>
      <span className={`hatch shrink-0 rounded-[4px] border border-line ${size === "large" ? "h-5 w-5" : "h-3.5 w-3.5"}`} aria-hidden />
      {NOT_YET_INSPECTED}
    </span>
  );
}
