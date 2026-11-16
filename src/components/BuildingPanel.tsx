"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { NOT_INSPECTED } from "@/lib/content";
import { firstLine, formatDate } from "@/lib/format";
import type { ConstructionDateChange, Report, ReportInput } from "@/lib/report";
import { ColourBadge, NotYetInspectedBadge } from "./report/ColourBadge";
import ReportForm from "./report/ReportForm";
import ReportView from "./report/ReportView";

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
  notice: string | null;
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
 * The building window: a small preview of the latest report, which maximizes to
 * a full view with History and Create report tabs.
 */
export default function BuildingPanel(props: Props) {
  const { level, data, onClose, onMinimize } = props;
  const full = level === "full";
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});
  const viewKey = `${props.buildingId}:${props.tab}:${props.openReportId ?? ""}`;

  // Keep each view's scroll position across tab switches and minimize/maximize.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !full) return;
    el.scrollTop = scrollPositions.current[viewKey] ?? 0;
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

  return (
    <aside
      aria-label="Building"
      className={[
        "absolute z-[1100] flex flex-col bg-white shadow-xl",
        full
          ? "inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-[min(600px,100%)] md:border-l md:border-slate-200"
          : "inset-x-0 bottom-0 max-h-[60dvh] rounded-t-2xl md:inset-x-auto md:top-3 md:right-3 md:bottom-auto md:w-[380px] md:rounded-xl md:border md:border-slate-200",
      ].join(" ")}
    >
      {!full && <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-300 md:hidden" aria-hidden />}

      <header className={`flex shrink-0 items-center gap-2 px-5 ${full ? "pt-4" : "pt-3 md:pt-4"}`}>
        <h2 className="flex-1 text-base font-semibold text-slate-900">{full ? "Building record" : "Latest report"}</h2>
        {full ? (
          <IconButton label="Minimize" onClick={onMinimize}>
            <path d="M5 12h10" strokeLinecap="round" />
          </IconButton>
        ) : (
          <IconButton label="Maximize" onClick={() => props.onMaximize()}>
            <path d="M11.5 4.5h4v4M8.5 15.5h-4v-4M15.5 4.5 11 9M4.5 15.5 9 11" strokeLinecap="round" strokeLinejoin="round" />
          </IconButton>
        )}
        <IconButton label="Close" onClick={onClose}>
          <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
        </IconButton>
      </header>

      {full && (
        <div role="tablist" aria-label="Building record" className="mt-2 flex shrink-0 gap-1 border-b border-slate-200 px-5">
          {(["history", "create"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={props.tab === t}
              onClick={() => props.onTab(t)}
              className={[
                "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                props.tab === t ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              {t === "history" ? `History${data.status === "ready" ? ` (${reports.length})` : ""}` : "Create report"}
            </button>
          ))}
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={(e) => {
          if (full) scrollPositions.current[viewKey] = e.currentTarget.scrollTop;
        }}
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 ${
          full && props.tab === "create" ? "scroll-pb-28" : "pb-5" /* the form's sticky Save bar sits flush at the bottom */
        }`}
      >
        {props.notice && (
          <p role="status" className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-[13px] text-slate-700">
            {props.notice}
          </p>
        )}
        {data.status === "loading" && <Loading />}
        {data.status === "error" && (
          <p className="text-sm text-slate-600">
            Could not load this building&apos;s reports.{" "}
            <button type="button" onClick={props.onRetry} className="font-medium text-blue-700 hover:underline">
              Try again
            </button>
          </p>
        )}
        {data.status === "ready" && (full ? <FullView {...props} data={data} /> : <Preview {...props} reports={reports} />)}
      </div>
    </aside>
  );
}

function Preview({ reports, onMaximize }: Props & { reports: Report[] }) {
  const latest = reports[0];
  return (
    <div className="space-y-3">
      {latest ? (
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <ColourBadge colour={latest.colour} />
            <span className="text-slate-500">{formatDate(latest.report_date)}</span>
          </div>
          <p dir="auto" className="mt-1.5 text-[15px] break-words text-slate-800">
            {finalLine(latest)}
          </p>
          <p className="mt-1 text-[13px] text-slate-500">
            By <bdi dir="auto">{latest.engineer_name}</bdi>
          </p>
        </div>
      ) : (
        <div>
          <NotYetInspectedBadge />
          <p className="mt-1 text-sm text-slate-500">No report yet for this building.</p>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onMaximize("history")}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          History{reports.length ? ` (${reports.length})` : ""}
        </button>
        <button
          type="button"
          onClick={() => onMaximize("create")}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create report
        </button>
      </div>
    </div>
  );
}

function FullView(props: Props & { data: Extract<BuildingData, { status: "ready" }> }) {
  const { data, tab, openReportId, onOpenReport, draft } = props;
  const opened = openReportId ? data.reports.find((r) => r.id === openReportId) : undefined;

  if (tab === "create") {
    if (!draft) return <Loading />;
    return (
      <ReportForm
        buildingId={props.buildingId}
        draft={draft}
        onChange={props.onDraftChange}
        latest={data.reports[0] ?? null}
        onSaved={props.onSaved}
        onStale={props.onStale}
      />
    );
  }

  if (opened) {
    return (
      <div>
        <button
          type="button"
          onClick={() => onOpenReport(null)}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <span aria-hidden>←</span> Back to history
        </button>
        <ReportView report={opened} change={data.changes.find((c) => c.report_id === opened.id)} />
      </div>
    );
  }

  if (data.reports.length === 0) {
    return (
      <div className="py-6 text-center">
        <NotYetInspectedBadge />
        <p className="mt-2 text-sm text-slate-500">No reports yet. Past reports will be listed here, newest first.</p>
        <button
          type="button"
          onClick={() => props.onTab("create")}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create report
        </button>
      </div>
    );
  }

  return (
    <ul className="-mx-2 divide-y divide-slate-100">
      {data.reports.map((r) => (
        <li key={r.id}>
          <button
            type="button"
            onClick={() => onOpenReport(r.id)}
            className="w-full rounded-lg px-2 py-3 text-left hover:bg-slate-50"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
              <span className="font-medium text-slate-900 tabular-nums">{formatDate(r.report_date)}</span>
              <bdi dir="auto" className="min-w-0 truncate text-slate-600">
                {r.engineer_name}
              </bdi>
            </div>
            <div className="mt-1 flex items-start gap-2 text-sm">
              <span className="shrink-0 pt-px">
                <ColourBadge colour={r.colour} />
              </span>
              <span dir="auto" className="min-w-0 break-words text-slate-700">
                {finalLine(r)}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Loading() {
  return (
    <div className="animate-pulse space-y-2 py-1" aria-label="Loading">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="h-4 w-4/5 rounded bg-slate-200" />
      <div className="h-9 w-full rounded bg-slate-100" />
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
        {children}
      </svg>
    </button>
  );
}
