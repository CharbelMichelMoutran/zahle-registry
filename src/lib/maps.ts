/**
 * The two maps (owner, 22 Nov 2026): one for engineers and one for Red Cross
 * volunteers (EMTs, rescuers; named "Volunteer" on 23 Nov 2026, page /volunteer).
 * The internal name stays "emt". Each has its own page and its own copy of the map screens, so they can
 * grow apart; both read and save through the same database.
 */
export const MAPS = ["engineer", "emt"] as const;
export type MapName = (typeof MAPS)[number];

/** What the top bar and the landing page call each map. */
export const MAP_LABEL: Record<MapName, string> = {
  engineer: "Engineer",
  emt: "Volunteer · Red Cross",
};

/**
 * Login is frozen (owner, 22 Nov 2026): anyone can open either map, and every
 * report is signed by that map's stand-in account. The login, sign-up and
 * waiting code stays; set this to false to switch it back on.
 */
export const LOGIN_FROZEN = true;
export const LOGIN_OFF = "Sign-in is switched off for now.";

/** Usernames of the stand-in accounts (migration 20261122000100_demo_accounts). */
export const DEMO_USERNAME: Record<MapName, string> = {
  engineer: "demo-engineer",
  emt: "demo-emt",
};

/** Header that tells the server which map a request comes from. */
export const MAP_HEADER = "x-zr-map";

/** The map a page or request belongs to; the engineer map unless it says EMT. */
export const mapNamed = (value: string | null | undefined): MapName => (value === "emt" ? "emt" : "engineer");

/** The web address of each map's page. /emt redirects to /volunteer (src/proxy.ts). */
export const MAP_PATH: Record<MapName, string> = {
  engineer: "/engineer",
  emt: "/volunteer",
};
