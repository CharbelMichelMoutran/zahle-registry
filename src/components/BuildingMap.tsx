"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { FeatureCollection, MultiPolygon } from "geojson";
import "leaflet/dist/leaflet.css";

/** Central Zahle, Lebanon. */
const ZAHLE_CENTER: L.LatLngTuple = [33.8467, 35.9025];
const OPEN_ZOOM = 16;

const baseStyle: L.PathOptions = {
  color: "#475569",
  weight: 1,
  fillColor: "#94a3b8",
  fillOpacity: 0.25,
};

const selectedStyle: L.PathOptions = {
  color: "#1d4ed8",
  weight: 3,
  fillColor: "#3b82f6",
  fillOpacity: 0.45,
};

type Props = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Space covered by the report panel, so the selected building is panned into view. */
  panelInset: { right: number; bottom: number };
};

type Status = "loading" | "ready" | "error";

export default function BuildingMap({ selectedId, onSelect, panelInset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef(new Map<string, L.Polygon>());
  const onSelectRef = useRef(onSelect);
  const buildingClickRef = useRef<MouseEvent | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const layers = layersRef.current;

    const map = L.map(containerRef.current, {
      center: ZAHLE_CENTER,
      zoom: OPEN_ZOOM,
      minZoom: 13,
      maxZoom: 19,
      preferCanvas: true, // thousands of outlines draw much faster on canvas
      zoomControl: false,
    });
    L.control.zoom({ position: "topleft" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // A click on empty map closes the report. Building clicks on the canvas also
    // reach the map, so skip the DOM event a building has already handled.
    map.on("click", (e) => {
      if (e.originalEvent !== buildingClickRef.current) onSelectRef.current(null);
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
          style: () => baseStyle,
          onEachFeature: (feature, featureLayer) => {
            const id = feature.properties.id;
            layers.set(id, featureLayer as L.Polygon);
            featureLayer.on("click", (e) => {
              buildingClickRef.current = (e as L.LeafletMouseEvent).originalEvent;
              onSelectRef.current(id);
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

  // Highlight the selected building and keep it clear of the panel.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const layer = layersRef.current.get(selectedId);
    if (!layer) return;

    layer.setStyle(selectedStyle);
    layer.bringToFront();
    map.panInside(layer.getBounds().getCenter(), {
      paddingTopLeft: [24, 24],
      paddingBottomRight: [panelInset.right + 24, panelInset.bottom + 24],
    });

    return () => {
      layer.setStyle(baseStyle);
    };
  }, [selectedId, status, panelInset.right, panelInset.bottom]);

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
