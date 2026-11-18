import { LOGO_CUTS, LOGO_RECORD } from "./logo-data";

export type LogoCut = keyof typeof LOGO_CUTS;

/**
 * "Zahle on Record" (DESIGN.md section 15.2). The word "Record" in IBM Plex
 * Serif is the solid mark; behind it, larger, the Arabic زحلة in river blue at
 * low opacity, its tall strokes above the English and the ز tail sweeping under.
 *
 * Cuts: `large` (landing, sign-in), `small` (top bar, reads at about 30 px
 * tall), `footer` (the landing footer, where the Arabic waits fainter until the
 * ribbon ties back into the ز; see Ribbon.tsx).
 *
 * Outlined letters (scripts/render-logo.ts), so the Arabic joins correctly and
 * the logo looks the same everywhere. The name for assistive tech is
 * "Zahle on Record". Height is set by the caller (className), width follows.
 *
 * `arabicClassName` styles the Arabic layer alone.
 */
export function Logo({
  cut = "large",
  className = "",
  arabicClassName = "",
  title = "Zahle on Record",
}: {
  cut?: LogoCut;
  className?: string;
  arabicClassName?: string;
  title?: string | null;
}) {
  const c = LOGO_CUTS[cut];
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
      <path
        d={c.arabic}
        fill="var(--color-accent)"
        fillOpacity={c.opacity}
        className={arabicClassName}
        data-logo-arabic
      />
      <path d={LOGO_RECORD} fill="var(--color-ink)" />
    </svg>
  );
}
