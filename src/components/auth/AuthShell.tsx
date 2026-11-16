import { DEMO_NOTICE } from "@/lib/account";

/** Frame for the sign-up, login and waiting screens. Shows no building data (plan rule 2). */
export function AuthShell({ children, notice = false }: { children: React.ReactNode; notice?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4">
        <span className="text-base font-semibold tracking-tight text-slate-900">Zahle Building Registry</span>
      </header>
      <main className="flex flex-1 justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-5">
          {notice && <DemoNotice />}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function DemoNotice() {
  return (
    <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-[13px] leading-snug text-amber-950">
      <p className="font-semibold">{DEMO_NOTICE.title}</p>
      <p className="mt-1">{DEMO_NOTICE.body}</p>
    </div>
  );
}

export const authInputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 " +
  "focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 aria-[invalid=true]:border-red-600";
