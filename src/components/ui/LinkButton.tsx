"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { springSnappy } from "@/lib/motion";
import { buttonClass, type ButtonVariant } from "./button-styles";

const MotionLink = motion.create(Link);

/** A link that looks and presses like a Button (DESIGN.md sections 6 and 15): scale 0.97, spring back. */
export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <MotionLink href={href} whileTap={{ scale: 0.97 }} transition={springSnappy} className={buttonClass(variant, className)}>
      {children}
    </MotionLink>
  );
}
