"use client";

import { useState } from "react";
import { WAITING } from "@/lib/content";
import { ArchMark } from "../ui/Arch";
import { Button } from "../ui/Button";

export const WELCOME_KEY = "zr:welcome";

/** D9.3. Refresh approves the account and goes straight to the map. */
export default function WaitingPanel() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/approve", { method: "POST" });
      if (res.status === 401) return window.location.replace("/login?expired=1");
      if (!res.ok) throw new Error();
      try {
        sessionStorage.setItem(WELCOME_KEY, "1");
      } catch {}
      window.location.replace("/engineer");
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 text-center">
      <ArchMark className="mx-auto h-11 w-10 text-accent" />
      <h1 className="font-serif text-[34px]/[38px] text-ink">{WAITING.title}</h1>
      {WAITING.body.map((p) => (
        <p key={p} className="text-body text-muted">
          {p}
        </p>
      ))}
      {error && (
        <p role="alert" className="rounded-control bg-attention-soft px-3 py-2.5 text-body text-attention">
          {error}
        </p>
      )}
      <Button onClick={refresh} disabled={busy} className="w-full">
        {busy ? "Refreshing…" : "Refresh"}
      </Button>
      <LogoutLink onDone={() => window.location.replace("/login")} />
    </div>
  );
}

function LogoutLink({ onDone }: { onDone: () => void }) {
  return (
    <p className="text-center text-body">
      <button
        type="button"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          onDone();
        }}
        className="min-h-11 px-3 font-medium text-muted underline underline-offset-2 hover:text-ink"
      >
        Sign out
      </button>
    </p>
  );
}
