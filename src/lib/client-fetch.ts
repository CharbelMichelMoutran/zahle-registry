/** Browser-side fetch for the app's own API. Tells the app when the session has ended. */

import { MAP_HEADER } from "./maps";

export const LOGGED_OUT_EVENT = "zr:logged-out";

export async function apiFetch(url: string, init?: RequestInit) {
  // Which map is asking, from the page's address (/engineer or /emt), so the
  // server signs reports with that map's stand-in account while login is frozen.
  const headers = new Headers(init?.headers);
  headers.set(MAP_HEADER, window.location.pathname.split("/")[1] ?? "");
  const res = await fetch(url, { ...init, headers, credentials: "same-origin" });
  if (res.status === 401 || res.status === 403) window.dispatchEvent(new Event(LOGGED_OUT_EVENT));
  return res;
}
