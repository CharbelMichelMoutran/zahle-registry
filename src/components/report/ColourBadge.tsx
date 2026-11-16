import { COLOUR_CONTENT, NOT_YET_INSPECTED } from "@/lib/content";
import type { Colour } from "@/lib/report";
import { RatingArches } from "../ui/Arch";

/** On-screen colour per rating (DESIGN.md section 3, option A): no red. */
export const STATUS_TEXT: Record<Colour, string> = {
  green: "text-vine",
  yellow: "text-apricot",
  red: "text-terracotta",
};
const STATUS_BG: Record<Colour, string> = {
  green: "bg-vine/12 border-vine/30",
  yellow: "bg-apricot/15 border-apricot/40",
  red: "bg-terracotta/12 border-terracotta/35",
};
export const DOT_CLASS: Record<Colour, string> = {
  green: "bg-vine",
  yellow: "bg-apricot",
  red: "bg-terracotta",
};

/** A rating is never shown alone: arches, colour and the word together (plan rule 1). */
export function ColourBadge({ colour, long = false }: { colour: Colour; long?: boolean }) {
  const c = COLOUR_CONTENT[colour];
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-2 rounded-full border px-2.5 py-0.5 text-micro font-medium text-ink ${STATUS_BG[colour]}`}
    >
      <RatingArches colour={colour} className={STATUS_TEXT[colour]} />
      {long ? c.label : c.word}
    </span>
  );
}

/** Neutral, with the "unknown" hatch; never styled as a warning (plan rule 3). */
export function NotYetInspectedBadge() {
  return (
    <span className="inline-flex min-h-7 items-center gap-2 rounded-full border border-line bg-surface px-2.5 py-0.5 text-micro font-medium text-muted">
      <span className="hatch h-3.5 w-3.5 rounded-[4px] border border-line" aria-hidden />
      {NOT_YET_INSPECTED}
    </span>
  );
}
