"use client";

import { motion } from "motion/react";
import { forwardRef, useEffect } from "react";
import { RESIDENT_TRAY } from "@/lib/content";
import { openInspectionChat } from "@/lib/inspection-chat";
import { springTray } from "@/lib/motion";
import { ColourBadge, NotYetInspectedBadge } from "./report/ColourBadge";
import type { OwnBuilding } from "./ResidentApp";
import { Button, IconButton } from "./ui/Button";

/**
 * The resident's tray (plan.md item 12): their building, its rating as word and
 * arches (rule 1) or "Not yet inspected", and one action, "Request inspection".
 * Placed like the engineer's preview tray: bottom on phones, bottom-left on desktop.
 */
const ResidentTray = forwardRef<HTMLElement, { building: OwnBuilding; onClose: () => void }>(function ResidentTray(
  { building, onClose },
  ref,
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.aside
      ref={ref}
      aria-label={RESIDENT_TRAY.title}
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      exit={{ y: "110%", transition: { ...springTray, restDelta: 1 } }}
      transition={springTray}
      className={[
        "absolute z-[1100] flex flex-col overflow-hidden rounded-[24px] border border-line bg-surface shadow-tray",
        "inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-h-[70dvh] md:right-auto md:bottom-4 md:left-4 md:w-[440px]",
        "[@media(max-height:500px)]:right-auto [@media(max-height:500px)]:w-[min(440px,62vw)] [@media(max-height:500px)]:max-h-[calc(100dvh-4.5rem)]",
      ].join(" ")}
    >
      <header className="flex shrink-0 items-center gap-1 px-4 pt-3">
        <p className="micro-label flex-1 pl-1">{RESIDENT_TRAY.label}</p>
        <IconButton label="Close" onClick={onClose}>
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </IconButton>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pt-1 pb-5">
        <div className="space-y-2">
          <h2 className="font-serif text-title font-medium text-ink">{RESIDENT_TRAY.title}</h2>
          {building.colour ? <ColourBadge colour={building.colour} /> : <NotYetInspectedBadge />}
        </div>
        <div className="border-t border-dashed border-line pt-4">
          <Button className="w-full" onClick={() => openInspectionChat()}>
            {RESIDENT_TRAY.requestInspection}
          </Button>
        </div>
      </div>
    </motion.aside>
  );
});
export default ResidentTray;
