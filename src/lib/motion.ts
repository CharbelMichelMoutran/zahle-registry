/** Motion tokens (DESIGN.md section 6). Reduced motion is handled by <MotionConfig reducedMotion="user">. */
import type { Transition } from "motion/react";

export const springTray: Transition = { type: "spring", stiffness: 400, damping: 34 };
export const springSnappy: Transition = { type: "spring", stiffness: 600, damping: 38 };
export const springGentle = { type: "spring" as const, stiffness: 220, damping: 28 };
/**
 * Map glide: the share of the remaining pan or zoom covered each frame (at 60fps).
 * An exponential ease-out with no overshoot; lower is slower and softer.
 */
export const mapGlide = { pan: 0.16, zoom: 0.22 };
export const fadeFast: Transition = { duration: 0.15, ease: "easeOut" };

/** Lists stagger in by 30ms per item, at most 8 items. */
export const staggerDelay = (index: number) => Math.min(index, 8) * 0.03;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
