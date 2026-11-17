import L from "leaflet";
import { animate, type AnimationPlaybackControls } from "motion";
import { mapGlide, springGentle } from "@/lib/motion";

/*
 * Trackpad and wheel navigation for the Leaflet map (plan.md item 22).
 *   - Two-finger scroll pans, eased toward the fingers each frame. It never zooms.
 *   - Pinch zooms around the cursor: `wheel` + ctrlKey in Chrome, Firefox and Edge,
 *     `gesture*` events in Safari. The page itself never zooms over the map screen.
 *   - The + / − buttons step one whole level through the same easing.
 *   - `flyTo` springs the map to a place (spring-gentle); any new input takes over from it.
 * Reduced motion: the same input is applied in one frame, still clamped.
 */

/** Map pixels moved per pixel of finger scroll: a little under 1:1 feels calmer. */
const PAN_SPEED = 0.8;
/** Largest single wheel event, in pixels, so a mouse notch or a hard flick cannot jump. */
const MAX_WHEEL_PX = 100;
/** Most pan still waiting to be eased in, so a long flick does not keep coasting. */
const MAX_PENDING_PX = 600;
/** Pixels per "line" when a mouse wheel reports lines instead of pixels (Firefox). */
const LINE_PX = 16;
/** Share of the finger-tracking pinch speed (1 = the map follows the fingers exactly). */
const PINCH_SENSITIVITY = 0.9;
/** Chrome reports a pinch as deltaY = -100 * ln(scale), so this turns pixels into zoom levels. */
const PINCH_LEVELS_PER_PX = PINCH_SENSITIVITY / (100 * Math.LN2);
/** Largest single ctrl+wheel event, so a mouse ctrl+wheel notch zooms about half a level. */
const MAX_PINCH_PX = 50;
/** Redraw the outlines after this share of the view has scrolled past (canvas padding is 0.25). */
const REDRAW_SHARE = 0.2;

/** Leaflet's own pan and pinch internals (used by its drag and touch-zoom handlers). */
type MapInternals = L.Map & {
  _stop(): L.Map;
  _rawPanBy(offset: L.Point): void;
  _move(center: L.LatLng, zoom: number, data?: { pinch?: boolean; flyTo?: boolean }): L.Map;
  _moveStart(zoomChanged: boolean, noMoveStart: boolean): L.Map;
  _moveEnd(zoomChanged: boolean): L.Map;
  _limitOffset(offset: L.Point, bounds: L.LatLngBounds): L.Point;
  _limitCenter(center: L.LatLng, zoom: number, bounds: L.LatLngBounds): L.LatLng;
  _animatingZoom?: boolean;
};

type SafariGestureEvent = UIEvent & { scale: number; clientX: number; clientY: number };

export type MapNavigation = {
  /** One whole zoom level in or out, around the centre of the map. */
  zoomStep(direction: 1 | -1): void;
  /** Spring the map to `center` at `zoom` (an instant jump under reduced motion). */
  flyTo(center: L.LatLng, zoom: number): void;
  /** Drop any eased pan or zoom still running, so another move can take over. */
  stop(): void;
  destroy(): void;
};

export function attachMapNavigation(leafletMap: L.Map, bounds: L.LatLngBounds): MapNavigation {
  const map = leafletMap as MapInternals;
  const container = map.getContainer();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let pendingX = 0; // pan still to apply, in pixels
  let pendingY = 0;
  let zoomTarget: number | null = null;
  let anchor = map.getSize().divideBy(2); // the container point that stays still while zooming
  let moving = false; // movestart fired, moveend owed
  let zooming = false; // zoomstart fired, zoomend owed
  let drift = 0; // pixels panned since the outlines were last redrawn
  let frame = 0;
  let lastTime = 0;
  let gestureStartZoom: number | null = null; // Safari pinch in progress
  let flight: AnimationPlaybackControls | null = null;

  const clampZoom = (z: number) => Math.min(map.getMaxZoom(), Math.max(map.getMinZoom(), z));
  const overMap = (e: Event) => e.target instanceof Node && container.contains(e.target);

  function schedule() {
    endFlight(); // the user's own scroll, pinch or + / − wins over a fly-to
    if (!frame) frame = requestAnimationFrame(tick);
  }

  /** Share of the remaining distance to cover this frame, the same at any frame rate. */
  function ease(base: number, dt: number) {
    if (reducedMotion.matches) return 1;
    return 1 - Math.pow(1 - base, dt / (1000 / 60));
  }

  function start(zoom: boolean) {
    if (!moving) {
      map._stop(); // stop a drag glide or pan animation still running
      map.fire("movestart");
      moving = true;
    }
    if (zoom && !zooming) {
      map._moveStart(true, true);
      zooming = true;
    }
  }

  function settle() {
    if (zooming) map.fire("zoom"); // a plain zoom event loads tiles for the new level
    if (moving) map._moveEnd(zooming);
    moving = zooming = false;
    drift = 0;
  }

  function tick(time: number) {
    frame = 0;
    const dt = Math.min(64, lastTime ? time - lastTime : 1000 / 60);
    lastTime = time;

    // Wait out a keyboard or touch zoom animation that Leaflet is running.
    if (map._animatingZoom) {
      lastTime = 0;
      schedule();
      return;
    }

    if (zoomTarget !== null) {
      start(true);
      const z = map.getZoom();
      let next = z + (zoomTarget - z) * ease(mapGlide.zoom, dt);
      if (Math.abs(zoomTarget - next) < 0.002) next = zoomTarget;
      if (next !== z) {
        // Same maths as Leaflet's setZoomAround: keep `anchor` still while the scale changes.
        const half = map.getSize().divideBy(2);
        const offset = anchor.subtract(half).multiplyBy(1 - 1 / map.getZoomScale(next, z));
        const center = map._limitCenter(map.containerPointToLatLng(half.add(offset)), next, bounds);
        map._move(center, next, { pinch: true });
      }
      if (next === zoomTarget) zoomTarget = null;
    }

    if (pendingX || pendingY) {
      start(false);
      const k = ease(mapGlide.pan, dt);
      // Whole pixels keep tiles crisp; the last pixels drift in one at a time.
      const stepX = Math.abs(pendingX) < 1 ? pendingX : Math.round(pendingX * k) || Math.sign(pendingX);
      const stepY = Math.abs(pendingY) < 1 ? pendingY : Math.round(pendingY * k) || Math.sign(pendingY);
      const step = L.point(Math.round(stepX), Math.round(stepY));
      // Only ever shorten a step at the edge, never reverse or lengthen it: if a drag left the
      // map just outside, Leaflet's own snap-back at moveend brings it in smoothly.
      const limit = map._limitOffset(step, bounds);
      const shorten = (want: number, max: number) => (want > 0 ? Math.max(0, Math.min(want, max)) : Math.min(0, Math.max(want, max)));
      const allowed = L.point(shorten(step.x, limit.x), shorten(step.y, limit.y));
      // At the edge of Zahle, drop what is left in that direction instead of pushing on.
      pendingX = Math.abs(allowed.x - step.x) > 0.5 ? 0 : pendingX - stepX;
      pendingY = Math.abs(allowed.y - step.y) > 0.5 ? 0 : pendingY - stepY;
      if (allowed.x || allowed.y) {
        map._rawPanBy(allowed);
        map.fire("move");
        drift += Math.abs(allowed.x) + Math.abs(allowed.y);
      }
      if (Math.abs(pendingX) < 0.5) pendingX = 0;
      if (Math.abs(pendingY) < 0.5) pendingY = 0;

      // Redraw the outlines now and then on a long scroll, before the drawn margin runs out.
      const size = map.getSize();
      if (!zooming && drift > REDRAW_SHARE * Math.min(size.x, size.y)) {
        map.fire("moveend").fire("movestart");
        drift = 0;
      }
    }

    if (zoomTarget === null && !pendingX && !pendingY) {
      lastTime = 0;
      settle();
    } else {
      schedule();
    }
  }

  function endFlight() {
    if (!flight) return;
    flight.stop();
    flight = null;
    map._moveEnd(true);
  }

  function flyTo(target: L.LatLng, targetZoom: number) {
    stop();
    endFlight();
    const zoom = clampZoom(targetZoom);
    const center = map._limitCenter(target, zoom, bounds);
    if (reducedMotion.matches) {
      map.setView(center, zoom, { animate: false });
      return;
    }
    map._stop();
    // Centre glides in pixels at the starting zoom while the zoom springs alongside,
    // the same frame-by-frame `_move` Leaflet's own flyTo uses.
    const z0 = map.getZoom();
    const from = map.project(map.getCenter(), z0);
    const delta = map.project(center, z0).subtract(from);
    map._moveStart(true, false);
    flight = animate(0, 1, {
      ...springGentle,
      onUpdate: (v) => map._move(map.unproject(from.add(delta.multiplyBy(v)), z0), z0 + (zoom - z0) * v, { flyTo: true }),
      onComplete: () => {
        flight = null;
        map._move(center, zoom, { flyTo: true });
        map._moveEnd(true);
      },
    });
  }

  function zoomTo(target: number, point: L.Point) {
    zoomTarget = clampZoom(target);
    anchor = point;
    schedule();
  }

  function onWheel(e: WheelEvent) {
    // Pinch in Chrome, Firefox and Edge (and ctrl+wheel): never zoom the page here.
    if (e.ctrlKey) {
      e.preventDefault();
      if (!overMap(e) || gestureStartZoom !== null) return; // Safari's gesture events lead
      const px = e.deltaY * (e.deltaMode === 1 ? LINE_PX : 1);
      const clamped = Math.max(-MAX_PINCH_PX, Math.min(MAX_PINCH_PX, px));
      zoomTo((zoomTarget ?? map.getZoom()) - clamped * PINCH_LEVELS_PER_PX, map.mouseEventToContainerPoint(e));
      return;
    }
    if (!overMap(e)) return; // the tray and the top bar scroll as usual
    e.preventDefault(); // also stops the two-finger "back" swipe over the map

    const unit = e.deltaMode === 1 ? LINE_PX : e.deltaMode === 2 ? map.getSize().y : 1;
    let dx = e.deltaX * unit;
    let dy = e.deltaY * unit;
    if (e.shiftKey && !dx) [dx, dy] = [dy, 0]; // shift + mouse wheel scrolls sideways
    const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));
    pendingX = clamp(pendingX + clamp(dx, MAX_WHEEL_PX) * PAN_SPEED, MAX_PENDING_PX);
    pendingY = clamp(pendingY + clamp(dy, MAX_WHEEL_PX) * PAN_SPEED, MAX_PENDING_PX);
    schedule();
  }

  // Safari: pinch arrives as gesture events with a running scale since the start.
  function onGestureStart(e: Event) {
    e.preventDefault();
    if (!overMap(e)) return;
    gestureStartZoom = zoomTarget ?? map.getZoom();
  }
  function onGestureChange(e: Event) {
    e.preventDefault();
    if (gestureStartZoom === null) return;
    const g = e as SafariGestureEvent;
    let point = map.mouseEventToContainerPoint(g as unknown as MouseEvent);
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) point = map.getSize().divideBy(2);
    zoomTo(gestureStartZoom + Math.log2(g.scale) * PINCH_SENSITIVITY, point);
  }
  function onGestureEnd(e: Event) {
    e.preventDefault();
    gestureStartZoom = null;
  }

  // A drag or a fly-to takes over: let go of any eased motion so the two never fight.
  function stop() {
    pendingX = pendingY = 0;
    zoomTarget = null;
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    settle();
  }

  const capture = { capture: true, passive: false };
  document.addEventListener("wheel", onWheel, capture);
  document.addEventListener("gesturestart", onGestureStart, capture);
  document.addEventListener("gesturechange", onGestureChange, capture);
  document.addEventListener("gestureend", onGestureEnd, capture);
  const onDrag = () => {
    stop();
    endFlight();
  };
  map.on("dragstart", onDrag);

  return {
    zoomStep(direction) {
      const from = zoomTarget ?? map.getZoom();
      // From a fractional zoom, go to the next whole level, not one level plus the fraction.
      const to = direction > 0 ? Math.floor(from + 0.01) + 1 : Math.ceil(from - 0.01) - 1;
      zoomTo(to, map.getSize().divideBy(2));
    },
    flyTo,
    stop,
    destroy() {
      cancelAnimationFrame(frame);
      flight?.stop();
      document.removeEventListener("wheel", onWheel, capture);
      document.removeEventListener("gesturestart", onGestureStart, capture);
      document.removeEventListener("gesturechange", onGestureChange, capture);
      document.removeEventListener("gestureend", onGestureEnd, capture);
      map.off("dragstart", onDrag);
    },
  };
}
