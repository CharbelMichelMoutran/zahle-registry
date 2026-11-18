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

/** The building the engineer is standing at, or null if none can be found yet. */
export async function getCurrentLocation(): Promise<LocatedBuilding | null> {
  // For now: a random real Zahle building, never the same as the previous call.
  // Later: navigator.geolocation, then the nearest building to that point.
  if (known.length === 0) return null;
  const pool = known.length > 1 ? known.filter((b) => b.id !== lastId) : known;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  lastId = pick.id;
  return pick;
}

/**
 * Ask the browser for location, so its real permission prompt appears. Resolves
 * true if allowed. The coordinates are not used yet: `getCurrentLocation()`
 * still chooses the building.
 */
export function askBrowserLocation(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return resolve(false);
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false), // denied, unavailable or timed out: all read as "location is off"
      { maximumAge: 10 * 60 * 1000, timeout: 15000 },
    );
  });
}
