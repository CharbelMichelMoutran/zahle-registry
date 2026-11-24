/**
 * "Go to building" and "Near me" (plan.md items 11 and 29). All location logic
 * lives here: the rest of the app only calls these functions.
 *
 * DEMO RULE (owner, 23 Nov 2026): when the person is in Zahle, use their real
 * location (the phone's GPS). When they are anywhere else, as in a demo from
 * Stanford, pick a random real Zahle building instead. Keep both paths.
 */

/** A building and the point the map flies to (its centre). */
export type LocatedBuilding = { id: string; lat: number; lng: number };

/** Buildings drawn on the map, registered by BuildingMap once they load. */
let known: readonly LocatedBuilding[] = [];
let lastId: string | null = null;

export function setLocatableBuildings(buildings: readonly LocatedBuilding[]) {
  known = buildings;
}

/** The centre of a building on the map, if it has loaded. */
export function buildingCentre(id: string): LocatedBuilding | null {
  return known.find((b) => b.id === id) ?? null;
}

/** Every building drawn on the map, with its centre. */
export const locatableBuildings = (): readonly LocatedBuilding[] => known;

/** The imported area of Zahle (as the map's bounds). A GPS point outside it means "not in Zahle". */
const ZAHLE = { south: 33.82, west: 35.86, north: 33.875, east: 35.945 };
const inZahle = (lat: number, lng: number) => lat >= ZAHLE.south && lat <= ZAHLE.north && lng >= ZAHLE.west && lng <= ZAHLE.east;

/** Straight-line distance in metres. */
export function metresBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** The phone's position, or null if it is refused, unavailable or slow. */
function gps(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    ),
  );
}

/** A random real Zahle building, never the same as the previous pick (the demo stand-in). */
function randomBuilding(): LocatedBuilding | null {
  if (known.length === 0) return null;
  const pool = known.length > 1 ? known.filter((b) => b.id !== lastId) : known;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  lastId = pick.id;
  return pick;
}

/** Where the person is: their real point in Zahle, or a random Zahle building elsewhere (the demo rule above). */
export async function getCurrentPoint(): Promise<{ lat: number; lng: number; real: boolean } | null> {
  const p = await gps();
  if (p && inZahle(p.lat, p.lng)) return { ...p, real: true };
  const b = randomBuilding();
  return b && { lat: b.lat, lng: b.lng, real: false };
}

/** The building the person is standing at, or null if none can be found yet. */
export async function getCurrentLocation(): Promise<LocatedBuilding | null> {
  if (known.length === 0) return null;
  // An EMT with an unfinished assessment is still at that building (plan.md item 25).
  const unfinished = unfinishedAssessment();
  if (unfinished) return unfinished;
  const p = await gps();
  if (p && inZahle(p.lat, p.lng)) {
    let best: LocatedBuilding | null = null;
    for (const b of known) if (!best || metresBetween(p, b) < metresBetween(p, best)) best = b;
    return best;
  }
  return randomBuilding();
}

const DRAFT_PREFIX = "zahle-registry:emt:assessment:";

function unfinishedAssessment(): LocatedBuilding | null {
  try {
    if (window.location.pathname.split("/")[1] !== "emt") return null;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      const b = key?.startsWith(DRAFT_PREFIX) ? buildingCentre(key.slice(DRAFT_PREFIX.length)) : null;
      if (b) return b;
    }
  } catch {}
  return null;
}
