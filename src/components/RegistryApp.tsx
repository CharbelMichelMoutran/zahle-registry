"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Engineer } from "@/lib/account";
import { approvedMessage, LOGIN_TEXT } from "@/lib/content";
import { apiFetch, LOGGED_OUT_EVENT } from "@/lib/client-fetch";
import { getCurrentLocation } from "@/lib/location";
import { WELCOME_KEY } from "./auth/WaitingPanel";
import { LocateMenu } from "./LocateMenu";
import MapView, { type MapViewHandle } from "./MapView";
import { Button, IconButton } from "./ui/Button";
import { Wordmark } from "./ui/Wordmark";
import { springSnappy } from "@/lib/motion";

/** The signed-in app: header with the engineer's name and Log out, and the map. */
export default function RegistryApp() {
  const router = useRouter();
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [welcome, setWelcome] = useState<string | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const mapRef = useRef<MapViewHandle>(null);

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

  async function locate() {
    const building = await getCurrentLocation();
    if (building) mapRef.current?.showBuilding(building.id);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh flex-col overflow-hidden bg-ground">
        <header className="z-[1200] flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
          <h1 className="shrink-0">
            <Wordmark size="small" />
          </h1>
          {/* Positioned, so the Locate popover can hang from the right edge on phones. */}
          <div className="relative ml-auto flex min-w-0 items-center gap-2">
            <LocateMenu onLocate={locate} />
            <AccountMenu name={engineer?.fullName ?? null} onLogout={logout} />
          </div>
        </header>

        <main className="relative flex flex-1 flex-col overflow-hidden">
          {welcome && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-[1050] flex justify-center px-4">
              <p
                role="status"
                className="motion-safe-only pointer-events-auto flex min-h-11 animate-[fadeout_5s_ease-in_forwards] items-center gap-3 rounded-full border border-line bg-surface py-1 pr-1 pl-4 text-body text-ink shadow-tray"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-vine" aria-hidden />
                <bdi dir="auto">{welcome}</bdi>
                <IconButton label="Dismiss" onClick={() => setWelcome(null)} className="h-9 w-9 rounded-full">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                  </svg>
                </IconButton>
              </p>
            </div>
          )}
          <MapView ref={mapRef} engineer={engineer} onDraftsChange={(n) => setHasDraft(n > 0)} />
        </main>

        {loggedOut && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/30 px-4">
            <div role="alertdialog" aria-modal aria-labelledby="logged-out-title" className="w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-tray">
              <p id="logged-out-title" className="text-lead font-semibold text-ink">{LOGIN_TEXT.loggedOut}</p>
              {hasDraft && <p className="mt-1 text-body text-muted">{LOGIN_TEXT.draftLost}</p>}
              <Button className="mt-4 w-full" autoFocus onClick={() => router.replace("/login")}>
                Log in
              </Button>
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}

/** Engineer's name with a small menu holding "Log out" (DESIGN.md section 7). */
function AccountMenu({ name, onLogout }: { name: string | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex min-w-0 justify-end">
      <motion.button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 min-w-0 max-w-[260px] items-center gap-2 rounded-control border border-line bg-surface px-3 text-body text-ink transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-accent"
      >
        <bdi dir="auto" className="truncate">{name ?? "Account"}</bdi>
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={springSnappy}
            className="absolute top-full right-0 z-[1300] mt-2 w-48 origin-top-right rounded-card border border-line bg-surface p-1.5 shadow-tray"
          >
            <button
              role="menuitem"
              type="button"
              autoFocus
              onClick={onLogout}
              className="flex min-h-11 w-full items-center rounded-control px-3 text-left text-body text-ink hover:bg-surface-soft focus-visible:bg-surface-soft focus-visible:outline-none"
            >
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
