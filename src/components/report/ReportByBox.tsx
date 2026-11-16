import { DISCIPLINE_LABEL, REPORT_BY_LABEL, type Discipline } from "@/lib/account";

export const REPORT_BY_HELP =
  "From your account. You cannot change this on a report. Other signed-in engineers can see it, so the next engineer can call you about this building.";

/**
 * Who wrote the report: name with discipline, contact, OEA number (D2.1).
 * Read-only everywhere. On the form it comes from the account; on a saved
 * report it is the copy stored with it.
 */
export function ReportByBox({
  name,
  discipline,
  contact,
  oeaNumber,
  help,
}: {
  name: string;
  discipline: Discipline | null;
  contact: string | null;
  oeaNumber: string | null;
  help?: string;
}) {
  return (
    <section>
      <h3 className="block text-sm font-semibold text-slate-900">{REPORT_BY_LABEL}</h3>
      {help && <p className="mt-0.5 mb-2 text-[13px] leading-snug text-slate-500">{help}</p>}
      <div className={`flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 ${help ? "" : "mt-1.5"}`}>
        <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6" aria-label="Locked">
          <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
          <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
        </svg>
        <div className="min-w-0 space-y-0.5 text-[15px] break-words">
          <p className="text-slate-900">
            <bdi dir="auto" className="font-medium">{name}</bdi>
            {discipline && <span className="text-slate-600">, {DISCIPLINE_LABEL[discipline]}</span>}
          </p>
          <p dir="auto" className={contact ? "text-slate-700" : "text-slate-500"}>
            {contact || "Contact not provided"}
          </p>
          {oeaNumber && <p className="text-slate-700">OEA no. {oeaNumber}</p>}
        </div>
      </div>
    </section>
  );
}
