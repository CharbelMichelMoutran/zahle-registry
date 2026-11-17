"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ROLE_TEXT } from "@/lib/content";
import LoginForm from "./LoginForm";
import ResidentSignIn from "./ResidentSignIn";

const BACK_LINK =
  "inline-flex min-h-11 items-center px-1 text-body font-medium text-accent underline underline-offset-2";

/**
 * The first screen (plan.md item 12): "Resident" or "Engineer". Engineer opens
 * the engineer login as before; Resident opens phone sign-in. The choice is in
 * the URL (?as=), so Back returns to it. An ended engineer session (?expired=1)
 * goes straight to the engineer login.
 */
export default function LoginScreen() {
  const params = useSearchParams();
  const as = params.has("expired") ? "engineer" : params.get("as");
  if (as === "engineer" || as === "resident") {
    return (
      <>
        {as === "engineer" ? <LoginForm /> : <ResidentSignIn />}
        <p className="mt-2 text-center">
          <Link href="/login" className={BACK_LINK}>
            {ROLE_TEXT.back}
          </Link>
        </p>
      </>
    );
  }
  return <RoleChoice />;
}

function RoleChoice() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-heading font-medium text-ink">{ROLE_TEXT.title}</h1>
        <p className="mt-1 text-body text-muted">{ROLE_TEXT.lead}</p>
      </div>
      <ul className="overflow-hidden rounded-card border border-line">
        {(["resident", "engineer"] as const).map((role) => (
          <li key={role} className="border-t border-line first:border-t-0">
            <Link
              href={`/login?as=${role}`}
              className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-soft focus-visible:bg-accent-soft focus-visible:outline-none active:bg-surface-soft"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-lead font-semibold text-ink">{ROLE_TEXT[role].label}</span>
                <span className="block text-body text-muted">{ROLE_TEXT[role].detail}</span>
              </span>
              <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
