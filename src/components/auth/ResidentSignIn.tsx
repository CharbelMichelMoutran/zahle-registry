"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RESIDENT_NAME_MAX, RESIDENT_SIGN_IN as T } from "@/lib/content";
import { Button } from "../ui/Button";
import { authInputClass } from "./AuthShell";

/** Locked fields: shown, focusable and readable, but not editable. Never styled as disabled. */
const lockedClass = authInputClass.replace("bg-surface ", "bg-surface-soft ");
const LABEL = "mb-1.5 block text-body font-semibold text-ink";

/**
 * Resident sign-in (plan.md item 12, first version): name and the fixed phone
 * number, then the fixed code. Both are shown only; no code is sent or checked.
 * "Log in" starts a resident session in our own login system.
 */
export default function ResidentSignIn() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "code">("details");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Moving between the two steps puts focus on the new heading, for screen readers.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const checkName = (value: string) => {
    const v = value.trim();
    if (!v) return T.missingName;
    if (v.length > RESIDENT_NAME_MAX) return T.nameTooLong(RESIDENT_NAME_MAX);
    return null;
  };

  async function post(url: string, body: object) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, error: (data.error as string | undefined) ?? T.failed };
  }

  // A front-end show only (owner, 17 Nov 2026): no code is sent, so this just moves to the code step.
  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const problem = checkName(name);
    setNameError(problem);
    if (problem) return;
    setError(null);
    setStep("code");
  }

  async function logIn(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await post("/api/resident/login", { name });
      if (res.ok) {
        router.replace("/resident");
        return;
      }
      setError(res.error);
    } catch {
      setError(T.failed);
    }
    setBusy(false);
  }

  const alert = error && (
    <p role="alert" className="rounded-control bg-attention-soft px-3 py-2 text-micro text-attention">
      {error}
    </p>
  );

  if (step === "code") {
    return (
      <form onSubmit={logIn} noValidate className="space-y-4">
        <div>
          <h1 ref={headingRef} tabIndex={-1} className="font-serif text-heading font-medium text-ink focus:outline-none">
            {T.codeTitle}
          </h1>
          <p className="mt-1 text-body text-muted">
            {T.codeSent}
            <bdi dir="ltr" className="tabular whitespace-nowrap text-ink">{T.phoneShown}</bdi>.
          </p>
        </div>
        {alert}
        <div>
          <label htmlFor="resident-code" className={LABEL}>
            {T.code}
          </label>
          <input
            id="resident-code"
            readOnly
            value={T.codeShown}
            inputMode="numeric"
            autoComplete="one-time-code"
            dir="ltr"
            className={`${lockedClass} tabular text-center tracking-[0.5em]`}
          />
        </div>
        <Button type="submit" disabled={busy} autoFocus className="w-full">
          {busy ? T.loggingIn : T.logIn}
        </Button>
        <Button variant="ghost" className="w-full" disabled={busy} onClick={() => setStep("details")}>
          {T.changeName}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} noValidate className="space-y-4">
      <h1 ref={headingRef} tabIndex={-1} className="font-serif text-heading font-medium text-ink focus:outline-none">
        {T.title}
      </h1>
      {alert}
      <div>
        <label htmlFor="resident-name" className={LABEL}>
          {T.name}
        </label>
        <input
          id="resident-name"
          dir="auto"
          autoComplete="name"
          autoFocus
          required
          maxLength={RESIDENT_NAME_MAX}
          value={name}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "resident-name-error" : undefined}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null); // the error clears as soon as they type
          }}
          onBlur={() => name && setNameError(checkName(name))}
          className={authInputClass}
        />
        {nameError && (
          <p id="resident-name-error" className="mt-1.5 text-micro text-attention">
            {nameError}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="resident-phone" className={LABEL}>
          {T.phone}
        </label>
        <input
          id="resident-phone"
          type="tel"
          readOnly
          value={T.phoneShown}
          dir="ltr"
          className={`${lockedClass} tabular`}
        />
      </div>
      <Button type="submit" className="w-full">
        {T.sendCode}
      </Button>
    </form>
  );
}
