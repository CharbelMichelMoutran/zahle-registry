"use client";

import { AnimatePresence, motion } from "motion/react";
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DISCIPLINE_LABEL, DISCIPLINE_SHORT, SHOW_DISCIPLINE_IN_HISTORY, type Engineer } from "@/lib/account";
import { NO_REMARKS, NOT_INSPECTED, NOT_YET_VERIFIED } from "@/lib/content";
import { firstLine, formatConstructionDate, formatDate } from "@/lib/format";
import { fadeFast, springSnappy, springTray, staggerDelay } from "@/lib/motion";
import { reportConstructionDate, type ConstructionDateChange, type Report, type ReportInput } from "@/lib/report";
import { ColourBadge, NotYetInspectedBadge } from "./report/ColourBadge";
import ReportForm, { INITIAL_SAVE_STATE, type SaveState } from "./report/ReportForm";
import ReportView from "./report/ReportView";
import { ArchMark } from "./ui/Arch";
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

/** A report's final observation as shown beside its colour (rule 1): never blank. */
function FinalLine({ report: r, className = "" }: { report: Report; className?: string }) {
  if (r.final_not_inspected_reason !== null) {
    const reason = firstLine(r.final_not_inspected_reason);
    return (
      <span dir="auto" className={`break-words text-ink ${className}`}>
        {reason ? `${NOT_INSPECTED}: ${reason}` : NOT_INSPECTED}
      </span>
    );
  }
  const line = firstLine(r.final_observation ?? "");
  return line ? (
    <span dir="auto" className={`break-words text-ink ${className}`}>
      {line}
    </span>
  ) : (
    <span className={`text-muted ${className}`}>{NO_REMARKS}</span>
  );
}

/**
 * The building tray (DESIGN.md section 7): springs up from the bottom (bottom-left
 * on desktop), shows a preview of the latest report, and morphs into a full view
 * with History and Create report tabs.
 */
const BuildingPanel = forwardRef<HTMLElement, Props>(function BuildingPanel(props, ref) {
  const { level, data, onClose, onMinimize, onOpenReport } = props;
  const full = level === "full";
  const creating = full && props.tab === "create" && data.status === "ready" && !!props.draft;
  const reading = full && props.tab === "history" && props.openReportId !== null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});
  const viewKey = `${props.buildingId}:${level}:${props.tab}:${props.openReportId ?? ""}`;
  const formId = `report-form-${props.buildingId}`;
  const [saveState, setSaveState] = useState<SaveState>(INITIAL_SAVE_STATE);
  const onSaveState = useCallback(
    (s: SaveState) =>
      setSaveState((prev) =>
        prev.disabled === s.disabled && prev.label === s.label && prev.error === s.error ? prev : s,
      ),
    [],
  );

  // Keep each view's scroll position across tab switches and minimize/maximize.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && full) el.scrollTop = scrollPositions.current[viewKey] ?? 0;
  }, [viewKey, full]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (reading) onOpenReport(null);
      else if (full) onMinimize();
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full, reading, onClose, onMinimize, onOpenReport]);

  const reports = data.status === "ready" ? data.reports : [];
  const save = creating ? saveState : null;

  return (
    <motion.aside
      ref={ref}
      layout
      aria-label="Building"
      initial={{ y: "110%", borderRadius: 24 }}
      animate={{ y: 0, borderRadius: full ? 0 : 24 }}
      exit={{ y: "110%", transition: { ...springTray, restDelta: 1 } }}
      transition={springTray}
      className={[
        "absolute z-[1100] flex flex-col overflow-hidden bg-surface",
        full
          ? // Maximized: the whole map area, edge to edge, on phone and desktop.
            "inset-0"
          : [
              "border border-line shadow-tray",
              "inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-h-[70dvh] md:right-auto md:bottom-4 md:left-4 md:w-[440px]",
              // Short screens (phone landscape): a narrower tray on the left, like desktop.
              "[@media(max-height:500px)]:right-auto [@media(max-height:500px)]:w-[min(440px,62vw)] [@media(max-height:500px)]:max-h-[calc(100dvh-4.5rem)]",
            ].join(" "),
      ].join(" ")}
    >
      {full ? (
        <motion.header layout="position" className="shrink-0 border-b border-line">
          <div className="mx-auto grid h-14 w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 sm:px-4">
            <div className="flex justify-start">
              {reading ? (
                <IconButton label="Back to history" onClick={() => onOpenReport(null)}>
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconButton>
              ) : (
                <IconButton label="Minimize" onClick={onMinimize}>
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconButton>
              )}
            </div>
            <Tabs {...props} count={data.status === "ready" ? reports.length : null} />
            <div className="flex justify-end">
              {save && (
                // One Save at a time: here on wider screens, in the bottom bar on phones.
                // The wrapper hides it: Button's own inline-flex would beat a "hidden" class on it.
                <span className="hidden sm:block">
                  <Button type="submit" form={formId} disabled={save.disabled} className="whitespace-nowrap">
                    {save.label}
                  </Button>
                </span>
              )}
            </div>
          </div>
        </motion.header>
      ) : (
        <motion.header layout="position" className="flex shrink-0 items-center gap-1 px-4 pt-3">
          <p className="micro-label flex-1 pl-1">Building</p>
          <IconButton label="Maximize" onClick={() => props.onMaximize()}>
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M5 12l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
          <IconButton label="Close" onClick={onClose}>
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </IconButton>
        </motion.header>
      )}

      {/* Pinned under the header, so it is seen wherever the engineer has scrolled. */}
      {save?.error && (
        <p role="alert" className="shrink-0 bg-attention-soft px-4 py-2.5 text-center text-micro text-attention">
          {save.error}
        </p>
      )}

      <div
        ref={scrollRef}
        onScroll={(e) => {
          if (full) scrollPositions.current[viewKey] = e.currentTarget.scrollTop;
        }}
        className={[
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          full ? "px-4 pt-5 sm:px-6" : "px-5 pt-3 pb-5",
        ].join(" ")}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${viewKey}:${data.status}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeFast}
            className={full ? "mx-auto w-full max-w-2xl" : undefined}
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
                <FullView {...props} data={data} formId={formId} onSaveState={onSaveState} />
              ) : (
                <Preview {...props} reports={reports} />
              ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {save && (
        // Phones: Save within thumb reach. Wider screens use the header button.
        <div className="shrink-0 border-t border-line bg-surface px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:hidden">
          <Button type="submit" form={formId} disabled={save.disabled} className="w-full">
            {save.label}
          </Button>
        </div>
      )}
    </motion.aside>
  );
});
export default BuildingPanel;

/** History | Create report, as a simple segmented control. The selected pill slides. */
function Tabs({ tab, onTab, count }: Props & { count: number | null }) {
  return (
    <div role="tablist" aria-label="Building record" className="flex rounded-full bg-surface-soft p-0.5">
      {(["history", "create"] as const).map((t) => (
        <button
          key={t}
          role="tab"
          type="button"
          aria-selected={tab === t}
          onClick={() => onTab(t)}
          className={`relative min-h-10 rounded-full px-3 text-body font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-accent sm:px-4 ${
            tab === t ? "text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {tab === t && (
            <motion.span
              layoutId="tray-tab-indicator"
              transition={springSnappy}
              className="absolute inset-0 rounded-full border border-line bg-surface shadow-soft"
            />
          )}
          <span className="relative">
            {t === "history" ? (
              <>
                History{count !== null && <span className="tabular text-muted"> {count}</span>}
              </>
            ) : (
              "Create report"
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * The preview, in a fixed order (DESIGN.md 14.9 item 7): the status chip first
 * and largest, then year built and the latest report date, then one line of
 * the final observation, then who wrote it. Buildings have no name or number
 * in the registry yet, so that line is left out rather than invented.
 */
function Preview({ reports, onMaximize, celebrateKey }: Props & { reports: Report[] }) {
  const latest = reports[0];
  return (
    <div className="space-y-4">
      {celebrateKey !== null && latest && <Celebration key={celebrateKey} />}
      {latest ? (
        <div className="space-y-3">
          <h2 className="sr-only">Latest report</h2>
          <ColourBadge colour={latest.colour} size="large" />
          <dl className="tabular flex flex-wrap gap-x-4 gap-y-1 text-body">
            <div className="flex gap-1.5">
              <dt className="text-muted">Built</dt>
              <dd className="text-ink">
                {latest.construction_not_verified || latest.construction_year === null ? (
                  <span className="text-muted">{NOT_YET_VERIFIED}</span>
                ) : (
                  formatConstructionDate(reportConstructionDate(latest))
                )}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted">Inspected</dt>
              <dd className="text-ink">{formatDate(latest.report_date)}</dd>
            </div>
          </dl>
          <p dir="auto" className="line-clamp-2 text-body">
            <FinalLine report={latest} />
          </p>
          <p className="text-micro text-muted">
            By <bdi dir="auto">{latest.engineer_name}</bdi>
            {latest.engineer_discipline && `, ${DISCIPLINE_LABEL[latest.engineer_discipline]}`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <NotYetInspectedBadge size="large" />
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
  props: Props & {
    data: Extract<BuildingData, { status: "ready" }>;
    formId: string;
    onSaveState: (s: SaveState) => void;
  },
) {
  const { data, tab, openReportId, onOpenReport, draft } = props;
  const opened = openReportId ? data.reports.find((r) => r.id === openReportId) : undefined;

  if (tab === "create") {
    if (!draft) return <Loading />;
    return (
      <ReportForm
        formId={props.formId}
        buildingId={props.buildingId}
        engineer={props.engineer}
        draft={draft}
        onChange={props.onDraftChange}
        latest={data.reports[0] ?? null}
        onSaved={props.onSaved}
        onStale={props.onStale}
        onSaveState={props.onSaveState}
      />
    );
  }

  if (opened) {
    return <ReportView report={opened} change={data.changes.find((c) => c.report_id === opened.id)} />;
  }

  if (data.reports.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <ArchMark className="h-10 w-9 text-muted" />
        <p className="mt-3 font-serif text-title font-medium text-ink">No reports yet. Create the first one.</p>
        <Button className="mt-5" onClick={() => props.onTab("create")}>
          Create report
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-6">
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
              {/* Chip, then the observation under it at full width: never a narrow column beside the chip. */}
              <div className="mt-2 space-y-1.5">
                <ColourBadge colour={r.colour} />
                <p dir="auto" className="line-clamp-2 text-body">
                  <FinalLine report={r} />
                </p>
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
