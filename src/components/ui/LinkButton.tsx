"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { springSnappy } from "@/lib/motion";

const MotionLink = motion.create(Link);

const VARIANT = {
  primary: "border border-transparent bg-accent text-white hover:bg-accent-strong",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-soft",
} as const;

/** A link that looks and presses like a Button (DESIGN.md section 6): scale 0.97, spring back. */
export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof VARIANT;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <MotionLink
      href={href}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      className={[
        "inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-control px-5 text-body font-medium select-none",
        "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        VARIANT[variant],
        className,
      ].join(" ")}
    >
      {children}
    </MotionLink>
  );
}
