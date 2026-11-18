"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LOGIN_TEXT } from "@/lib/content";
import { Button } from "../ui/Button";
import { authInputClass } from "./AuthShell";
import { PasswordInput } from "./PasswordInput";

export default function LoginForm() {
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
        window.location.replace(body.status === "approved" ? "/" : "/waiting");
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
      <div>
        <p className="micro-label">Engineer</p>
        <h1 className="mt-1 font-serif text-heading font-medium text-ink">Sign in</h1>
      </div>
      {expired && (
        <p role="status" className="rounded-control bg-surface-soft px-3 py-2.5 text-body text-ink">
          {LOGIN_TEXT.loggedOut}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-control bg-attention-soft px-3 py-2.5 text-body text-attention">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="username" className="mb-1.5 block text-body font-semibold text-ink">
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
        <label htmlFor="password" className="mb-1.5 block text-body font-semibold text-ink">
          Password
        </label>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
      </div>
      <Button
        type="submit"
        disabled={busy}
        className="w-full"
      >
        {busy ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-body text-muted">{LOGIN_TEXT.forgot}</p>
      <p className="text-center text-body text-muted">
        No account?{" "}
        <Link href="/signup" className="inline-flex min-h-11 items-center px-1 font-medium text-accent underline underline-offset-2">
          Create one
        </Link>
      </p>
    </form>
  );
}
