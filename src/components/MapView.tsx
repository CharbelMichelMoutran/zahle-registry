"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { sortNewestFirst } from "@/lib/format";
import { sameConstructionDate, inputConstructionDate, reportConstructionDate, type Colour, type Report, type ReportInput } from "@/lib/report";
import BuildingPanel, { type BuildingData, type Level, type Tab } from "./BuildingPanel";
import { newDraft, prefillConstruction } from "./report/ReportForm";

// Leaflet needs `window`, so the map renders only in the browser.
const BuildingMap = dynamic(() => import("./BuildingMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100" />,
});

/**
 * What the panel shows. Each deeper level is its own browser-history entry,
 * so the back button minimizes, then closes, as on a phone app.
 *   depth 0: closed, 1: preview, 2: full view, 3: a past report opened
 */
type Nav = {
  buildingId: string | null;
  level: Level;
  tab: Tab;
  openReportId: string | null;
  depth: number;
};
const CLOSED: Nav = { buildingId: null, level: "preview", tab: "history", openReportId: null, depth: 0 };

function usePanelNavigation() {
  const [nav, setNav] = useState<Nav>(CLOSED);
  const navRef = useRef(nav);
  const pendingRef = useRef<Nav | null>(null);

  useEffect(() => {
    navRef.current = nav;
  }, [nav]);

  useEffect(() => {
    // A reload starts with the panel closed.
    if (history.state?.panel) history.replaceState(null, "");
    const onPop = (e: PopStateEvent) => {
      let next: Nav = e.state?.panel ?? CLOSED;
      if (pendingRef.current) {
        next = pendingRef.current;
        pendingRef.current = null;
        history.replaceState(next.depth ? { panel: next } : null, "");
      }
      navRef.current = next;
      setNav(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const push = useCallback((next: Nav) => {
    history.pushState({ panel: next }, "");
    navRef.current = next;
    setNav(next);
  }, []);

  /** Go back to `depth`, then show `then` (or whatever that history entry held). */
  const goTo = useCallback((depth: number, then?: Omit<Nav, "depth">) => {
    const current = navRef.current;
    const target = then ? { ...then, depth } : null;
    if (depth === current.depth) {
      const next = target ?? current;
      history.replaceState(next.depth ? { panel: next } : null, "");
      navRef.current = next;
      setNav(next);
      return;
    }
    pendingRef.current = target;
    history.go(depth - current.depth);
  }, []);

  return { nav, navRef, push, goTo };
}

function usePanelInset(nav: Nav) {
  const [inset, setInset] = useState({ right: 0, bottom: 0 });
  const open = nav.depth > 0;
  useEffect(() => {
    const update = () => {
      if (!open) return setInset({ right: 0, bottom: 0 });
      const wide = window.matchMedia("(min-width: 768px)").matches;
      setInset(wide ? { right: 392, bottom: 0 } : { right: 0, bottom: Math.round(window.innerHeight * 0.35) });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);
  return inset;
}

export default function MapView() {
  const { nav, navRef, push, goTo } = usePanelNavigation();
  const panelInset = usePanelInset(nav);
  const [colours, setColours] = useState<ReadonlyMap<string, Colour>>(new Map());
  const [buildings, setBuildings] = useState<Record<string, BuildingData>>({});
  const [drafts, setDrafts] = useState<Record<string, ReportInput>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const buildingsRef = useRef(buildings);
  useEffect(() => {
    buildingsRef.current = buildings;
  }, [buildings]);

  // Map colours: latest report per building.
  useEffect(() => {
    fetch("/api/buildings/colours")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((rows: { id: string; colour: Colour }[]) => setColours(new Map(rows.map((r) => [r.id, r.colour]))))
      .catch((err) => console.error("Could not load building colours", err));
  }, []);

  const ensureDraftRef = useRef<(id: string, d: BuildingData | undefined) => void>(() => {});
  const ensureDraft = (id: string, d: BuildingData | undefined) => ensureDraftRef.current(id, d);

  const loadBuilding = useCallback(async (id: string) => {
    setBuildings((b) => (b[id]?.status === "ready" ? b : { ...b, [id]: { status: "loading" } }));
    try {
      const res = await fetch(`/api/buildings/${id}/reports`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const data: BuildingData = { status: "ready", reports: sortNewestFirst(body.reports), changes: body.changes };
      setBuildings((b) => ({ ...b, [id]: data }));
      // Keep the map in step with what the panel shows.
      setColours((c) => withColour(c, id, data.reports[0]?.colour));
      const nav = navRef.current;
      if (nav.buildingId === id && nav.level === "full" && nav.tab === "create") ensureDraft(id, data);
      return data;
    } catch (err) {
      console.error("Could not load reports", err);
      setBuildings((b) => (b[id]?.status === "ready" ? b : { ...b, [id]: { status: "error" } }));
      return null;
    }
  }, [navRef]);

  const selectBuilding = useCallback(
    (id: string) => {
      const current = navRef.current;
      setNotice(null);
      loadBuilding(id);
      if (current.buildingId === id) return;
      const next = { buildingId: id, level: "preview" as const, tab: "history" as const, openReportId: null };
      if (current.depth === 0) push({ ...next, depth: 1 });
      else goTo(1, next);
    },
    [goTo, loadBuilding, navRef, push],
  );

  const close = useCallback(() => goTo(0), [goTo]);
  const minimize = useCallback(() => goTo(1), [goTo]);
  const maximize = (tab?: Tab) => {
    setNotice(null);
    const id = navRef.current.buildingId;
    if (id && (tab ?? navRef.current.tab) === "create") ensureDraft(id, buildingsRef.current[id]);
    push({ ...navRef.current, level: "full", tab: tab ?? navRef.current.tab, openReportId: null, depth: 2 });
  };
  const setTab = (tab: Tab) => {
    setNotice(null);
    const id = navRef.current.buildingId;
    if (id && tab === "create") ensureDraft(id, buildingsRef.current[id]);
    goTo(2, { ...navRef.current, level: "full", tab, openReportId: null });
  };
  const openReport = (reportId: string | null) => {
    setNotice(null);
    if (reportId) push({ ...navRef.current, openReportId: reportId, depth: 3 });
    else goTo(2, { ...navRef.current, openReportId: null });
  };
  const onEmptyMapClick = useCallback(() => {
    const depth = navRef.current.depth;
    if (depth >= 2) goTo(1);
    else if (depth === 1) goTo(0);
  }, [goTo, navRef]);

  const data = nav.buildingId ? buildings[nav.buildingId] : undefined;

  // Start a draft when the form is first opened for a building. Drafts are kept
  // per building, so minimizing or switching buildings never loses typed text.
  useEffect(() => {
    ensureDraftRef.current = (id, d) => {
      if (d?.status !== "ready") return;
      setDrafts((all) => (all[id] ? all : { ...all, [id]: newDraft(d.reports[0] ?? null) }));
    };
  }, []);

  const onSaved = (report: Report) => {
    const id = report.building_id;
    setDrafts((all) => {
      const rest = { ...all };
      delete rest[id];
      return rest;
    });
    const prev = buildingsRef.current[id];
    const ready = prev?.status === "ready" ? prev : null;
    const reports = sortNewestFirst([report, ...(ready?.reports.filter((r) => r.id !== report.id) ?? [])]);
    setBuildings((b) => ({ ...b, [id]: { status: "ready", reports, changes: ready?.changes ?? [] } }));
    setColours((c) => withColour(c, id, reports[0].colour));
    loadBuilding(id); // picks up the construction-date change record, if any
    goTo(2, { ...navRef.current, level: "full", tab: "history", openReportId: null });
    setNotice("Report saved. It is now part of this building's record and cannot be changed.");
  };

  /** Another report was saved meanwhile: re-base the form on it, keeping the engineer's text. */
  const onStale = async () => {
    const id = navRef.current.buildingId;
    if (!id) return;
    const before = buildingsRef.current[id];
    const oldLatest = before?.status === "ready" ? (before.reports[0] ?? null) : null;
    const fresh = await loadBuilding(id);
    if (!fresh || fresh.status !== "ready") return;
    const newLatest = fresh.reports[0] ?? null;
    setDrafts((d) => {
      const draft = d[id];
      if (!draft) return d;
      const untouched =
        oldLatest === null
          ? inputConstructionDate(draft).year === null && !draft.constructionNotVerified
          : sameConstructionDate(inputConstructionDate(draft), reportConstructionDate(oldLatest));
      return {
        ...d,
        [id]: { ...draft, basedOnReportId: newLatest?.id ?? null, ...(untouched ? prefillConstruction(newLatest) : {}) },
      };
    });
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <BuildingMap
        colours={colours}
        selectedId={nav.buildingId}
        onSelect={selectBuilding}
        onEmptyClick={onEmptyMapClick}
        panelInset={panelInset}
      />
      {nav.buildingId && nav.depth > 0 && (
        <BuildingPanel
          buildingId={nav.buildingId}
          level={nav.level}
          tab={nav.tab}
          openReportId={nav.openReportId}
          data={data ?? { status: "loading" }}
          draft={drafts[nav.buildingId] ?? null}
          notice={notice}
          onTab={setTab}
          onOpenReport={openReport}
          onMaximize={maximize}
          onMinimize={minimize}
          onClose={close}
          onRetry={() => loadBuilding(nav.buildingId!)}
          onDraftChange={(update) => {
            const id = nav.buildingId!;
            setDrafts((d) => (d[id] ? { ...d, [id]: update(d[id]) } : d));
          }}
          onSaved={onSaved}
          onStale={onStale}
        />
      )}
    </div>
  );
}

function withColour(map: ReadonlyMap<string, Colour>, id: string, colour: Colour | undefined) {
  if (map.get(id) === colour) return map;
  const next = new Map(map);
  if (colour) next.set(id, colour);
  else next.delete(id);
  return next;
}
