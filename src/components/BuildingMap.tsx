"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { FeatureCollection, MultiPolygon } from "geojson";
import "leaflet/dist/leaflet.css";
import type { Colour } from "@/lib/report";

/** Central Zahle, Lebanon. */
const ZAHLE_CENTER: L.LatLngTuple = [33.8467, 35.9025];
const OPEN_ZOOM = 16;
/** The imported area plus a margin, so the map cannot be dragged away from Zahle. */
const ZAHLE_BOUNDS = L.latLngBounds([33.82, 35.86], [33.875, 35.945]);

/** Map fill per report colour. Grey = no report yet ("Not yet inspected"). */
const COLOUR_STYLE: Record<Colour | "none", L.PathOptions> = {
  none: { color: "#64748b", weight: 1, fillColor: "#94a3b8", fillOpacity: 0.3 },
  green: { color: "#15803d", weight: 1, fillColor: "#22c55e", fillOpacity: 0.55 },
  yellow: { color: "#a16207", weight: 1, fillColor: "#facc15", fillOpacity: 0.65 },
  red: { color: "#b91c1c", weight: 1, fillColor: "#ef4444", fillOpacity: 0.55 },
};
const SELECTED_OUTLINE: L.PathOptions = { color: "#0f172a", weight: 3 };

type Props = {
  colours: ReadonlyMap<string, Colour>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEmptyClick: () => void;
  /** Space covered by the panel, so a newly selected building is not hidden behind it. */
  panelInset: { right: number; bottom: number };
};

type Status = "loading" | "ready" | "error";

export default function BuildingMap({ colours, selectedId, onSelect, onEmptyClick, panelInset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef(new Map<string, L.Polygon>());
  const handlersRef = useRef({ onSelect, onEmptyClick });
  const buildingClickRef = useRef<MouseEvent | null>(null);
  const insetRef = useRef(panelInset);
  const coloursRef = useRef(colours);
  const selectedRef = useRef(selectedId);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    handlersRef.current = { onSelect, onEmptyClick };
    insetRef.current = panelInset;
  });

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const layers = layersRef.current;

    const map = L.map(containerRef.current, {
      center: ZAHLE_CENTER,
      zoom: OPEN_ZOOM,
      minZoom: 14,
      maxZoom: 19,
      maxBounds: ZAHLE_BOUNDS,
      maxBoundsViscosity: 0.9,
      zoomControl: false,
      // Canvas draws 4,595 outlines cheaply. `tolerance` widens the tap target by
      // a few pixels so small buildings can be tapped; `padding` draws beyond the
      // screen edge so panning does not reveal undrawn areas.
      renderer: L.canvas({ padding: 0.25, tolerance: 6 }),
      // Zoom: pinch and wheel stop exactly where the user lets go (quarter steps)
      // instead of jumping to the nearest whole level afterwards.
      zoomSnap: 0.25,
      zoomDelta: 1,
      wheelPxPerZoomLevel: 120,
      bounceAtZoomLimits: false,
      // Panning: keep the glide after a drag, but cap its speed so a quick flick
      // does not throw the map far away.
      inertiaDeceleration: 3400,
      inertiaMaxSpeed: 1500,
      easeLinearity: 0.25,
    });
    L.control.zoom({ position: "topleft" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      keepBuffer: 4, // keep nearby tiles, fewer blank squares when panning back
      updateWhenZooming: false, // no half-loaded tiles mid-pinch
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // A click on empty map minimises or closes the panel. Building clicks on the
    // canvas also reach the map, so skip the DOM event a building already handled.
    map.on("click", (e) => {
      if (e.originalEvent !== buildingClickRef.current) handlersRef.current.onEmptyClick();
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layers.clear();
    };
  }, []);

  // Load building outlines from our database.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = layersRef.current;
    const controller = new AbortController();
    let layer: L.GeoJSON | null = null;

    fetch("/api/buildings", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<FeatureCollection<MultiPolygon, { id: string }>>;
      })
      .then((data) => {
        layer = L.geoJSON(data, {
          style: (f) => styleFor(f!.properties.id, coloursRef.current, selectedRef.current),
          onEachFeature: (feature, featureLayer) => {
            const id = feature.properties.id;
            layers.set(id, featureLayer as L.Polygon);
            featureLayer.on("click", (e) => {
              buildingClickRef.current = (e as L.LeafletMouseEvent).originalEvent;
              handlersRef.current.onSelect(id);
            });
          },
        }).addTo(map);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Could not load buildings", err);
        setStatus("error");
      });

    return () => {
      controller.abort();
      layer?.remove();
      layers.clear();
    };
  }, [attempt]);

  // Recolour only the buildings whose report colour changed.
  useEffect(() => {
    const before = coloursRef.current;
    coloursRef.current = colours;
    const changed = new Set([...before.keys(), ...colours.keys()]);
    for (const id of changed) {
      if (before.get(id) === colours.get(id)) continue;
      layersRef.current.get(id)?.setStyle(styleFor(id, colours, selectedRef.current));
    }
  }, [colours]);

  // Outline the selected building; pan only if it would sit behind the panel.
  useEffect(() => {
    const previous = selectedRef.current;
    selectedRef.current = selectedId;
    if (previous && previous !== selectedId) {
      layersRef.current.get(previous)?.setStyle(styleFor(previous, coloursRef.current, null));
    }
    const map = mapRef.current;
    const layer = selectedId ? layersRef.current.get(selectedId) : undefined;
    if (!map || !layer) return;

    layer.setStyle(styleFor(selectedId!, coloursRef.current, selectedId));
    layer.bringToFront();
    if (previous !== selectedId) {
      const inset = insetRef.current;
      map.panInside(layer.getBounds().getCenter(), {
        paddingTopLeft: [24, 24],
        paddingBottomRight: [inset.right + 24, inset.bottom + 24],
        duration: 0.3,
      });
    }
  }, [selectedId, status]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" aria-label="Map of Zahle buildings" />

      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
          {status === "loading" ? (
            <p className="rounded-full bg-white/95 px-4 py-2 text-sm text-slate-700 shadow-md">
              Loading buildings…
            </p>
          ) : (
            <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm text-slate-700 shadow-md">
              <span>Could not load buildings.</span>
              <button
                type="button"
                onClick={() => {
                  setStatus("loading");
                  setAttempt((n) => n + 1);
                }}
                className="font-medium text-blue-700 hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function styleFor(id: string, colours: ReadonlyMap<string, Colour>, selectedId: string | null): L.PathOptions {
  const base = COLOUR_STYLE[colours.get(id) ?? "none"];
  return id === selectedId ? { ...base, ...SELECTED_OUTLINE } : base;
}
