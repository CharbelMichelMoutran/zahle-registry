"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { FeatureCollection, MultiPolygon } from "geojson";
import "leaflet/dist/leaflet.css";
import { animate } from "motion";
import { motion } from "motion/react";
import { apiFetch } from "@/lib/client-fetch";
import { setLocatableBuildings } from "@/lib/location";
import { CALM_FILL_OPACITY, EMT_OUTLINE_WEIGHT, RATING_EDGE, RATING_EDGE_WEIGHT, RATING_FILL, SHADE_EDGE, SHADE_EDGE_WEIGHT, SHADE_FILL } from "@/lib/map-style";
import { prefersReducedMotion, springGentle, springSnappy } from "@/lib/motion";
import { sameLook, type MapLook } from "@/lib/record";
import HILLSHADE from "@/lib/hillshade-bounds.json";
import { attachMapNavigation, type MapNavigation } from "../map-navigation";
import { MapKey } from "./MapKey";

/** Central Zahle, Lebanon. */
const ZAHLE_CENTER: L.LatLngTuple = [33.8467, 35.9025];
const OPEN_ZOOM = 16;
const MIN_ZOOM = 14;
const MAX_ZOOM = 19;
/** "Go to building" zooms in at least this far, close enough to read one house. */
const LOCATE_ZOOM = 17.5;
/** The imported area plus a margin, so the map cannot be dragged away from Zahle. */
const ZAHLE_BOUNDS = L.latLngBounds([33.82, 35.86], [33.875, 35.945]);

const OUTLINE = { color: "#FFFFFF", weight: 1, opacity: 0.9 };
const ACCENT = "#1E5A8C";

/**
 * Map layers, bottom to top (DESIGN.md 14.6 and 14.9). Every footprint tap is
 * handled by the default overlay canvas; the panes above it only draw, and let
 * pointer events through (globals.css), so a red or selected building is
 * tapped through its base footprint like any other.
 */
const PANES = { hillshade: 250, red: 410, selected: 430 } as const;

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
  /** How each building is drawn: engineer fill, EMT outline, faded green (lib/record.ts). */
  looks: ReadonlyMap<string, MapLook>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEmptyClick: () => void;
  /** Fly to this building and centre it beside the tray ("Go to building"). A new `key` flies again. */
  focus: { id: string; key: number } | null;
  /** The area the tray covers, in map pixels, so a selected building is not hidden behind it. */
  coveredRect: () => { left: number; top: number; right: number; bottom: number } | null;
  /** Called once the outlines are on the map (so "Go to building" can pick one). */
  onReady?: () => void;
};

type Status = "loading" | "ready" | "error";

export default function BuildingMap({
  looks,
  selectedId,
  onSelect,
  onEmptyClick,
  focus,
  coveredRect,
  onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const navRef = useRef<MapNavigation | null>(null);
  const layersRef = useRef(new Map<string, L.Polygon>());
  const renderersRef = useRef<Record<"red" | "selected", L.Canvas> | null>(null);
  /** Red buildings (engineer fill or EMT outline), drawn above the rest. */
  const redRef = useRef(new Map<string, L.Layer>());
  const selectedLayerRef = useRef<L.LayerGroup | null>(null);
  const handlersRef = useRef({ onSelect, onEmptyClick, onReady });
  const buildingClickRef = useRef<MouseEvent | null>(null);
  const coveredRef = useRef(coveredRect);
  const looksRef = useRef(looks);
  const selectedRef = useRef(selectedId);
  const focusedKeyRef = useRef<number | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const [zoom, setZoom] = useState(OPEN_ZOOM);

  useEffect(() => {
    handlersRef.current = { onSelect, onEmptyClick, onReady };
    coveredRef.current = coveredRect;
  });

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const layers = layersRef.current;
    const red = redRef.current;

    const map = L.map(containerRef.current, {
      center: ZAHLE_CENTER,
      zoom: OPEN_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: ZAHLE_BOUNDS,
      maxBoundsViscosity: 0.9,
      zoomControl: false,
      // Canvas draws 4,595 outlines cheaply. `tolerance` widens the tap target by
      // a few pixels so small buildings can be tapped; `padding` draws beyond the
      // screen edge so panning does not reveal undrawn areas.
      renderer: L.canvas({ padding: 0.25, tolerance: 6 }),
      // Trackpad scroll pans and pinch zooms through map-navigation.ts, not Leaflet's
      // wheel zoom. Zoom stops exactly where the user lets go: with any zoomSnap,
      // Leaflet would later snap a fractional zoom and the map would jump.
      scrollWheelZoom: false,
      zoomSnap: 0,
      zoomDelta: 1, // keyboard + and -
      zoomAnimation: !prefersReducedMotion(),
      bounceAtZoomLimits: false,
      // Panning: keep the glide after a drag, but cap its speed so a quick flick
      // does not throw the map far away.
      inertiaDeceleration: 3400,
      inertiaMaxSpeed: 1500,
      easeLinearity: 0.25,
    });
    for (const [name, zIndex] of Object.entries(PANES)) map.createPane(name).style.zIndex = String(zIndex);
    renderersRef.current = {
      red: L.canvas({ pane: "red", padding: 0.25 }),
      selected: L.canvas({ pane: "selected", padding: 0.25 }),
    };

    // OpenStreetMap tiles, toned to limestone grey in CSS (.leaflet-tile-pane in
    // globals.css) so the map stays quiet and the footprints carry the colour.
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      keepBuffer: 4, // keep nearby tiles, fewer blank squares when panning back
      updateWhenZooming: false, // no half-loaded tiles mid-pinch
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Terrain: SRTM (USGS) via Mapzen',
    }).addTo(map);
    // The Zahle hillshade, rendered once by scripts/render-hillshade.ts, laid over
    // the tiles in multiply (globals.css) so Sannine's slopes and the valley show.
    L.imageOverlay(
      "/map/hillshade-zahle.webp",
      [
        [HILLSHADE.south, HILLSHADE.west],
        [HILLSHADE.north, HILLSHADE.east],
      ],
      { pane: "hillshade", interactive: false, alt: "" },
    ).addTo(map);

    // A click on empty map minimises or closes the panel. Building clicks on the
    // canvas also reach the map, so skip the DOM event a building already handled.
    map.on("click", (e) => {
      if (e.originalEvent !== buildingClickRef.current) handlersRef.current.onEmptyClick();
    });
    map.on("zoomend", () => setZoom(map.getZoom()));
    navRef.current = attachMapNavigation(map, ZAHLE_BOUNDS);
    mapRef.current = map;

    return () => {
      navRef.current?.destroy();
      navRef.current = null;
      map.remove();
      mapRef.current = null;
      renderersRef.current = null;
      selectedLayerRef.current = null;
      layers.clear();
      red.clear();
    };
  }, []);

  /** Draw, redraw or remove the standout copy of a red building (DESIGN.md 14.9, item 2): solid for an engineer's red, an outline for an EMT's. */
  const syncRed = (id: string) => {
    const map = mapRef.current;
    const renderers = renderersRef.current;
    const base = layersRef.current.get(id);
    const red = redRef.current;
    if (!map || !renderers || !base) return;
    red.get(id)?.remove();
    red.delete(id);
    const look = looksRef.current.get(id);
    const redFill = look?.fill === "red";
    const outline = look?.outline;
    if (!redFill && outline !== "red") return;
    // On an engineer's red, a newer EMT outline (any colour) is drawn here too, so the solid red cannot hide it.
    const footprint = L.polygon(base.getLatLngs() as L.LatLng[][], {
      renderer: renderers.red,
      interactive: false,
      color: outline ? SHADE_FILL[outline] : RATING_EDGE.red,
      weight: outline ? EMT_OUTLINE_WEIGHT[outline] : RATING_EDGE_WEIGHT.red,
      opacity: 1,
      fill: redFill,
      fillColor: RATING_FILL.red,
      fillOpacity: 1,
    });
    red.set(id, footprint.addTo(map));
  };

  /** The selected building, drawn on top: its own fill, a 3px accent outline and a 2px white halo. */
  const drawSelected = () => {
    const map = mapRef.current;
    const renderers = renderersRef.current;
    selectedLayerRef.current?.remove();
    selectedLayerRef.current = null;
    const id = selectedRef.current;
    const base = id ? layersRef.current.get(id) : undefined;
    if (!map || !renderers || !id || !base) return;
    const shape = base.getLatLngs() as L.LatLng[][];
    const fill = looksRef.current.get(id)?.fill === "red" ? { fillColor: RATING_FILL.red, fillOpacity: 1 } : styleFor(id, looksRef.current);
    selectedLayerRef.current = L.layerGroup([
      // Canvas strokes are centred on the edge: 7px of white under 3px of blue leaves 2px of halo outside.
      L.polygon(shape, { renderer: renderers.selected, interactive: false, fill: false, color: "#FFFFFF", weight: 7, opacity: 1 }),
      L.polygon(shape, {
        renderer: renderers.selected,
        interactive: false,
        fill: true,
        fillColor: fill.fillColor,
        fillOpacity: fill.fillOpacity,
        color: ACCENT,
        weight: 3,
        opacity: 1,
      }),
    ]).addTo(map);
  };
  const syncRedRef = useRef(syncRed);
  const drawSelectedRef = useRef(drawSelected);
  useEffect(() => {
    syncRedRef.current = syncRed;
    drawSelectedRef.current = drawSelected;
  });

  // Load building outlines from our database.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = layersRef.current;
    const red = redRef.current;
    const controller = new AbortController();
    let layer: L.GeoJSON | null = null;

    apiFetch("/api/buildings", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<FeatureCollection<MultiPolygon, { id: string }>>;
      })
      .then((data) => {
        layer = L.geoJSON(data, {
          style: (f) => styleFor(f!.properties.id, looksRef.current),
          onEachFeature: (feature, featureLayer) => {
            const id = feature.properties.id;
            layers.set(id, featureLayer as L.Polygon);
            featureLayer.on("click", (e) => {
              buildingClickRef.current = (e as L.LeafletMouseEvent).originalEvent;
              handlersRef.current.onSelect(id);
            });
          },
        }).addTo(map);
        for (const id of layers.keys()) syncRedRef.current(id);
        drawSelectedRef.current();
        setLocatableBuildings(
          [...layers].map(([id, l]) => {
            const c = l.getBounds().getCenter();
            return { id, lat: c.lat, lng: c.lng };
          }),
        );
        setStatus("ready");
        handlersRef.current.onReady?.();
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
      for (const l of red.values()) l.remove();
      red.clear();
      selectedLayerRef.current?.remove();
      selectedLayerRef.current = null;
      setLocatableBuildings([]);
    };
  }, [attempt]);

  // Recolour only the buildings whose look changed.
  useEffect(() => {
    const before = looksRef.current;
    looksRef.current = looks;
    const changed = new Set([...before.keys(), ...looks.keys()]);
    for (const id of changed) {
      if (sameLook(before.get(id), looks.get(id))) continue;
      layersRef.current.get(id)?.setStyle(styleFor(id, looks));
      syncRedRef.current(id);
      if (id === selectedRef.current) drawSelectedRef.current();
    }
  }, [looks]);

  // Outline the selected building; pan only if it would sit behind the panel.
  // A "Go to building" request flies to it instead, wherever it is.
  useEffect(() => {
    const previous = selectedRef.current;
    selectedRef.current = selectedId;
    drawSelectedRef.current();
    const map = mapRef.current;
    const layer = selectedId ? layersRef.current.get(selectedId) : undefined;
    if (!map || !layer) return;
    const locate = focus?.id === selectedId && focus.key !== focusedKeyRef.current;
    if (locate) focusedKeyRef.current = focus.key;
    if (locate || previous !== selectedId) {
      // Wait a frame so the tray is laid out, then move only if it would cover the building.
      const frame = requestAnimationFrame(() => {
        const tray = coveredRef.current();
        if (locate) {
          const { center, zoom } = viewBesideTray(map, layer, tray);
          navRef.current?.flyTo(center, zoom);
        } else flyClearOfTray(map, layer, tray);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [selectedId, status, focus]);

  // While a tray is open, the other footprints step back (globals.css).
  const dimmed = selectedId !== null;

  return (
    <div className={`relative h-full w-full ${dimmed ? "zr-map-dimmed" : ""}`}>
      <div ref={containerRef} className="h-full w-full" aria-label="Map of Zahle buildings" />
      <MapKey />
      <ZoomButtons
        canZoomIn={zoom < MAX_ZOOM - 0.01}
        canZoomOut={zoom > MIN_ZOOM + 0.01}
        onZoom={(direction) => navRef.current?.zoomStep(direction)}
      />

      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
          {status === "loading" ? (
            <p className="rounded-control border border-line bg-surface px-4 py-2 text-body text-ink shadow-soft">
              Loading buildings…
            </p>
          ) : (
            <div className="pointer-events-auto flex items-center gap-3 rounded-control border border-line bg-surface px-4 py-2 text-body text-ink shadow-soft">
              <span>Could not load buildings.</span>
              <button
                type="button"
                onClick={() => {
                  setStatus("loading");
                  setAttempt((n) => n + 1);
                }}
                className="font-medium text-accent hover:underline"
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

/**
 * + and − (DESIGN.md sections 5 and 6). Bottom-right on desktop, beside the tray;
 * top-right on phones, below the status line, where the bottom tray never reaches.
 * Outside the Leaflet container, so wheel and pinch over them never move the map.
 */
function ZoomButtons({
  canZoomIn,
  canZoomOut,
  onZoom,
}: {
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoom: (direction: 1 | -1) => void;
}) {
  return (
    <div className="absolute top-16 right-3 z-[1000] flex flex-col divide-y divide-line overflow-hidden rounded-control border border-line bg-surface shadow-soft md:top-auto md:right-4 md:bottom-8">
      <ZoomButton label="Zoom in" enabled={canZoomIn} onClick={() => onZoom(1)} className="rounded-t-control">
        <path d="M10 4.5v11M4.5 10h11" strokeLinecap="round" />
      </ZoomButton>
      <ZoomButton label="Zoom out" enabled={canZoomOut} onClick={() => onZoom(-1)} className="rounded-b-control">
        <path d="M4.5 10h11" strokeLinecap="round" />
      </ZoomButton>
    </div>
  );
}

/** aria-disabled rather than disabled, so keyboard focus stays put at the zoom limit. */
function ZoomButton({
  label,
  enabled,
  onClick,
  className,
  children,
}: {
  label: string;
  enabled: boolean;
  onClick: () => void;
  className: string;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      aria-disabled={!enabled}
      onClick={enabled ? onClick : undefined}
      whileTap={enabled ? { scale: 0.97 } : undefined}
      transition={springSnappy}
      className={`flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent aria-disabled:cursor-not-allowed aria-disabled:text-stone aria-disabled:hover:bg-surface ${className}`}
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        {children}
      </svg>
    </motion.button>
  );
}

/**
 * The base footprint, on the overlay canvas that handles every tap. Its fill is
 * the engineer's colour (or the hatch); its edge is the EMT's outline when an
 * EMT posting is newer. A red fill or a red outline is drawn in the red pane
 * above (syncRed): the base then leaves that part out but stays tappable.
 */
function styleFor(id: string, looks: ReadonlyMap<string, MapLook>): L.PathOptions {
  const { fill = null, outline = null } = looks.get(id) ?? {};
  // `fill`, `stroke` and `interactive` are always set, in case the building was drawn differently before.
  if (fill === "red") return { fill: false, stroke: false, interactive: true };
  const inside: L.PathOptions = fill
    ? { fill: true, fillColor: SHADE_FILL[fill], fillOpacity: CALM_FILL_OPACITY }
    : // Leaflet's canvas renderer passes fillColor straight to ctx.fillStyle, so a pattern works.
      { fill: true, fillColor: hatchFill() as unknown as string, fillOpacity: 1 };
  const shown = { ...inside, interactive: true };
  if (outline === "red") return { ...shown, stroke: false };
  if (outline) return { ...shown, stroke: true, color: SHADE_FILL[outline], weight: EMT_OUTLINE_WEIGHT[outline], opacity: 1 };
  if (fill) return { ...shown, stroke: true, color: SHADE_EDGE[fill], weight: SHADE_EDGE_WEIGHT[fill], opacity: 1 };
  return { ...shown, stroke: true, ...OUTLINE };
}

const MARGIN = 24;
type Rect = { left: number; top: number; right: number; bottom: number };

/**
 * Where to fly so the building sits in the middle of the map the tray leaves open:
 * above the tray on phones, to its right on wide screens. Zooms in, never out.
 */
function viewBesideTray(map: L.Map, layer: L.Polygon, tray: Rect | null) {
  const size = map.getSize();
  const zoom = Math.max(map.getZoom(), LOCATE_ZOOM);
  let spot = size.divideBy(2);
  if (tray) {
    if (size.x - tray.right > 320) spot = L.point((tray.right + size.x) / 2, size.y / 2);
    else spot = L.point(size.x / 2, Math.max(MARGIN, tray.top / 2));
  }
  const point = map.project(layer.getBounds().getCenter(), zoom);
  const center = map.unproject(point.subtract(spot.subtract(size.divideBy(2))), zoom);
  return { center, zoom };
}

/**
 * If the tray covers the building, glide the map (spring-gentle) just far enough
 * to show it above the tray, or beside it on wide screens. Otherwise do nothing:
 * the map never moves on its own (DESIGN.md section 6).
 */
function flyClearOfTray(
  map: L.Map,
  layer: L.Polygon,
  tray: Rect | null,
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
