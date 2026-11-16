"use client";

import { useState } from "react";
import { authInputClass } from "./AuthShell";

/** Password field with a "Show" toggle (D9.2). */
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "new-password" | "current-password";
  invalid?: boolean;
  describedBy?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        maxLength={200}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={`${authInputClass} pr-16`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 px-3 text-body font-medium text-muted hover:text-ink"
      >
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  );
}
