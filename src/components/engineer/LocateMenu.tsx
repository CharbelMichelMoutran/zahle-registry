"use client";

import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { LOCATE } from "@/lib/content";
import { springSnappy } from "@/lib/motion";

const ROW =
  "flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-body focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

/**
 * "Go to building" in the top bar: a small popover with "Type address" (not yet
 * available, so inert) and "Use current location". Text only at every width, no
 * icon (DESIGN.md 15.2: a crosshair reads as a gun sight).
 * On phones the popover hangs from the right edge of the top bar (the nearest
 * positioned parent), so it never runs off the left of a 375px screen.
 */
export function LocateMenu({ onLocate }: { onLocate: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    // A click elsewhere closes without pulling focus back; the click target takes it.
    const onDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /** Arrow keys, Home and End move between the rows that can be chosen. */
  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Tab") return setOpen(false);
    const moves: Record<string, (i: number, n: number) => number> = {
      ArrowDown: (i, n) => (i + 1) % n,
      ArrowUp: (i, n) => (i - 1 + n) % n,
      Home: () => 0,
      End: (_, n) => n - 1,
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const rows = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')];
    const i = rows.indexOf(document.activeElement as HTMLElement);
    rows[move(i, rows.length)]?.focus();
  }

  return (
    <div ref={rootRef} className="shrink-0 md:relative">
      <motion.button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        whileTap={{ scale: 0.97 }}
        transition={springSnappy}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="relative flex h-10 items-center justify-center rounded-control px-3 whitespace-nowrap after:-inset-x-0.5 border border-line-strong bg-surface text-body font-medium text-ink shadow-[0_1px_2px_rgb(31_42_55/0.05)] transition-[background-color,border-color] duration-150 ease-out hover:border-[#bcc3cb] hover:bg-surface-soft after:absolute after:-inset-y-0.5 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {LOCATE.button}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={LOCATE.button}
            onKeyDown={onMenuKey}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={springSnappy}
            className="absolute top-full right-0 z-[1300] mt-2 w-64 max-w-[calc(100vw-2rem)] origin-top-right rounded-card border border-line bg-surface p-1.5 shadow-tray"
          >
            <div role="menuitem" aria-disabled="true" className={`${ROW} cursor-default text-stone`}>
              <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M3.5 6.5h13M3.5 10h13M3.5 13.5h7" strokeLinecap="round" />
              </svg>
              {LOCATE.typeAddress}
            </div>
            <button
              role="menuitem"
              type="button"
              autoFocus
              onClick={() => {
                close(true);
                onLocate();
              }}
              className={`${ROW} text-ink hover:bg-surface-soft focus-visible:bg-surface-soft`}
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M16.5 3.5l-5 13-2.2-5.8-5.8-2.2 13-5z" strokeLinejoin="round" />
              </svg>
              {LOCATE.currentLocation}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
