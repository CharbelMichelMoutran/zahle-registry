"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { springSnappy } from "@/lib/motion";

/** The signed-in person's name with a small menu holding "Log out" (DESIGN.md section 7). */
export function AccountMenu({ name, onLogout }: { name: string | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex min-w-0 justify-end">
      <motion.button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 min-w-0 max-w-[260px] items-center gap-2 rounded-control border border-line bg-surface px-3 text-body text-ink transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-accent"
      >
        <bdi dir="auto" className="truncate">{name ?? "Account"}</bdi>
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={springSnappy}
            className="absolute top-full right-0 z-[1300] mt-2 w-48 origin-top-right rounded-card border border-line bg-surface p-1.5 shadow-tray"
          >
            <button
              role="menuitem"
              type="button"
              autoFocus
              onClick={onLogout}
              className="flex min-h-11 w-full items-center rounded-control px-3 text-left text-body text-ink hover:bg-surface-soft focus-visible:bg-surface-soft focus-visible:outline-none"
            >
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
