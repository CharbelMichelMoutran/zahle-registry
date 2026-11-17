"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { FeatureCollection, MultiPolygon } from "geojson";
import "leaflet/dist/leaflet.css";
import { animate } from "motion";
import { apiFetch } from "@/lib/client-fetch";
import { prefersReducedMotion, springGentle } from "@/lib/motion";
import type { Colour } from "@/lib/report";

/** Central Zahle, Lebanon. */
const ZAHLE_CENTER: L.LatLngTuple = [33.8467, 35.9025];
const OPEN_ZOOM = 16;
/** The imported area plus a margin, so the map cannot be dragged away from Zahle. */
const ZAHLE_BOUNDS = L.latLngBounds([33.82, 35.86], [33.875, 35.945]);

/** Building fills (DESIGN.md section 3): vine green, apricot amber, roof-tile red. */
const RATING_FILL: Record<Colour, string> = { green: "#1FA971", yellow: "#F5A524", red: "#D6402B" };
const OUTLINE = { color: "#FFFFFF", weight: 1, opacity: 0.9 };
const SELECTED_OUTLINE: L.PathOptions = { color: "#2F7CF6", weight: 3, opacity: 1 };

/** "Not yet inspected": stone grey with a fine diagonal hatch (the only texture in the app). */
let hatch: CanvasPattern | string | null = null;
function hatchFill(): CanvasPattern | string {
  if (hatch) return hatch;
  const tile = document.createElement("canvas");
  tile.width = tile.height = 6;
  const ctx = tile.getContext("2d")!;
  ctx.fillStyle = "rgba(163, 168, 179, 0.45)";
  ctx.fillRect(0, 0, 6, 6);
  ctx.strokeStyle = "rgba(110, 116, 128, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-1, 7);
  ctx.lineTo(7, -1);
  ctx.stroke();
  hatch = document.createElement("canvas").getContext("2d")!.createPattern(tile, "repeat") ?? "#A3A8B3";
  return hatch;
}

type Props = {
  colours: ReadonlyMap<string, Colour>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEmptyClick: () => void;
  /** The area the tray covers, in map pixels, so a selected building is not hidden behind it. */
  coveredRect: () => { left: number; top: number; right: number; bottom: number } | null;
};

type Status = "loading" | "ready" | "error";

export default function BuildingMap({ colours, selectedId, onSelect, onEmptyClick, coveredRect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef(new Map<string, L.Polygon>());
  const handlersRef = useRef({ onSelect, onEmptyClick });
  const buildingClickRef = useRef<MouseEvent | null>(null);
  const coveredRef = useRef(coveredRect);
  const coloursRef = useRef(colours);
  const selectedRef = useRef(selectedId);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    handlersRef.current = { onSelect, onEmptyClick };
    coveredRef.current = coveredRect;
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
    L.control.zoom({ position: "topright" }).addTo(map);
    // OpenStreetMap tiles, muted and lightened in CSS (.leaflet-tile-pane in globals.css)
    // so the map stays quiet and the coloured footprints carry the meaning (DESIGN.md section 7).
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

    apiFetch("/api/buildings", { signal: controller.signal })
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
      // Wait a frame so the tray is laid out, then move only if it would cover the building.
      const frame = requestAnimationFrame(() => flyClearOfTray(map, layer, coveredRef.current()));
      return () => cancelAnimationFrame(frame);
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
  const rating = colours.get(id);
  const base: L.PathOptions = rating
    ? { ...OUTLINE, fillColor: RATING_FILL[rating], fillOpacity: 0.85 }
    : // Leaflet's canvas renderer passes fillColor straight to ctx.fillStyle, so a pattern works.
      { ...OUTLINE, fillColor: hatchFill() as unknown as string, fillOpacity: 1 };
  return id === selectedId ? { ...base, ...SELECTED_OUTLINE } : base;
}

const MARGIN = 24;

/**
 * If the tray covers the building, glide the map (spring-gentle) just far enough
 * to show it above the tray, or beside it on wide screens. Otherwise do nothing:
 * the map never moves on its own (DESIGN.md section 6).
 */
function flyClearOfTray(
  map: L.Map,
  layer: L.Polygon,
  tray: { left: number; top: number; right: number; bottom: number } | null,
) {
  const size = map.getSize();
  const p = map.latLngToContainerPoint(layer.getBounds().getCenter());
  let dx = 0;
  let dy = 0;
  // Keep inside the visible map first.
  if (p.x < MARGIN) dx = p.x - MARGIN;
  if (p.x > size.x - MARGIN) dx = p.x - (size.x - MARGIN);
  if (p.y < MARGIN) dy = p.y - MARGIN;
  if (p.y > size.y - MARGIN) dy = p.y - (size.y - MARGIN);

  const x = p.x - dx;
  const y = p.y - dy;
  if (tray && x > tray.left - MARGIN && x < tray.right + MARGIN && y > tray.top - MARGIN && y < tray.bottom + MARGIN) {
    const up = y - (tray.top - MARGIN); // move the building above the tray
    const right = tray.right + MARGIN - x; // or to the right of it (desktop)
    const roomRight = size.x - tray.right > 2 * MARGIN;
    if (roomRight && right < up) dx -= right;
    else dy += up;
  }
  if (!dx && !dy) return;

  if (prefersReducedMotion()) {
    map.panBy([dx, dy], { animate: false });
    return;
  }
  let done = 0;
  animate(0, 1, {
    ...springGentle,
    onUpdate: (v) => {
      map.panBy([dx * (v - done), dy * (v - done)], { animate: false });
      done = v;
    },
  });
}
