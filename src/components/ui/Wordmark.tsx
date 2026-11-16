/**
 * Bilingual wordmark (DESIGN.md section 1.1): "zahle / building / registry"
 * stacked on the left, زحلة large on the right.
 */
export function Wordmark({ size = "large" }: { size?: "large" | "small" }) {
  if (size === "small") {
    return (
      <span className="inline-flex items-baseline gap-2 whitespace-nowrap" aria-label="Zahle Building Registry">
        <span className="font-heading text-body font-semibold lowercase tracking-tight text-ink">
          zahle building registry
        </span>
        <span lang="ar" dir="rtl" className="font-arabic text-lead font-semibold text-ink">
          زحلة
        </span>
      </span>
    );
  }
  return (
    <div className="flex items-center gap-4" aria-label="Zahle Building Registry">
      <span className="font-heading text-title leading-[22px] font-semibold lowercase tracking-tight text-ink">
        zahle
        <br />
        building
        <br />
        registry
      </span>
      <span aria-hidden className="h-14 w-px bg-line" />
      <span lang="ar" dir="rtl" className="font-arabic text-[52px] leading-none font-semibold text-ink">
        زحلة
      </span>
    </div>
  );
}
