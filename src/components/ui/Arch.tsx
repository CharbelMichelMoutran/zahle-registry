/**
 * The Zahle three-arch window (DESIGN.md section 2): the one shape in the app.
 * Ratings use three arches of rising fill; the brand mark and empty states use one.
 */
import type { Colour } from "@/lib/report";

/** Filled arches per rating: more filled = more concern. */
const LEVEL: Record<Colour, number> = { green: 1, yellow: 2, red: 3 };

const ARCH = "M1 13V6.5a3.5 3.5 0 0 1 7 0V13Z";

export function RatingArches({
  colour,
  large = false,
  className = "",
}: {
  colour: Colour | null;
  large?: boolean;
  className?: string;
}) {
  const level = colour ? LEVEL[colour] : 0;
  return (
    <svg viewBox="0 0 29 14" className={`${large ? "h-5 w-[41px]" : "h-3.5 w-[29px]"} shrink-0 ${className}`} aria-hidden>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={ARCH}
          transform={`translate(${i * 10} 0)`}
          fill={i < level ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

/** A single-line arch, for the brand mark and empty or waiting states. */
export function ArchMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 28" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 27V12a9 9 0 0 1 18 0v15" strokeLinecap="round" />
      <path d="M1 27h22" strokeLinecap="round" />
    </svg>
  );
}

