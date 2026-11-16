/** Browser-side fetch for the app's own API. Tells the app when the session has ended. */

export const LOGGED_OUT_EVENT = "zr:logged-out";

export async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, credentials: "same-origin" });
  if (res.status === 401 || res.status === 403) window.dispatchEvent(new Event(LOGGED_OUT_EVENT));
  return res;
}
