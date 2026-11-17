import { AREA_LABEL, NO_REMARKS, NOT_INSPECTED, NOT_YET_VERIFIED, REPORT_TEXT } from "@/lib/content";
import { formatConstructionDate, formatDate, formatSaveTime } from "@/lib/format";
import { AREAS, reportConstructionDate, type ConstructionDateChange, type Report } from "@/lib/report";
import { ColourBadge } from "./ColourBadge";
import { ReportBy } from "./ReportBy";
import { Row } from "./ui";

/** A saved report, read-only, in the same calm layout as the form. */
export default function ReportView({ report, change }: { report: Report; change?: ConstructionDateChange }) {
  const r = report;
  return (
    <article className="space-y-7 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <ColourBadge colour={r.colour} long />
        <p className="text-micro text-muted">
          {REPORT_TEXT.saved} <span className="tabular">{formatSaveTime(r.created_at)}</span>
        </p>
      </div>

      <div className="divide-y divide-line rounded-card border border-line bg-surface">
        <Row label={REPORT_TEXT.date}>
          <Value>{formatDate(r.report_date)}</Value>
        </Row>
        <Row label={REPORT_TEXT.residents}>
          <Value>{r.residents_not_verified ? <NotYetVerified /> : r.residents_count}</Value>
        </Row>
        <Row
          label={REPORT_TEXT.built}
          hint={
            change && (
              <>
                {REPORT_TEXT.previously}{" "}
                {formatConstructionDate({
                  year: change.previous_year,
                  month: change.previous_month,
                  approximate: change.previous_approximate,
                  notVerified: change.previous_not_verified,
                })}
                , changed by <bdi dir="auto">{change.changed_by}</bdi>
                {change.reason?.trim() && (
                  <>
                    : <bdi dir="auto" className="whitespace-pre-wrap">{change.reason}</bdi>
                  </>
                )}
              </>
            )
          }
        >
          <Value>
            {r.construction_not_verified ? <NotYetVerified /> : formatConstructionDate(reportConstructionDate(r))}
          </Value>
        </Row>
      </div>

      <div className="space-y-5">
        {AREAS.map((area) => {
          const text = r[`${area}_observation`]?.trim();
          const reason = r[`${area}_not_inspected_reason`];
          return (
            <section key={area}>
              <h3 className="flex min-h-11 items-center text-body font-semibold text-ink">{AREA_LABEL[area]}</h3>
              {reason !== null ? (
                <p className="text-lead text-ink">
                  <span className="font-medium">{NOT_INSPECTED}</span>
                  {reason.trim() && (
                    <span dir="auto" className="mt-0.5 block whitespace-pre-wrap break-words text-muted">
                      {reason}
                    </span>
                  )}
                </p>
              ) : text ? (
                <p dir="auto" className="whitespace-pre-wrap break-words text-lead text-ink">
                  {text}
                </p>
              ) : (
                <p className="text-lead text-muted">{NO_REMARKS}</p>
              )}
            </section>
          );
        })}
      </div>

      <div className="border-t border-dashed border-line pt-4">
        <ReportBy
          name={r.engineer_name}
          discipline={r.engineer_discipline}
          oeaNumber={r.engineer_oea_number}
          contact={r.engineer_contact}
        />
      </div>
    </article>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <span dir="auto" className="tabular py-2.5 text-lead break-words text-ink">
      {children}
    </span>
  );
}

/** An unknown, never a finding (plan rule 3): neutral grey with the small "no data" hatch. */
function NotYetVerified() {
  return (
    <span className="inline-flex items-center gap-2 text-muted">
      <span className="hatch h-3.5 w-3.5 shrink-0 rounded-[4px] border border-line" aria-hidden />
      {NOT_YET_VERIFIED}
    </span>
  );
}
