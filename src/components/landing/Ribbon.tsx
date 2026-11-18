"use client";

import { animate, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LANDING } from "@/lib/content";
import { LOGO_BLUE, LOGO_CUTS } from "../ui/logo-data";

/**
 * The river-blue ribbon on the landing page (DESIGN.md section 15).
 *
 * It grows out of the end of the logo's line, top left, and runs down the text
 * column: beside the text, never over it, swinging into the open space between
 * blocks and passing behind the product pictures. It draws as the visitor
 * scrolls and never undraws (the record is kept). At the bottom it ties into the
 * footer logo and becomes the logo's line, with Zahle's altitude and coordinates
 * written along it.
 *
 * The route is measured from the page (data-ribbon marks in Landing.tsx), so it
 * follows the real layout at every width. Under reduced motion it is shown
 * fully drawn and tied, with no movement.
 */

type Geometry = {
  w: number;
  h: number;
  stroke: number;
  main: string;
  tie: string;
  /** The stretch the coordinates are written along, left to right. */
  words: string;
  samples: { len: number; y: number }[];
  /** Ink at the ز, river blue a little way out: the ribbon starts as part of the letter. */
  shade: { x1: number; y1: number; x2: number; y2: number };
};

const LARGE = LOGO_CUTS.large;
const [VX, VY, , VH] = LARGE.viewBox;
/**
 * The tip of the ز's tail and the way it points (down and to the left), in logo
 * units, measured from the Markazi outline. The ribbon leaves the logo here, as
 * a hairline from the end of the stroke, the way a pen lifts off a Naskh tail.
 */
const ZAY_TAIL = { x: 243.4, y: 38.6, dx: -0.85, dy: 0.53 };

/** A point given in logo drawing units, placed on the page via the logo's own box. */
function logoPoint(svg: Element, origin: DOMRect, x: number, y: number) {
  const r = svg.getBoundingClientRect();
  const s = r.height / VH;
  return { x: r.left - origin.left + (x - VX) * s, y: r.top - origin.top + (y - VY) * s, s };
}

/** The box around an element's content (its children), so padding does not count as text. */
function box(el: Element | null, origin: DOMRect) {
  if (!el) return null;
  const parts = el.children.length ? Array.from(el.children) : [el];
  const rs = parts.map((c) => c.getBoundingClientRect());
  return {
    left: Math.min(...rs.map((r) => r.left)) - origin.left,
    right: Math.max(...rs.map((r) => r.right)) - origin.left,
    top: Math.min(...rs.map((r) => r.top)) - origin.top,
    bottom: Math.max(...rs.map((r) => r.bottom)) - origin.top,
  };
}

const f = (n: number) => n.toFixed(1);

/** Swing out from a lane into the open space of a vertical gap and back, as an S of two curves. */
function swing(lane: number, top: number, bottom: number, out: number) {
  const g = bottom - top;
  const mid = top + g / 2;
  return (
    `C${f(lane)} ${f(top + g * 0.3)} ${f(out)} ${f(mid - g * 0.28)} ${f(out)} ${f(mid)} ` +
    `C${f(out)} ${f(mid + g * 0.28)} ${f(lane)} ${f(bottom - g * 0.3)} ${f(lane)} ${f(bottom)} `
  );
}

function measure(root: HTMLElement): Geometry | null {
  const o = root.getBoundingClientRect();
  const q = (k: string) => root.querySelectorAll(`[data-ribbon="${k}"]`);
  const headSvg = q("logo")[0]?.querySelector("svg");
  const footSvg = q("footer-logo")[0]?.querySelector("svg");
  const [heroText, showText] = Array.from(q("text")).map((el) => box(el, o)!);
  const cards = box(q("cards")[0], o);
  const aboutTitle = box(q("about-title")[0], o);
  const aboutBody = box(q("about-body")[0], o);
  if (!headSvg || !footSvg || !heroText || !showText || !cards || !aboutTitle || !aboutBody) return null;

  const start = logoPoint(headSvg, o, ZAY_TAIL.x, ZAY_TAIL.y);
  const stroke = Math.max(1.75, LARGE.thickness * start.s);
  const left = heroText.left;
  // The lane beside the text: halfway into the margin, at most 44px from the text.
  const lane = Math.max(stroke + 3, left - Math.min(44, left / 2));
  const wide = aboutBody.left - aboutTitle.right > 48;
  // On laptops the ribbon comes out from behind the pictures in the gap between the About columns.
  const lane2 = wide ? aboutTitle.right + (aboutBody.left - aboutTitle.right) / 2 : lane;
  const col = Math.min(heroText.right - left, 560);

  // Out of the tail, carrying on in its direction, then easing into the lane above the hero text.
  const top = heroText.top - 8;
  // It settles into the lane before the text starts, in one even curve.
  const drop = top - start.y;
  const k = Math.min(56, drop * 0.25);
  let d = `M${f(start.x)} ${f(start.y)} `;
  d += `C${f(start.x + ZAY_TAIL.dx * k)} ${f(start.y + ZAY_TAIL.dy * k)} ${f(lane)} ${f(top - drop * 0.5)} ${f(lane)} ${f(top)} `;
  d += `L${f(lane)} ${f(heroText.bottom)} `;
  // Between the hero and "The record": out into the open column and back.
  const gapTop = heroText.bottom;
  const gapBottom = showText.top - 4;
  // Phones: the map sits in this gap, so the ribbon stays in the margin.
  if (wide && gapBottom - gapTop > 72) d += swing(lane, gapTop, gapBottom, left + col * 0.42);
  else d += `L${f(lane)} ${f(gapBottom)} `;
  d += `L${f(lane)} ${f(cards.top + 56)} `;
  // Behind the pictures, across to the second lane.
  d += `C${f(lane)} ${f(cards.top + 180)} ${f(lane2)} ${f(cards.bottom - 220)} ${f(lane2)} ${f(cards.bottom - 40)} `;

  // Into the footer: the main ribbon ends just below the About text, the tie takes over.
  const footTop = Math.max(aboutTitle.bottom, aboutBody.bottom) + 24;
  d += `L${f(lane2)} ${f(footTop)} `;

  // The tie. Down beside the footer logo, a sweep under it (the coordinates ride on
  // this stretch), a loop at the far end, and back in along the logo's baseline.
  const r = logoPoint(footSvg, o, LARGE.end.x, LARGE.end.y);
  const blue = logoPoint(footSvg, o, LOGO_BLUE.to, LARGE.end.y);
  const base = r.y + 44 * (r.s / 0.3);
  const fall = lane2 + 64;
  const textW = 188;
  const loopX = Math.max(r.x + 44, fall + 12 + textW);
  // Down, a turn into the sweep, then a cursive loop under the sweep that crosses
  // it on the way up and lands on the logo's baseline, heading back into the ز.
  const lx = loopX;
  let t = `M${f(lane2)} ${f(footTop)} `;
  t += `L${f(lane2)} ${f(base - 64)} `;
  t += `C${f(lane2)} ${f(base - 18)} ${f(lane2 + 18)} ${f(base)} ${f(fall)} ${f(base)} `;
  t += `L${f(lx - 24)} ${f(base)} `;
  t += `C${f(lx + 2)} ${f(base)} ${f(lx + 14)} ${f(base + 26)} ${f(lx - 4)} ${f(base + 27)} `;
  t += `C${f(lx - 20)} ${f(base + 28)} ${f(lx - 22)} ${f(base + 8)} ${f(lx - 12)} ${f(base - 8)} `;
  t += `C${f(lx - 2)} ${f(base - 24)} ${f(lx - 8)} ${f(r.y)} ${f(lx - 30)} ${f(r.y)} `;
  t += `L${f(blue.x)} ${f(r.y)}`;
  const words = `M${f(fall + 4)} ${f(base - 6)} L${f(loopX - 20)} ${f(base - 6)}`;

  // Sample the main ribbon, so scrolling can be turned into "drawn as far as here".
  const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
  probe.setAttribute("d", d);
  const total = probe.getTotalLength();
  const samples: Geometry["samples"] = [];
  for (let len = 0; len <= total; len += 6) samples.push({ len, y: probe.getPointAtLength(len).y });
  samples.push({ len: total, y: probe.getPointAtLength(total).y });

  const shade = { x1: start.x, y1: start.y, x2: start.x + ZAY_TAIL.dx * 34, y2: start.y + 56 };
  return { w: root.clientWidth, h: root.scrollHeight, stroke, main: d, tie: t, words, samples, shade };
}

export function Ribbon() {
  const ref = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [tied, setTied] = useState(false);
  const drawn = useRef(0); // fraction of the main ribbon drawn; only grows
  const target = useMotionValue(0);
  const progress = useSpring(target, { stiffness: 140, damping: 30, restDelta: 0.0005 });
  const tie = useMotionValue(0);

  // Measure, and measure again when the layout changes size (fonts, images, rotation).
  useLayoutEffect(() => {
    const root = ref.current?.parentElement;
    if (!root) return;
    let frame = 0;
    const run = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setGeo(measure(root)));
    };
    run();
    const ro = new ResizeObserver(run);
    ro.observe(root);
    document.fonts?.ready.then(run).catch(() => {});
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  const update = useCallback(() => {
    const root = ref.current?.parentElement;
    if (!geo || !root) return;
    const vh = window.innerHeight;
    const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 4;
    // The tip leads a little below the middle of the screen.
    const ahead = window.scrollY + vh * 0.62 - (root.getBoundingClientRect().top + window.scrollY);
    const total = geo.samples[geo.samples.length - 1].len;
    let len = 0;
    for (const s of geo.samples) {
      if (s.y > ahead) break;
      len = s.len;
    }
    // A short first stretch is always there, so the ribbon is seen leaving the logo.
    const frac = atBottom ? 1 : Math.max(0.035, len / total);
    if (frac > drawn.current) {
      drawn.current = frac;
      target.set(frac);
    }
    if (atBottom || drawn.current >= 0.999) setTied(true);
  }, [geo, target]);

  useEffect(() => {
    if (reduced) return;
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reduced, update]);

  // The tie plays once, when the main ribbon has arrived.
  useEffect(() => {
    if (!tied || reduced) return;
    const wait = progress.get() >= 0.999 ? 0 : 0.35;
    const controls = animate(tie, 1, { duration: 1.5, delay: wait, ease: [0.65, 0, 0.35, 1] });
    return () => controls.stop();
  }, [tied, reduced, tie, progress]);

  // The footer logo's own line fades in as the ribbon lays itself along it.
  useEffect(() => {
    const line = ref.current?.parentElement?.querySelector<SVGPathElement>('[data-ribbon="footer-logo"] [data-logo-line]');
    if (!line) return;
    if (reduced) {
      line.style.opacity = "1";
      return;
    }
    line.style.opacity = "0";
    return tie.on("change", (v) => {
      line.style.opacity = String(Math.min(1, Math.max(0, (v - 0.82) / 0.18)));
    });
  }, [reduced, tie, geo]);

  const full = reduced === true;
  return (
    <svg
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-[1] overflow-visible"
      width={geo?.w ?? 0}
      height={geo?.h ?? 0}
      fill="none"
    >
      {geo && (
        <>
          <defs>
            <linearGradient id="ribbon-shade" gradientUnits="userSpaceOnUse" {...geo.shade}>
              <stop offset="0" stopColor="var(--color-ink)" />
              <stop offset="1" stopColor="var(--color-accent)" />
            </linearGradient>
            <mask id="ribbon-words" maskUnits="userSpaceOnUse">
              <motion.path
                d={geo.tie}
                stroke="#fff"
                strokeWidth={44}
                strokeLinecap="round"
                style={full ? undefined : { pathLength: tie }}
              />
            </mask>
          </defs>
          <motion.path
            d={geo.main}
            stroke="url(#ribbon-shade)"
            strokeWidth={geo.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={full ? undefined : { pathLength: progress }}
          />
          <motion.path
            d={geo.tie}
            stroke="var(--color-accent)"
            strokeWidth={geo.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={full || tied ? 1 : 0}
            style={full ? undefined : { pathLength: tie }}
          />
          <path id="ribbon-words-path" d={geo.words} />
          <text
            mask="url(#ribbon-words)"
            className="tabular fill-accent text-[12px] font-medium tracking-[0.02em]"
          >
            <textPath href="#ribbon-words-path">{LANDING.coordinates}</textPath>
          </text>
        </>
      )}
    </svg>
  );
}
