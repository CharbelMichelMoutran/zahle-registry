"use client";

import Link from "next/link";
import { useState } from "react";
import { DISCIPLINE_LABEL, DISCIPLINES, validateSignup, type SignupInput } from "@/lib/account";
import { SIGNUP_FIELDS } from "@/lib/content";
import { Button } from "../ui/Button";
import { authInputClass } from "./AuthShell";
import { PasswordInput } from "./PasswordInput";

type Field = keyof SignupInput;
const EMPTY: SignupInput = { fullName: "", discipline: "", contact: "", oeaNumber: "", username: "", password: "" };

export default function SignupForm() {
  const [input, setInput] = useState<SignupInput>(EMPTY);
  const [touched, setTouched] = useState<Set<Field>>(new Set());
  const [serverFields, setServerFields] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const errors = { ...validateSignup(input), ...serverFields };
  const shown = (f: Field) => (touched.has(f) ? errors[f] : undefined);
  const set = (f: Field, v: string) => {
    setInput((i) => ({ ...i, [f]: v }));
    setServerFields((all) => {
      const rest = { ...all };
      delete rest[f];
      return rest;
    });
  };
  const touch = (f: Field) => setTouched((t) => new Set(t).add(f));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(new Set(Object.keys(EMPTY) as Field[]));
    if (Object.keys(validateSignup(input)).length || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.replace("/waiting");
        return;
      }
      if (body.fields) setServerFields(body.fields);
      setError(body.fields ? null : (body.error ?? "Something went wrong. Please try again."));
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  const field = (f: Exclude<Field, "discipline" | "password">, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={f} className="block text-body font-semibold text-ink">
        {SIGNUP_FIELDS[f].label}
      </label>
      <p id={`${f}-help`} className="mt-0.5 mb-2 text-micro leading-snug text-muted">
        {SIGNUP_FIELDS[f].help}
      </p>
      <input
        id={f}
        value={input[f]}
        onChange={(e) => set(f, e.target.value)}
        onBlur={() => touch(f)}
        aria-invalid={!!shown(f)}
        aria-describedby={`${f}-help`}
        className={authInputClass}
        {...props}
      />
      <FieldError message={shown(f)} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <p className="micro-label">Engineer</p>
        <h1 className="mt-1 font-serif text-heading font-medium text-ink">Create account</h1>
      </div>

      {field("fullName", { dir: "auto", autoComplete: "name", maxLength: 120 })}

      <fieldset>
        <legend className="block text-body font-semibold text-ink">{SIGNUP_FIELDS.discipline.label}</legend>
        <p className="mt-0.5 mb-2 text-micro leading-snug text-muted">{SIGNUP_FIELDS.discipline.help}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {DISCIPLINES.map((d) => (
            <label
              key={d}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3 py-2.5 text-body transition-colors ${
                input.discipline === d ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-soft"
              }`}
            >
              <input
                type="radio"
                name="discipline"
                value={d}
                checked={input.discipline === d}
                onChange={() => {
                  set("discipline", d);
                  touch("discipline");
                }}
                className="h-5 w-5 accent-accent"
              />
              {DISCIPLINE_LABEL[d]}
            </label>
          ))}
        </div>
        <FieldError message={shown("discipline")} />
      </fieldset>

      {field("contact", { type: "tel", inputMode: "tel", autoComplete: "tel", maxLength: 30, placeholder: "+961 00 000 000" })}
      {field("oeaNumber", { autoComplete: "off", autoCapitalize: "characters", maxLength: 20 })}
      {field("username", { autoComplete: "username", autoCapitalize: "none", spellCheck: false, maxLength: 40 })}

      <div>
        <label htmlFor="password" className="block text-body font-semibold text-ink">
          {SIGNUP_FIELDS.password.label}
        </label>
        <p id="password-help" className="mt-0.5 mb-2 text-micro leading-snug text-muted">
          {SIGNUP_FIELDS.password.help}
        </p>
        <PasswordInput
          id="password"
          value={input.password}
          onChange={(v) => {
            set("password", v);
          }}
          autoComplete="new-password"
          invalid={!!shown("password")}
          describedBy="password-help"
        />
        <FieldError message={shown("password")} />
      </div>

      {error && (
        <p role="alert" className="rounded-control bg-attention-soft px-3 py-2.5 text-body text-attention">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={saving}
        className="w-full"
      >
        {saving ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-body text-muted">
        Already have an account?{" "}
        <Link href="/login" className="inline-flex min-h-11 items-center px-1 font-medium text-accent underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-micro text-attention">{message}</p>;
}
