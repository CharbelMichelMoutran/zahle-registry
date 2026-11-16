import { AREA_CONTENT, COLOUR_CONTENT, COLOUR_FIELD, DRAFT_BANNER, FIELDS, NOT_INSPECTED, NOT_YET_VERIFIED } from "@/lib/content";
import { formatConstructionDate, formatDate, formatSaveTime } from "@/lib/format";
import { AREAS, reportConstructionDate, type ConstructionDateChange, type Report } from "@/lib/report";
import { ColourBadge } from "./ColourBadge";
import { DraftBanner, Section } from "./ui";

/** A saved report, read-only, in the same order and with the same labels as the form. */
export default function ReportView({ report, change }: { report: Report; change?: ConstructionDateChange }) {
  const r = report;
  return (
    <article className="space-y-5">
      <DraftBanner text={DRAFT_BANNER} />
      <p className="text-xs text-slate-500">
        Saved {formatSaveTime(r.created_at)}. A saved report cannot be changed.
      </p>

      <Section label={FIELDS.engineerName.label}>
        <Value>{r.engineer_name}</Value>
      </Section>
      <Section label={FIELDS.engineerContact.label}>
        <Value>{r.engineer_contact}</Value>
      </Section>
      <Section label={FIELDS.reportDate.label}>
        <Value>{formatDate(r.report_date)}</Value>
      </Section>
      <Section label={FIELDS.residents.label}>
        <Value muted={r.residents_not_verified}>
          {r.residents_not_verified ? NOT_YET_VERIFIED : r.residents_count}
        </Value>
        <p className="mt-1 text-xs text-slate-500">{FIELDS.residents.caveat}</p>
      </Section>
      <Section label={FIELDS.construction.label}>
        <Value muted={r.construction_not_verified}>{formatConstructionDate(reportConstructionDate(r))}</Value>
        {change && (
          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
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
            <p className="mt-1 text-xs text-slate-500">
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <ColourBadge colour={r.colour} long />
          <p className="mt-1 text-sm text-slate-600">{COLOUR_CONTENT[r.colour].description}</p>
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
        "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[15px] break-words",
        multiline ? "whitespace-pre-wrap" : "",
        muted ? "text-slate-500" : "text-slate-900",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Neutral label, in the place the observation would be. Never blank, never a warning. */
export function NotInspected({ reason }: { reason: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[15px]">
      <span className="font-medium text-slate-700">{NOT_INSPECTED}</span>
      <p dir="auto" className="mt-0.5 whitespace-pre-wrap break-words text-slate-600">
        {reason}
      </p>
    </div>
  );
}
