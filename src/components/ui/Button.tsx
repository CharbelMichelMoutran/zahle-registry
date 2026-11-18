"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { springSnappy } from "@/lib/motion";
import { buttonClass, type ButtonVariant } from "./button-styles";

/** Every button presses to 0.97 and springs back (DESIGN.md section 6). Looks: ./button-styles.ts. */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: HTMLMotionProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <motion.button
      type="button"
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      transition={springSnappy}
      className={buttonClass(variant, className)}
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
