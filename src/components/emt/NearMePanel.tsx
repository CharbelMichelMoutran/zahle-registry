"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { POSTING_LABEL, type Posting } from "@/lib/atc20";
import { apiFetch } from "@/lib/client-fetch";
import { formatDate } from "@/lib/format";
import { getCurrentPoint, locatableBuildings, metresBetween } from "@/lib/location";
import { springSnappy } from "@/lib/motion";
import { NEAR_ME_COUNT, NEAR_ME_WINDOWS, type QueryRow } from "@/lib/query";
import type { MapRecord } from "@/lib/record";
import { beirutToday } from "@/lib/record";
import { ResultList } from "../ResultList";
import { Button, IconButton, Spinner } from "../ui/Button";

type WindowId = (typeof NEAR_ME_WINDOWS)[number]["id"];
type Found = { rows: QueryRow[]; distance: Map<string, number>; real: boolean };

const COLOUR_POSTING: Record<string, Posting> = { green: "inspected", yellow: "restricted", red: "unsafe" };
const COLOUR_WORD: Record<string, string> = { green: "good condition", yellow: "needs some work", red: "imminent risk" };

/** The day `days` before today, YYYY-MM-DD. */
function daysAgo(days: number): string {
  const d = new Date(`${beirutToday()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * "Near me" on the volunteer map (owner, 23 Nov 2026, plan.md item 29): the
 * nearest buildings nobody has visited in the chosen time, or ever, for a team
 * on a mission. Works without Claude. Mounted only while open.
 */
export function NearMePanel({
  onClose,
  onResult,
  onShow,
}: {
  onClose: () => void;
  onResult: (ids: string[]) => void;
  onShow: (id: string) => void;
}) {
  const [windowId, setWindowId] = useState<WindowId>("month");
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [folded, setFolded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let live = true;
    (async () => {
      setBusy(true);
      setError(null);
      try {
        const [point, res] = await Promise.all([getCurrentPoint(), apiFetch("/api/buildings/colours")]);
        if (!res.ok) throw new Error();
        const records: ({ id: string } & MapRecord)[] = await res.json();
        if (!point) throw new Error("The map is still loading. Try again in a moment.");
        const byId = new Map(records.map((r) => [r.id, r]));
        const cutoff = daysAgo(NEAR_ME_WINDOWS.find((w) => w.id === windowId)!.days);
        const distance = new Map<string, number>();
        const rows: QueryRow[] = [];
        const near = locatableBuildings()
          .filter((b) => {
            const r = byId.get(b.id);
            const last = [r?.report?.day, r?.emt?.day].filter((d): d is string => !!d).sort().at(-1);
            return !last || last < cutoff;
          })
          .map((b) => ({ b, m: metresBetween(point, b) }))
          .sort((x, y) => x.m - y.m)
          .slice(0, NEAR_ME_COUNT);
        for (const { b, m } of near) {
          const r = byId.get(b.id);
          distance.set(b.id, m);
          const parts: string[] = [];
          if (r?.emt) parts.push(`Volunteer: ${POSTING_LABEL[COLOUR_POSTING[r.emt.colour]]}, ${formatDate(r.emt.day)}`);
          if (r?.report) parts.push(`Engineer: ${COLOUR_WORD[r.report.colour]}, ${formatDate(r.report.day)}`);
          rows.push({
            id: b.id,
            name: "",
            line: parts.length ? parts.join(" · ") : "Not yet inspected",
            reason: parts.length ? "Not visited in this time" : "Never visited",
            note: null,
            people: null,
            downgraded: false,
          });
        }
        if (!live) return;
        setFound({ rows, distance, real: point.real });
        onResult(rows.map((r) => r.id));
      } catch (err) {
        if (live) setError(err instanceof Error && err.message ? err.message : "Could not find buildings near you. Please try again.");
      } finally {
        if (live) setBusy(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [windowId, onResult]);

  if (folded && found) {
    return (
      <div className="absolute top-3 right-3 z-[1100] md:top-4 md:right-4">
        <Button variant="secondary" onClick={() => setFolded(false)} className="shadow-soft">
          Back to the list ({found.rows.length})
        </Button>
      </div>
    );
  }

  const metres = (id: string) => {
    const m = found?.distance.get(id);
    if (m === undefined) return null;
    return m < 1000 ? `${Math.round(m / 10) * 10} m away` : `${(m / 1000).toFixed(1)} km away`;
  };

  return (
    <motion.section
      aria-label="Nearest buildings not visited"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSnappy}
      className="absolute inset-x-3 top-3 z-[1100] flex max-h-[min(36rem,calc(100%-6rem))] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-tray md:right-4 md:left-auto md:top-4 md:w-[400px]"
    >
      <div className="flex items-center gap-2 border-b border-line py-1 pr-1 pl-3.5">
        <h2 className="flex-1 text-body font-medium text-ink">Near me</h2>
        <IconButton label="Close" onClick={onClose}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5">
        <div className="space-y-1.5">
          <p className="text-micro text-muted">Nearest buildings not visited in</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Not visited in">
            {NEAR_ME_WINDOWS.map((w) => (
              <button
                key={w.id}
                type="button"
                role="radio"
                aria-checked={windowId === w.id}
                onClick={() => setWindowId(w.id)}
                className={`min-h-9 rounded-chip border px-3 text-micro font-medium text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                  windowId === w.id ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-soft"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
        {busy ? (
          <p role="status" className="flex items-center gap-2 text-body text-ink">
            <Spinner /> Finding where you are…
          </p>
        ) : error ? (
          <p role="status" className="text-body text-attention">{error}</p>
        ) : (
          found && (
            <div className="space-y-2">
              <p className="text-micro text-muted">
                {found.real ? "From your location, nearest first." : "You are not in Zahle: starting from a Zahle building picked at random."}
              </p>
              <ResultList
                rows={found.rows}
                extra={(r) => metres(r.id)}
                onShow={(id) => {
                  setFolded(true);
                  onShow(id);
                }}
              />
            </div>
          )
        )}
      </div>
    </motion.section>
  );
}
