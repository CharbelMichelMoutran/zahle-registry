"use client";

import { useId, useState } from "react";
import { PRIORITY_NOTE, PRIORITY_STEPS } from "@/lib/priority";
import type { QueryRow } from "@/lib/query";

/**
 * A ranked list of buildings, shared by "Ask" on the engineer map and "Near me"
 * on the volunteer map (plan.md item 29). Tapping a row flies to the building.
 */
export function ResultList({
  rows,
  onShow,
  extra,
}: {
  rows: QueryRow[];
  onShow: (id: string) => void;
  /** A second line per row, e.g. the distance for "Near me". */
  extra?: (row: QueryRow) => string | null;
}) {
  if (rows.length === 0) return <p className="px-1 text-body text-muted">No buildings match.</p>;
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-card border border-line">
      {rows.map((r, i) => (
        <li key={r.id}>
          <button
            type="button"
            onClick={() => onShow(r.id)}
            className="flex w-full gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-soft focus-visible:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            <span className="tabular w-5 shrink-0 pt-px text-micro font-medium text-muted">{i + 1}</span>
            <span className="min-w-0 flex-1 space-y-0.5">
              {r.name && (
                <bdi dir="auto" className="block truncate text-body font-medium text-ink">
                  {r.name}
                </bdi>
              )}
              <span className={`block text-body ${r.name ? "text-ink" : "font-medium text-ink"}`}>{r.line}</span>
              <span className="block text-micro text-muted">
                {r.reason}
                {r.people !== null && ` · ${r.people} ${r.people === 1 ? "person" : "people"} inside`}
                {extra?.(r) && ` · ${extra(r)}`}
              </span>
              {r.downgraded && (
                <span className="mt-1 inline-block rounded-control bg-attention-soft px-2 py-0.5 text-micro font-medium text-attention">
                  Volunteer downgraded Claude&apos;s posting
                </span>
              )}
              {r.note && <span className="block text-micro text-muted">{r.note}</span>}
              {r.claude && (
                <span className="mt-1 block rounded-control bg-accent-soft px-2 py-1 text-micro text-ink">
                  <span className="font-semibold text-accent">Claude </span>
                  {r.claude}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** "How this list is ranked": the priority formula in plain words (lib/priority.ts). */
export function HowRanked() {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="min-h-11 text-micro text-accent underline underline-offset-2"
      >
        How this list is ranked
      </button>
      {open && (
        <div id={id} className="space-y-2 rounded-card bg-surface-soft px-3 py-2.5">
          <RankingSteps />
        </div>
      )}
    </div>
  );
}

export function RankingSteps({ className = "" }: { className?: string }) {
  return (
    <>
      <ol className={`list-decimal space-y-1.5 pl-5 text-micro text-ink ${className}`}>
        {PRIORITY_STEPS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="text-micro text-muted">{PRIORITY_NOTE}</p>
    </>
  );
}
