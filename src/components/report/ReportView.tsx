import { AREA_CONTENT, COLOUR_CONTENT, COLOUR_FIELD, DRAFT_BANNER, FIELDS, NOT_INSPECTED, NOT_YET_VERIFIED } from "@/lib/content";
import { formatConstructionDate, formatDate, formatSaveTime } from "@/lib/format";
import { AREAS, reportConstructionDate, type ConstructionDateChange, type Report } from "@/lib/report";
import { ColourBadge } from "./ColourBadge";
import { ReportByBox } from "./ReportByBox";
import { DraftBanner, Section } from "./ui";

/** A saved report, read-only, in the same order and with the same labels as the form. */
export default function ReportView({ report, change }: { report: Report; change?: ConstructionDateChange }) {
  const r = report;
  return (
    <article className="space-y-5">
      <DraftBanner text={DRAFT_BANNER} />
      <p className="text-micro text-muted">
        Saved {formatSaveTime(r.created_at)}. A saved report cannot be changed.
      </p>

      <ReportByBox
        name={r.engineer_name}
        discipline={r.engineer_discipline}
        contact={r.engineer_contact}
        oeaNumber={r.engineer_oea_number}
      />
      <Section label={FIELDS.reportDate.label}>
        <Value>{formatDate(r.report_date)}</Value>
      </Section>
      <Section label={FIELDS.residents.label}>
        <Value muted={r.residents_not_verified}>
          {r.residents_not_verified ? NOT_YET_VERIFIED : r.residents_count}
        </Value>
        <p className="mt-1 text-micro text-muted">{FIELDS.residents.caveat}</p>
      </Section>
      <Section label={FIELDS.construction.label}>
        <Value muted={r.construction_not_verified}>{formatConstructionDate(reportConstructionDate(r))}</Value>
        {change && (
          <div className="mt-2 rounded-control border border-line bg-surface p-3 text-body text-ink">
            <p>
              Changed in this report. Previous value:{" "}
              <span className="font-medium">
                {formatConstructionDate({
                  year: change.previous_year,
                  month: change.previous_month,
                  approximate: change.previous_approximate,
                  notVerified: change.previous_not_verified,
                })}
              </span>
              .
            </p>
            <p className="mt-1">
              Reason: <bdi dir="auto" className="whitespace-pre-wrap">{change.reason}</bdi>
            </p>
            <p className="mt-1 text-micro text-muted">
              Changed by <bdi dir="auto">{change.changed_by}</bdi>, {formatSaveTime(change.changed_at)}
            </p>
          </div>
        )}
      </Section>

      {AREAS.map((area) => {
        const text = r[`${area}_observation`];
        const reason = r[`${area}_not_inspected_reason`];
        return (
          <Section key={area} label={AREA_CONTENT[area].label}>
            {reason !== null ? <NotInspected reason={reason} /> : <Value multiline>{text}</Value>}
          </Section>
        );
      })}

      <Section label={COLOUR_FIELD.label}>
        <div className="rounded-control border border-line bg-surface-soft p-3">
          <ColourBadge colour={r.colour} long />
          <p className="mt-1 text-body text-muted">{COLOUR_CONTENT[r.colour].description}</p>
        </div>
      </Section>
    </article>
  );
}

function Value({ children, muted, multiline }: { children: React.ReactNode; muted?: boolean; multiline?: boolean }) {
  return (
    <div
      dir="auto"
      className={[
        "rounded-control border border-line bg-surface-soft px-3 py-2 text-body break-words",
        multiline ? "whitespace-pre-wrap" : "",
        muted ? "text-muted" : "text-ink",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Neutral label, in the place the observation would be. Never blank, never a warning. */
export function NotInspected({ reason }: { reason: string }) {
  return (
    <div className="rounded-control border border-line bg-surface-soft px-3 py-2 text-body">
      <span className="font-medium text-ink">{NOT_INSPECTED}</span>
      <p dir="auto" className="mt-0.5 whitespace-pre-wrap break-words text-muted">
        {reason}
      </p>
    </div>
  );
}
