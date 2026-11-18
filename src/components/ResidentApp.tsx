"use client";

import { AnimatePresence, MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, LOGGED_OUT_EVENT } from "@/lib/client-fetch";
import { LOGIN_TEXT } from "@/lib/content";
import { askBrowserLocation, getCurrentLocation } from "@/lib/location";
import type { Colour } from "@/lib/report";
import { AccountMenu } from "./AccountMenu";
import { LocateMenu } from "./LocateMenu";
import ResidentTray from "./ResidentTray";
import { coveredRectOf } from "./tray-rect";
import { Button } from "./ui/Button";
import { Logo } from "./ui/Logo";

// Leaflet needs `window`, so the map renders only in the browser.
const BuildingMap = dynamic(() => import("./BuildingMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-ground" />,
});

/** The resident's own building and its latest rating (null: not yet inspected). */
export type OwnBuilding = { id: string; colour: Colour | null };
type Me = { name: string | null; building: OwnBuilding | null };

/** Resolves once; a stand-in for "when the outlines are on the map". */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

/**
 * The signed-in resident (plan.md items 12 and 15): a quiet map where only their
 * own building has colour. After login the browser asks for location; if allowed,
 * their building is found (or the saved one is used), the map flies to it, and
 * its tray opens. If not, the map waits with "Locate building".
 */
export default function ResidentApp() {
  const [name, setName] = useState<string | null>(null);
  const [own, setOwn] = useState<OwnBuilding | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [focus, setFocus] = useState<{ id: string; key: number } | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const trayRef = useRef<HTMLElement | null>(null);
  const coveredRect = useCallback(() => coveredRectOf(trayRef.current), []);
  const mapReady = useRef(deferred());
  const meRef = useRef<Promise<Me | null> | null>(null);
  const ownRef = useRef<OwnBuilding | null>(null);

  const loadMe = useCallback(() => {
    meRef.current ??= apiFetch("/api/resident/me")
      .then((r) => (r.ok ? (r.json() as Promise<Me>) : null))
      .catch(() => null);
    return meRef.current;
  }, []);

  /** Their saved building, or one found now and saved. Then fly to it and open the tray. */
  const showOwnBuilding = useCallback(async () => {
    let building = ownRef.current ?? (await loadMe())?.building ?? null;
    if (!building) {
      await mapReady.current.promise; // the location pick chooses among the drawn buildings
      const found = await getCurrentLocation();
      if (!found) return false;
      const res = await apiFetch("/api/resident/building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildingId: found.id }),
      }).catch(() => null);
      building = res?.ok ? ((await res.json()) as OwnBuilding | null) : null;
      if (!building) return false;
    }
    ownRef.current = building;
    setOwn(building);
    setTrayOpen(true);
    setFocus({ id: building.id, key: Date.now() });
    return true;
  }, [loadMe]);

  /** "Use current location" and the first prompt after login. False when location is off. */
  const locate = useCallback(async () => {
    if (!(await askBrowserLocation())) return false;
    await showOwnBuilding();
    return true;
  }, [showOwnBuilding]);

  useEffect(() => {
    loadMe().then((me) => me && setName(me.name));
    locate();
    const onLoggedOut = () => setLoggedOut(true);
    window.addEventListener(LOGGED_OUT_EVENT, onLoggedOut);
    return () => window.removeEventListener(LOGGED_OUT_EVENT, onLoggedOut);
  }, [loadMe, locate]);

  async function logout() {
    await fetch("/api/resident/logout", { method: "POST" }).catch(() => {});
    window.location.replace("/login");
  }

  // Only their own building has a colour; nothing else is ever sent to a resident.
  const colours = useMemo(() => new Map<string, Colour>(own?.colour ? [[own.id, own.colour]] : []), [own]);
  const selectedId = trayOpen && own ? own.id : null;
  const onSelect = useCallback(() => setTrayOpen(true), []);
  const onEmptyClick = useCallback(() => setTrayOpen(false), []);
  const onReady = useCallback(() => mapReady.current.resolve(), []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh flex-col overflow-hidden bg-ground">
        <header className="z-[1200] flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
          <h1 className="shrink-0">
            <Logo cut="small" className="h-8" />
          </h1>
          <div className="relative ml-auto flex min-w-0 items-center gap-2">
            <LocateMenu onLocate={locate} waitForLocation />
            <AccountMenu name={name} onLogout={logout} />
          </div>
        </header>

        <main className="relative flex flex-1 flex-col overflow-hidden">
          <div className="relative flex-1 overflow-hidden">
            <BuildingMap
              outlinesUrl="/api/resident/outlines"
              residentOwnId={own?.id ?? null}
              colours={colours}
              selectedId={selectedId}
              onSelect={onSelect}
              onEmptyClick={onEmptyClick}
              onReady={onReady}
              focus={focus}
              coveredRect={coveredRect}
            />
            <AnimatePresence>
              {own && trayOpen && (
                <ResidentTray key="tray" ref={trayRef} building={own} onClose={() => setTrayOpen(false)} />
              )}
            </AnimatePresence>
          </div>
        </main>

        {loggedOut && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/30 px-4">
            <div role="alertdialog" aria-modal aria-labelledby="logged-out-title" className="w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-tray">
              <p id="logged-out-title" className="text-lead font-semibold text-ink">{LOGIN_TEXT.loggedOut}</p>
              <Button className="mt-4 w-full" autoFocus onClick={() => window.location.replace("/login?as=resident")}>
                Log in
              </Button>
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
