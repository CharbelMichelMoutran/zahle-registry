"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import ReportPanel from "./ReportPanel";

// Leaflet needs `window`, so the map renders only in the browser.
const BuildingMap = dynamic(() => import("./BuildingMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100" />,
});

const PANEL_WIDTH = 380; // matches md:w-[380px] in ReportPanel
const SHEET_HEIGHT_RATIO = 0.45; // matches h-[45dvh] in ReportPanel

function usePanelInset(open: boolean) {
  const [inset, setInset] = useState({ right: 0, bottom: 0 });

  useEffect(() => {
    const update = () => {
      if (!open) return setInset({ right: 0, bottom: 0 });
      const wide = window.matchMedia("(min-width: 768px)").matches;
      setInset(
        wide
          ? { right: PANEL_WIDTH, bottom: 0 }
          : { right: 0, bottom: Math.round(window.innerHeight * SHEET_HEIGHT_RATIO) },
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  return inset;
}

export default function MapView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const close = useCallback(() => setSelectedId(null), []);
  const panelInset = usePanelInset(selectedId !== null);

  return (
    <div className="relative flex-1 overflow-hidden">
      <BuildingMap selectedId={selectedId} onSelect={setSelectedId} panelInset={panelInset} />
      <ReportPanel open={selectedId !== null} onClose={close} />
    </div>
  );
}
