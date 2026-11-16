"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { springSnappy } from "@/lib/motion";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-strong disabled:bg-surface-soft disabled:text-muted disabled:border-line border border-transparent",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-soft",
  ghost: "border border-transparent text-muted hover:bg-surface-soft hover:text-ink",
};

/** Every button presses to 0.97 and springs back (DESIGN.md section 6). */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: HTMLMotionProps<"button"> & { variant?: Variant }) {
  return (
    <motion.button
      type="button"
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      transition={springSnappy}
      className={[
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-body font-medium",
        "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed",
        VARIANT[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}

/** Square icon button with a visible tooltip label for assistive tech and hover. */
export function IconButton({
  label,
  children,
  className = "",
  ...props
}: HTMLMotionProps<"button"> & { label: string }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-accent ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`motion-safe-only inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent ${className}`}
    />
  );
}
