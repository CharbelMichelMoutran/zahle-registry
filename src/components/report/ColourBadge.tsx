import { COLOUR_CONTENT, NOT_YET_INSPECTED } from "@/lib/content";
import type { Colour } from "@/lib/report";

export const DOT_CLASS: Record<Colour, string> = {
  green: "bg-green-600",
  yellow: "bg-yellow-400 ring-1 ring-inset ring-yellow-600/40",
  red: "bg-red-600",
};

/** A colour is never shown alone: always the dot and the word (plan rule 1). */
export function ColourBadge({ colour, long = false }: { colour: Colour; long?: boolean }) {
  const c = COLOUR_CONTENT[colour];
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_CLASS[colour]}`} aria-hidden />
      {long ? c.label : c.word}
    </span>
  );
}

/** Neutral grey, never styled as a warning (plan rule 3). */
export function NotYetInspectedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
      {NOT_YET_INSPECTED}
    </span>
  );
}
