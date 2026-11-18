import Link from "next/link";
import { Logo } from "../ui/Logo";

/**
 * Frame for the sign-up, login and waiting screens: the large bilingual wordmark
 * above a calm, centred card on limestone. Shows no building data (plan rule 2).
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-ground px-4 pt-12 pb-10 sm:pt-20">
      {/* Back to the start: the landing page when signed out; the proxy routes everyone else. */}
      <Link href="/" aria-label="Zahle on Record" className="rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
        <Logo className="h-14 sm:h-16" title={null} />
      </Link>
      <main className="mt-10 w-full max-w-[440px]">
        <div className="rounded-card border border-line bg-surface p-5 shadow-tray sm:p-7">{children}</div>
      </main>
    </div>
  );
}

export const authInputClass =
  "min-h-11 w-full rounded-control border border-line bg-surface px-3 py-2 text-lead text-ink " +
  "transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft " +
  "aria-[invalid=true]:border-attention";
