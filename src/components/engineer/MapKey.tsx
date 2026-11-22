"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type CSSProperties, useId, useState } from "react";
import { COLOUR_CONTENT, MAP_KEY, NOT_YET_INSPECTED } from "@/lib/content";
import { CALM_FILL_OPACITY, RATING_EDGE, RATING_EDGE_WEIGHT, RATING_FILL } from "@/lib/map-style";
import { springTray } from "@/lib/motion";
import type { Colour } from "@/lib/report";

const ORDER: Colour[] = ["green", "yellow", "red"];

/** Drawn from the same values as the footprints, so the key matches the map exactly. */
function swatch(c: Colour): CSSProperties {
  const alpha = c === "red" ? 1 : CALM_FILL_OPACITY;
  return {
    background: `color-mix(in srgb, ${RATING_FILL[c]} ${alpha * 100}%, transparent)`,
    boxShadow: `inset 0 0 0 ${RATING_EDGE_WEIGHT[c]}px ${RATING_EDGE[c]}`,
  };
}

const STORAGE_KEY = "zahle-registry:map-key-open";

/** Per viewer, in this browser only. Storage can be blocked (private mode), so every access is guarded. */
function readOpen(): boolean {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === "1";
  } catch {}
  // First visit: open on a laptop, folded away on a phone where the map is small.
  return window.matchMedia("(min-width: 768px)").matches;
}
function saveOpen(open: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {}
}

/**
 * The map key (DESIGN.md 14.10): the three ratings with their words, and the
 * hatch for "Not yet inspected". Top-left of the map: clear of the zoom buttons
 * (bottom-right on laptops, top-right on phones), the attribution (bottom-right),
 * the tray (bottom), and the "Go to building" menu (in the top bar). Folds to one button.
 * Claude's orange ring joins the key only once flags exist.
 * Rendered only in the browser (BuildingMap loads with ssr: false), so reading storage here is safe.
 */
export function MapKey() {
  const [open, setOpen] = useState(readOpen);
  const reduceMotion = useReducedMotion();
  const listId = useId();

  const toggle = () => {
    setOpen((o) => {
      saveOpen(!o);
      return !o;
    });
  };

  return (
    <div className="absolute top-16 left-3 z-[1000] overflow-hidden rounded-card border border-line bg-surface shadow-soft md:top-4 md:left-4">
      <motion.button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={listId}
        whileTap={{ scale: 0.97 }}
        transition={springTray}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-card pr-3 pl-3.5 text-body font-medium text-ink transition-colors select-none hover:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden className="flex gap-[3px]">
          {ORDER.map((c) => (
            <span key={c} className="h-3 w-1.5 rounded-[2px]" style={swatch(c)} />
          ))}
        </span>
        <span className="flex-1 text-left">{MAP_KEY.title}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-muted ${reduceMotion ? "" : "transition-transform duration-200 ease-out"} ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <path d="M5.5 8l4.5 4.5L14.5 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            id={listId}
            key="list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { ...springTray, opacity: { duration: 0.15, ease: "easeOut" } }}
            className="overflow-hidden"
          >
            <li className="mx-3.5 border-t border-dashed border-line" aria-hidden />
            {ORDER.map((c, i) => (
              <li key={c} className={`flex items-center gap-2.5 px-3.5 pb-1.5 text-micro text-ink ${i === 0 ? "pt-2.5" : "pt-1.5"}`}>
                <span aria-hidden className="h-3.5 w-3.5 shrink-0 rounded-[3px]" style={swatch(c)} />
                {COLOUR_CONTENT[c].word}
              </li>
            ))}
            <li className="flex items-center gap-2.5 px-3.5 pt-1.5 pb-3 text-micro text-muted">
              <span aria-hidden className="hatch h-3.5 w-3.5 shrink-0 rounded-[3px] border border-line" />
              {NOT_YET_INSPECTED}
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
