"use client";

import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { LOCATE, LOCATION_OFF } from "@/lib/content";
import { springSnappy } from "@/lib/motion";

const ROW =
  "flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-body focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

/**
 * "Locate building" in the top bar: a small popover with "Type address" (not yet
 * available, so inert) and "Use current location". Icon-only below md.
 * On phones the popover hangs from the right edge of the top bar (the nearest
 * positioned parent), so it never runs off the left of a 375px screen.
 *
 * With `waitForLocation` (residents), the menu stays open while the browser is
 * asked for location: `onLocate` resolves false when location is off, and the
 * menu then shows one calm line instead of closing.
 */
export function LocateMenu({
  onLocate,
  waitForLocation = false,
}: {
  onLocate: () => void | Promise<boolean | void>;
  waitForLocation?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [off, setOff] = useState(false);
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
        aria-label={LOCATE.button}
        aria-haspopup="menu"
        aria-expanded={open}
        whileTap={{ scale: 0.97 }}
        transition={springSnappy}
        onClick={() => {
          setOff(false);
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOff(false);
            setOpen(true);
          }
        }}
        className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-control border border-line bg-surface text-body text-ink transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-accent md:px-3"
      >
        <LocateIcon className="h-5 w-5 shrink-0 text-muted" />
        <span aria-hidden className="hidden whitespace-nowrap md:inline">
          {LOCATE.button}
        </span>
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
              aria-busy={busy || undefined}
              onClick={async () => {
                if (!waitForLocation) {
                  close(true);
                  onLocate();
                  return;
                }
                if (busy) return;
                setOff(false);
                setBusy(true);
                const found = await onLocate();
                setBusy(false);
                if (found === false) setOff(true);
                else close(true);
              }}
              className={`${ROW} text-ink hover:bg-surface-soft focus-visible:bg-surface-soft`}
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M16.5 3.5l-5 13-2.2-5.8-5.8-2.2 13-5z" strokeLinejoin="round" />
              </svg>
              {LOCATE.currentLocation}
            </button>
            {waitForLocation && (
              <p role="status" className={off ? "px-3 pt-1 pb-2 text-micro text-muted" : "sr-only"}>
                {off ? LOCATION_OFF : ""}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A crosshair: the usual "find where I am" mark. */
function LocateIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="10" cy="10" r="5.5" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3" strokeLinecap="round" />
    </svg>
  );
}
