import { DISCIPLINE_LABEL, REPORT_BY_LABEL, type Discipline } from "@/lib/account";

/**
 * Who wrote the report, as one small muted line: name, discipline, OEA number,
 * and on saved reports the contact, so the next engineer can call. Locked
 * everywhere: on the form it comes from the account, on a saved report it is
 * the copy stored with it.
 */
export function ReportBy({
  name,
  discipline,
  oeaNumber,
  contact,
}: {
  name: string;
  discipline: Discipline | null;
  oeaNumber: string | null;
  contact?: string | null;
}) {
  return (
    <p className="flex items-start gap-1.5 text-micro text-muted">
      <svg viewBox="0 0 20 20" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" role="img" aria-label="Locked">
        <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
        <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
      </svg>
      <span className="min-w-0 break-words">
        {REPORT_BY_LABEL} <bdi dir="auto" className="font-medium text-ink">{name}</bdi>
        {discipline && `, ${DISCIPLINE_LABEL[discipline]}`}
        {oeaNumber && <> · OEA no. <span className="tabular">{oeaNumber}</span></>}
        {contact && <> · <bdi dir="auto" className="tabular">{contact}</bdi></>}
      </span>
    </p>
  );
}
