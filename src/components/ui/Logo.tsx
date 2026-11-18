import { useId } from "react";
import { LOGO_ARABIC, LOGO_BLUE, LOGO_CUTS } from "./logo-data";

export type LogoCut = keyof typeof LOGO_CUTS;

/**
 * "Zahle on Record" (DESIGN.md section 15). Arabic زحلة flows into the English
 * "on record": the line leaves the lower stroke of the ح, runs through the tail
 * of ز, turns from ink to river blue, and becomes the line "on record" sits on.
 *
 * Outlined letters (scripts/render-logo.ts), so the Arabic joins correctly and
 * the logo looks the same everywhere. The visible name for assistive tech is
 * "Zahle on Record". Height is set by the caller (className), width follows.
 *
 * `lineClassName` styles the line alone: the landing footer hides it until the
 * ribbon arrives and becomes the line (Ribbon.tsx).
 */
export function Logo({
  cut = "large",
  className = "",
  lineClassName = "",
  title = "Zahle on Record",
}: {
  cut?: LogoCut;
  className?: string;
  lineClassName?: string;
  title?: string | null;
}) {
  const c = LOGO_CUTS[cut];
  const gradient = `logo-line-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox={c.viewBox.join(" ")}
      className={`block w-auto shrink-0 ${className}`}
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-logo-cut={cut}
    >
      <defs>
        <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1={LOGO_BLUE.from} x2={LOGO_BLUE.to} y1="0" y2="0">
          <stop offset="0" stopColor="var(--color-ink)" />
          <stop offset="1" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <path d={c.line} fill={`url(#${gradient})`} className={lineClassName} data-logo-line />
      <path d={LOGO_ARABIC} fill="var(--color-ink)" />
      <path d={c.en} transform={`translate(${c.enX} ${c.enY})`} fill="var(--color-ink)" />
    </svg>
  );
}
