"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * The building's report. A side panel on wide screens, a bottom sheet on phones.
 * Empty for now: the building record fills it in a later step.
 */
export default function ReportPanel({ open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <aside
      aria-labelledby="report-heading"
      aria-hidden={!open}
      inert={!open}
      className={[
        "absolute z-[1100] flex flex-col bg-white shadow-2xl transition-[transform,visibility] duration-300 ease-out",
        // Phone: bottom sheet
        "inset-x-0 bottom-0 h-[45dvh] rounded-t-2xl",
        open ? "visible translate-y-0" : "invisible translate-y-full",
        // Wider screens: side panel on the right
        "md:inset-x-auto md:top-0 md:right-0 md:h-full md:w-[380px] md:rounded-none md:border-l md:border-slate-200",
        open ? "md:translate-x-0" : "md:translate-x-full md:translate-y-0",
      ].join(" ")}
    >
      <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300 md:hidden" aria-hidden />

      <header className="flex items-center justify-between px-5 pt-3 pb-3 md:pt-5">
        <h2 id="report-heading" className="text-lg font-semibold text-slate-900">
          Report
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close report"
          className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="h-full min-h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50" />
      </div>
    </aside>
  );
}
