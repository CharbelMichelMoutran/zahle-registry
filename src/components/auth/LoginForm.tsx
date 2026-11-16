"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LOGIN_TEXT } from "@/lib/account";
import { authInputClass } from "./AuthShell";
import { PasswordInput } from "./PasswordInput";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // "?expired=1" is set by the server when a session has ended.
  const [dismissed, setDismissed] = useState(false);
  const expired = useSearchParams().has("expired") && !dismissed;
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setDismissed(true);
    if (!username.trim() || !password) return setError(LOGIN_TEXT.missing);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        router.replace(body.status === "approved" ? "/" : "/waiting");
        return;
      }
      setError(body.error ?? LOGIN_TEXT.failed);
    } catch {
      setError(LOGIN_TEXT.failed);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Log in</h1>
      {expired && (
        <p role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-[13px] text-slate-700">
          {LOGIN_TEXT.loggedOut}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-800">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-slate-900">
          Username
        </label>
        <input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={40}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={authInputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-900">
          Password
        </label>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
      >
        {busy ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-[13px] text-slate-500">{LOGIN_TEXT.forgot}</p>
      <p className="text-center text-sm text-slate-600">
        No account?{" "}
        <Link href="/signup" className="font-medium text-slate-900 underline underline-offset-2">
          Create one
        </Link>
      </p>
    </form>
  );
}
