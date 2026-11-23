/**
 * "Go to building" (plan.md item 11, engineer version). All location logic lives in
 * `getCurrentLocation()`: the rest of the app only calls it, so real GPS (nearest
 * building) and address search can replace its body later with no other changes.
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

/** The building the engineer is standing at, or null if none can be found yet. */
export async function getCurrentLocation(): Promise<LocatedBuilding | null> {
  // For now: a random real Zahle building, never the same as the previous call.
  // Later: navigator.geolocation, then the nearest building to that point.
  if (known.length === 0) return null;
  // An EMT with an unfinished assessment is still at that building (plan.md item 25).
  const unfinished = unfinishedAssessment();
  if (unfinished) return unfinished;
  const pool = known.length > 1 ? known.filter((b) => b.id !== lastId) : known;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  lastId = pick.id;
  return pick;
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
