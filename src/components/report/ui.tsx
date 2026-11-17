"use client";

/** Small building blocks shared by the report form and the read-only report. */

import { motion } from "motion/react";
import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import { springSnappy } from "@/lib/motion";

/** Field messages say what to do, never that the engineer did something wrong. Dark orange, never red. */
export function FieldError({ id, message, className = "" }: { id?: string; message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p id={id} className={`mt-1.5 text-micro text-attention ${className}`}>
      {message}
    </p>
  );
}

/**
 * One row of a grouped panel, like an iPhone settings list: a short label on
 * the left, the value or controls on the right.
 */
export function Row({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className="px-3.5 py-2">
      <div className="grid grid-cols-[5rem_1fr] items-center gap-x-2 sm:grid-cols-[7rem_1fr]">
        <Label htmlFor={htmlFor} className="py-2.5 text-body font-medium text-ink">
          {label}
        </Label>
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">{children}</div>
      </div>
      {hint && <div className="pb-1 text-micro text-muted sm:pl-[7.5rem]">{hint}</div>}
      <FieldError message={error} className="mt-0 pb-1.5 sm:pl-[7.5rem]" />
    </div>
  );
}

/** A small on/off switch with its label, such as "Not inspected". 44px tall touch target. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control px-1.5 text-micro font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
        checked ? "text-ink" : "text-muted hover:text-ink"
      }`}
    >
      <span
        aria-hidden
        className={`relative h-5 w-8 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-line"}`}
      >
        <motion.span
          initial={false}
          animate={{ x: checked ? 12 : 0 }}
          transition={springSnappy}
          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-surface shadow-soft"
        />
      </span>
      {label}
    </button>
  );
}

/** Inputs are 17px so iOS does not zoom in on focus. */
export const inputClass =
  "min-h-11 w-full rounded-control border border-line bg-surface px-3 py-2 text-lead text-ink placeholder:text-muted/70 " +
  "transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft " +
  "disabled:bg-surface-soft disabled:text-muted aria-[invalid=true]:border-attention";

/** Compact inputs inside a row: width set by the caller, numbers centred. */
export const compactInputClass =
  "min-h-11 rounded-control border border-line bg-surface px-2 py-2 text-lead text-ink tabular placeholder:text-muted/70 " +
  "transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft " +
  "disabled:bg-surface-soft disabled:text-muted aria-[invalid=true]:border-attention";

/** Plain writing area: soft, quiet, and white with a blue edge while typing. */
export const writeClass =
  "block w-full rounded-control border border-transparent bg-surface-soft px-3 py-2.5 text-lead text-ink placeholder:text-muted/70 " +
  "transition-[background-color,border-color,box-shadow] focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent-soft " +
  "aria-[invalid=true]:border-attention";

/** A text area that grows with its text, so the engineer never scrolls inside a box. */
export function AutoTextarea({ value, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    // Refit when the width changes (rotation, window resize); height changes are our own.
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  return <textarea ref={ref} rows={2} value={value} className={`${writeClass} resize-none overflow-hidden ${className}`} {...props} />;
}
