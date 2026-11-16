"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WAITING } from "@/lib/content";

export const WELCOME_KEY = "zr:welcome";

/** D9.3. Refresh approves the account and goes straight to the map. */
export default function WaitingPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/approve", { method: "POST" });
      if (res.status === 401) return router.replace("/login?expired=1");
      if (!res.ok) throw new Error();
      try {
        sessionStorage.setItem(WELCOME_KEY, "1");
      } catch {}
      router.replace("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">{WAITING.title}</h1>
      {WAITING.body.map((p) => (
        <p key={p} className="text-[15px] leading-relaxed text-slate-700">
          {p}
        </p>
      ))}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-800">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={refresh}
        disabled={busy}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
      >
        {busy ? "Refreshing…" : "Refresh"}
      </button>
      <LogoutLink onDone={() => router.replace("/login")} />
    </div>
  );
}

function LogoutLink({ onDone }: { onDone: () => void }) {
  return (
    <p className="text-center text-sm">
      <button
        type="button"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          onDone();
        }}
        className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
      >
        Log out
      </button>
    </p>
  );
}
