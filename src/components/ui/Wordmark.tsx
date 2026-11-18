/**
 * Bilingual wordmark (DESIGN.md sections 1.1 and 14.7): "zahle / building /
 * registry" stacked on the left in Inter Tight, زحلة on the right in Markazi
 * Text 500. The Arabic is set larger than the Latin so the two read with the
 * same darkness, and it is never tracked, slanted or bolded.
 */
export function Wordmark({ size = "large" }: { size?: "large" | "small" }) {
  if (size === "small") {
    return (
      <span className="inline-flex items-center gap-2.5 whitespace-nowrap" role="img" aria-label="Zahle Building Registry">
        <span aria-hidden className="font-heading text-body font-semibold lowercase tracking-tight text-ink">
          zahle<span className="hidden min-[430px]:inline"> building registry</span>
        </span>
        <span aria-hidden className="h-4 w-px bg-line" />
        <span aria-hidden lang="ar" dir="rtl" className="font-arabic-display -mt-0.5 text-title leading-none font-medium text-ink">
          زحلة
        </span>
      </span>
    );
  }
  return (
    <div className="flex items-center gap-4" role="img" aria-label="Zahle Building Registry">
      <span aria-hidden className="font-heading text-title leading-[22px] font-semibold lowercase tracking-tight text-ink">
        zahle
        <br />
        building
        <br />
        registry
      </span>
      <span aria-hidden className="h-14 w-px bg-line" />
      <span aria-hidden lang="ar" dir="rtl" className="font-arabic-display -mt-2 text-[60px] leading-none font-medium text-ink">
        زحلة
      </span>
    </div>
  );
}
