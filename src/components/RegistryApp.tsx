"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Engineer } from "@/lib/account";
import { approvedMessage, LOGIN_TEXT } from "@/lib/content";
import { apiFetch, LOGGED_OUT_EVENT } from "@/lib/client-fetch";
import { WELCOME_KEY } from "./auth/WaitingPanel";
import MapView from "./MapView";

/** The signed-in app: header with the engineer's name and Log out, and the map. */
export default function RegistryApp() {
  const router = useRouter();
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [welcome, setWelcome] = useState<string | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((e: Engineer | null) => {
        if (!e) return;
        setEngineer(e);
        // Arrived from the waiting screen: one short line that fades by itself (D9.4).
        try {
          if (sessionStorage.getItem(WELCOME_KEY) !== null) {
            sessionStorage.removeItem(WELCOME_KEY);
            setWelcome(approvedMessage(e.fullName));
          }
        } catch {}
      })
      .catch(() => {});

    const onLoggedOut = () => setLoggedOut(true);
    window.addEventListener(LOGGED_OUT_EVENT, onLoggedOut);
    return () => window.removeEventListener(LOGGED_OUT_EVENT, onLoggedOut);
  }, []);

  useEffect(() => {
    if (!welcome) return;
    const t = setTimeout(() => setWelcome(null), 5000);
    return () => clearTimeout(t);
  }, [welcome]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="z-[1200] flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm">
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-slate-900">
          Zahle Building Registry
        </h1>
        {engineer && (
          <bdi dir="auto" className="hidden max-w-[40vw] truncate text-sm text-slate-600 sm:block">
            {engineer.fullName}
          </bdi>
        )}
        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Log out
        </button>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {welcome && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[1050] flex justify-center px-4">
            <p
              role="status"
              className="animate-[fadeout_5s_ease-in_forwards] pointer-events-auto flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg"
            >
              <bdi dir="auto">{welcome}</bdi>
              <button type="button" aria-label="Dismiss" onClick={() => setWelcome(null)} className="text-white/70 hover:text-white">
                ×
              </button>
            </p>
          </div>
        )}
        <MapView engineer={engineer} onDraftsChange={(n) => setHasDraft(n > 0)} />
      </main>

      {loggedOut && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 px-4">
          <div role="alertdialog" aria-modal className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <p className="text-[15px] font-semibold text-slate-900">{LOGIN_TEXT.loggedOut}</p>
            {hasDraft && <p className="mt-1 text-sm text-slate-600">{LOGIN_TEXT.draftLost}</p>}
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Log in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
