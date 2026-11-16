"use client";

import { AnimatePresence, motion } from "motion/react";
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DISCIPLINE_LABEL, DISCIPLINE_SHORT, SHOW_DISCIPLINE_IN_HISTORY, type Engineer } from "@/lib/account";
import { NOT_INSPECTED } from "@/lib/content";
import { firstLine, formatDate } from "@/lib/format";
import { fadeFast, springSnappy, springTray, staggerDelay } from "@/lib/motion";
import type { ConstructionDateChange, Report, ReportInput } from "@/lib/report";
import { ColourBadge, NotYetInspectedBadge } from "./report/ColourBadge";
import ReportForm from "./report/ReportForm";
import ReportView from "./report/ReportView";
import { ArchHandle, ArchMark } from "./ui/Arch";
import { Button, IconButton, Spinner } from "./ui/Button";

export type Level = "preview" | "full";
export type Tab = "history" | "create";

export type BuildingData =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; reports: Report[]; changes: ConstructionDateChange[] };

type Props = {
  buildingId: string;
  level: Level;
  tab: Tab;
  openReportId: string | null;
  data: BuildingData;
  draft: ReportInput | null;
  engineer: Engineer | null;
  /** Changes once per saved report: plays the celebration once. */
  celebrateKey: number | null;
  onTab: (tab: Tab) => void;
  onOpenReport: (id: string | null) => void;
  onMaximize: (tab?: Tab) => void;
  onMinimize: () => void;
  onClose: () => void;
  onRetry: () => void;
  onDraftChange: (update: (d: ReportInput) => ReportInput) => void;
  onSaved: (report: Report) => void;
  onStale: () => Promise<void>;
};

/** Text of a report's final observation as shown beside its colour (rule 1). */
const finalLine = (r: Report) =>
  r.final_not_inspected_reason !== null
    ? `${NOT_INSPECTED}: ${firstLine(r.final_not_inspected_reason)}`
    : firstLine(r.final_observation ?? "");

/**
 * The building tray (DESIGN.md section 7): springs up from the bottom (bottom-left
 * on desktop), shows a preview of the latest report, and morphs into a full view
 * with History and Create report tabs.
 */
const BuildingPanel = forwardRef<HTMLElement, Props>(function BuildingPanel(props, ref) {
  const { level, data, onClose, onMinimize } = props;
  const full = level === "full";
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});
  const viewKey = `${props.buildingId}:${level}:${props.tab}:${props.openReportId ?? ""}`;

  // Keep each view's scroll position across tab switches and minimize/maximize.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && full) el.scrollTop = scrollPositions.current[viewKey] ?? 0;
  }, [viewKey, full]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (full) onMinimize();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full, onClose, onMinimize]);

  const reports = data.status === "ready" ? data.reports : [];
  const [progress, setProgress] = useState(0);
  const showProgress = full && props.tab === "create" && data.status === "ready" && !!props.draft;

  return (
    <motion.aside
      ref={ref}
      layout
      aria-label="Building"
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      exit={{ y: "110%", transition: { ...springTray, restDelta: 1 } }}
      transition={springTray}
      style={{ borderRadius: 24 }}
      className={[
        "absolute z-[1100] flex flex-col overflow-hidden border border-line bg-surface shadow-tray",
        "inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] md:right-auto md:bottom-4 md:left-4 md:w-[440px]",
        // Short screens (phone landscape): a narrower tray on the left, like desktop.
        "[@media(max-height:500px)]:right-auto [@media(max-height:500px)]:w-[min(440px,62vw)]",
        full ? "top-2 md:top-4" : "max-h-[70dvh] [@media(max-height:500px)]:max-h-[calc(100dvh-4.5rem)]",
      ].join(" ")}
    >
      <motion.div layout="position" className="flex shrink-0 justify-center pt-2" aria-hidden>
        <ArchHandle />
      </motion.div>

      <motion.header layout="position" className="flex shrink-0 items-center gap-1 px-4 pt-1">
        {full ? (
          <Tabs {...props} count={data.status === "ready" ? reports.length : null} />
        ) : (
          <p className="micro-label flex-1 pl-1">Building</p>
        )}
        {full ? (
          <IconButton label="Minimize" onClick={onMinimize}>
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
        ) : (
          <IconButton label="Maximize" onClick={() => props.onMaximize()}>
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M5 12l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
        )}
        <IconButton label="Close" onClick={onClose}>
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </IconButton>
      </motion.header>
      {/* Pinned under the tab bar; the form scrolls beneath it, never behind text. */}
      {full && (
        <div className="mx-4 h-0.5 shrink-0 overflow-hidden rounded-full bg-line" aria-hidden={!showProgress}>
          {showProgress && <Progress value={progress} />}
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={(e) => {
          if (full) scrollPositions.current[viewKey] = e.currentTarget.scrollTop;
        }}
        className={[
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3",
          full && props.tab === "create" ? "scroll-pb-28" : "pb-5",
        ].join(" ")}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${viewKey}:${data.status}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeFast}
          >
            {data.status === "loading" && <Loading />}
            {data.status === "error" && (
              <div className="space-y-3 py-2">
                <p className="text-body text-ink">We could not load this building&apos;s reports.</p>
                <Button variant="secondary" onClick={props.onRetry}>
                  Load reports again
                </Button>
              </div>
            )}
            {data.status === "ready" &&
              (full ? (
                <FullView {...props} data={data} onProgress={setProgress} />
              ) : (
                <Preview {...props} reports={reports} />
              ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.aside>
  );
});
export default BuildingPanel;

function Tabs({ tab, onTab, count }: Props & { count: number | null }) {
  return (
    <div role="tablist" aria-label="Building record" className="flex flex-1 gap-1">
      {(["history", "create"] as const).map((t) => (
        <button
          key={t}
          role="tab"
          type="button"
          aria-selected={tab === t}
          onClick={() => onTab(t)}
          className={`relative min-h-11 rounded-control px-3 text-body font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
            tab === t ? "text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {tab === t && (
            <motion.span
              layoutId="tray-tab-indicator"
              transition={springSnappy}
              className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-accent"
            />
          )}
          {t === "history" ? (
            <>
              History{count !== null && <span className="tabular text-muted"> {count}</span>}
            </>
          ) : (
            "Create report"
          )}
        </button>
      ))}
    </div>
  );
}

function Preview({ reports, onMaximize, celebrateKey }: Props & { reports: Report[] }) {
  const latest = reports[0];
  return (
    <div className="space-y-4">
      {celebrateKey !== null && latest && <Celebration key={celebrateKey} />}
      {latest ? (
        <div className="space-y-2">
          <h2 className="font-serif text-title font-medium text-ink">
            Inspected <span className="tabular">{formatDate(latest.report_date)}</span>
          </h2>
          <ColourBadge colour={latest.colour} />
          <p dir="auto" className="text-body break-words text-ink">
            {finalLine(latest)}
          </p>
          <p className="text-micro text-muted">
            By <bdi dir="auto">{latest.engineer_name}</bdi>
            {latest.engineer_discipline && `, ${DISCIPLINE_LABEL[latest.engineer_discipline]}`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <NotYetInspectedBadge />
          <h2 className="font-serif text-title font-medium text-ink">No reports yet. Create the first one.</h2>
        </div>
      )}
      <div className="flex gap-2 border-t border-dashed border-line pt-4">
        <Button variant="secondary" className="flex-1" onClick={() => onMaximize("history")}>
          View history
        </Button>
        <Button className="flex-1" onClick={() => onMaximize("create")}>
          Create report
        </Button>
      </div>
    </div>
  );
}

/** The one celebration (DESIGN.md section 6): a checkmark pops with a sun highlight, once. */
function Celebration() {
  return (
    <div role="status" className="flex items-center gap-3 rounded-card bg-sun/15 px-3 py-2.5">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-sun"
          initial={{ scale: 0.6, opacity: 0.9 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <motion.span
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-sun text-ink"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springSnappy}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M5 10.5l3.2 3.2L15 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </span>
      <p className="text-body text-ink">Report saved. It is now part of this building&apos;s record.</p>
    </div>
  );
}

function FullView(
  props: Props & { data: Extract<BuildingData, { status: "ready" }>; onProgress: (v: number) => void },
) {
  const { data, tab, openReportId, onOpenReport, draft } = props;
  const opened = openReportId ? data.reports.find((r) => r.id === openReportId) : undefined;

  if (tab === "create") {
    if (!draft) return <Loading />;
    return (
      <ReportForm
        buildingId={props.buildingId}
        engineer={props.engineer}
        draft={draft}
        onChange={props.onDraftChange}
        latest={data.reports[0] ?? null}
        onSaved={props.onSaved}
        onStale={props.onStale}
        onProgress={props.onProgress}
      />
    );
  }

  if (opened) {
    return (
      <div>
        <Button variant="ghost" className="-ml-3 mb-2" onClick={() => onOpenReport(null)}>
          <span aria-hidden>←</span> Back to history
        </Button>
        <ReportView report={opened} change={data.changes.find((c) => c.report_id === opened.id)} />
      </div>
    );
  }

  if (data.reports.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <ArchMark className="h-10 w-9 text-muted" />
        <p className="mt-3 font-serif text-title font-medium text-ink">No reports yet. Create the first one.</p>
        <p className="mt-1 text-body text-muted">Past reports will be listed here, newest first.</p>
        <Button className="mt-5" onClick={() => props.onTab("create")}>
          Create report
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="micro-label">History</p>
      <ul className="overflow-hidden rounded-card border border-line">
        {data.reports.map((r, i) => (
          <motion.li
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...fadeFast, delay: staggerDelay(i) }}
            className="border-t border-line first:border-t-0"
          >
            <button
              type="button"
              onClick={() => onOpenReport(r.id)}
              className="block w-full px-4 py-3 text-left transition-colors hover:bg-surface-soft focus-visible:bg-accent-soft focus-visible:outline-none"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-body">
                <span className="tabular font-medium text-ink">{formatDate(r.report_date)}</span>
                <span className="min-w-0 truncate text-muted">
                  <bdi dir="auto">{r.engineer_name}</bdi>
                  {SHOW_DISCIPLINE_IN_HISTORY && r.engineer_discipline && (
                    // Dropped on narrow phones to keep rows short; always shown in the opened report.
                    <span className="hidden min-[375px]:inline">, {DISCIPLINE_SHORT[r.engineer_discipline]}</span>
                  )}
                </span>
              </div>
              <div className="mt-1.5 flex items-start gap-2">
                <span className="shrink-0">
                  <ColourBadge colour={r.colour} />
                </span>
                <span dir="auto" className="min-w-0 pt-0.5 text-body break-words text-ink">
                  {finalLine(r)}
                </span>
              </div>
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Loading (DESIGN.md section 7): nothing for the first 100ms, a small spinner
 * up to 1s, skeleton rows after that. Static under reduced motion.
 */
function Loading() {
  const [stage, setStage] = useState<"none" | "spinner" | "skeleton">("none");
  useEffect(() => {
    const a = setTimeout(() => setStage("spinner"), 100);
    const b = setTimeout(() => setStage("skeleton"), 1000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  if (stage === "none") return <div className="h-11" aria-busy="true" />;
  if (stage === "spinner")
    return (
      <div className="flex h-11 items-center gap-2 text-micro text-muted" aria-busy="true">
        <Spinner /> Loading
      </div>
    );
  return (
    <div className="space-y-3 py-1" aria-busy="true" aria-label="Loading">
      <div className="motion-safe-only h-6 w-1/2 animate-pulse rounded-control bg-surface-soft" />
      <div className="motion-safe-only h-5 w-4/5 animate-pulse rounded-control bg-surface-soft" />
      <div className="motion-safe-only h-11 w-full animate-pulse rounded-control bg-surface-soft" />
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-label="Report completion"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="h-full origin-left bg-accent transition-transform duration-300 ease-out"
      style={{ transform: `scaleX(${value})` }}
    />
  );
}
