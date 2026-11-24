"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { DISCIPLINE_LABEL } from "@/lib/account";
import { NOT_YET_VERIFIED } from "@/lib/content";
import { formatConstructionDate, formatDate, formatSaveTime } from "@/lib/format";
import {
  CLASSIFICATION,
  CONSTRUCTION,
  METHODS,
  PARTS,
  RATING_LABEL,
  SECTIONS,
  type Details,
  type Rating,
} from "@/lib/engineer-report";
import { reportConstructionDate, type ConstructionDateChange, type Report } from "@/lib/report";
import { DOT_CLASS } from "../../report/ColourBadge";

const noSubscribe = () => () => {};
const photoUrl = (path: string) => `/api/engineer/photo?path=${encodeURIComponent(path)}`;

const CONDITION_TEXT: Record<Rating, string> = {
  none: "text-ink",
  moderate: "text-attention",
  severe: "text-rooftile font-semibold",
  unseen: "text-muted",
};

/**
 * A saved engineer report (plan.md item 27): the same numbered sections as the
 * form, read-only, with "Print / Save as PDF" for a paper copy.
 */
export default function ReportDocument({
  report,
  details,
  change,
}: {
  report: Report;
  details: Details;
  change?: ConstructionDateChange;
}) {
  // The paper copy lives on <body>, which exists only in the browser.
  const printRoot = useSyncExternalStore(
    noSubscribe,
    () => document.body,
    () => null,
  );

  return (
    <div className="pb-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-micro text-muted">
          <span className="tabular font-semibold text-ink">{report.report_number}</span> · Saved{" "}
          <span className="tabular">{formatSaveTime(report.created_at)}</span>
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-micro font-medium text-ink transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-accent"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <path d="M4 6V2h8v4M4 12H2.5V6.5h11V12H12M4 9.5h8V14H4z" />
          </svg>
          Print / Save as PDF
        </button>
      </div>
      <Body report={report} details={details} change={change} />
      {/* The paper copy: hidden on screen, the only thing printed (globals.css). */}
      {printRoot &&
        createPortal(
          <div className="print-sheet hidden print:block">
            <header className="mb-6 flex items-end justify-between border-b-2 border-ink pb-2">
              <div>
                <p className="text-micro tracking-[0.08em] text-muted uppercase">Zahle on Record</p>
                <h1 className="font-serif text-[26px]/[30px] text-ink">Building condition report</h1>
              </div>
              <p className="tabular text-right text-body text-ink">
                <span className="font-semibold">{report.report_number}</span>
                <br />
                {formatDate(report.report_date)}
              </p>
            </header>
            <Body report={report} details={details} change={change} print />
          </div>,
          printRoot,
        )}
    </div>
  );
}

function Body({
  report: r,
  details: d,
  change,
  print = false,
}: {
  report: Report;
  details: Details;
  change?: ConstructionDateChange;
  print?: boolean;
}) {
  const id = d.identification;
  const desc = d.description;
  const structure = CONSTRUCTION.find((c) => c.id === desc.structure)?.label;
  const method = METHODS.find((m) => m.id === d.method)?.label;
  const builtText = r.construction_not_verified || r.construction_year === null ? NOT_YET_VERIFIED : formatConstructionDate(reportConstructionDate(r));
  const partPhotos = PARTS.flatMap((p) => d.parts[p.id].photos.map((path) => ({ path, part: p.label })));

  return (
    <article className="space-y-8 print:space-y-6">
      {/* 1. Identification */}
      <Section n={1}>
        <div className={id.coverPhoto ? "grid gap-4 sm:grid-cols-[1fr_11rem] print:grid-cols-[1fr_12rem]" : ""}>
          <Facts
            rows={[
              ["Report no.", r.report_number],
              ["Date", formatDate(r.report_date)],
              ["Building name", id.buildingName],
              ["Street", id.street],
              ["Landmark", id.landmark],
              ["Plot no.", id.plot],
              ["GPS", d.gps ? `${d.gps.lat.toFixed(5)}, ${d.gps.lng.toFixed(5)}` : null],
            ]}
          />
          {id.coverPhoto && (
            // eslint-disable-next-line @next/next/no-img-element -- private, short-lived links from our own server
            <img src={photoUrl(id.coverPhoto)} alt="Front of building" className="w-full rounded-control border border-line object-cover sm:aspect-[3/4]" />
          )}
        </div>
      </Section>

      {/* 2. Building description */}
      <Section n={2}>
        <Facts
          rows={[
            ["Built", builtText],
            ["Floors", desc.floors],
            ["Basements", desc.basements],
            ["Added on roof", desc.addedOnRoof],
            ["Units", desc.units],
            ["Residents", r.residents_not_verified ? NOT_YET_VERIFIED : String(r.residents_count)],
            ["Structure", structure],
            ["Use", desc.use.join(", ")],
            ["Features", desc.features.join(", ")],
          ]}
        />
        {change && (
          <p className="mt-2 text-micro text-muted">
            Construction date previously{" "}
            {formatConstructionDate({
              year: change.previous_year,
              month: change.previous_month,
              approximate: change.previous_approximate,
              notVerified: change.previous_not_verified,
            })}
            {change.reason?.trim() && (
              <>
                : <bdi dir="auto">{change.reason}</bdi>
              </>
            )}
          </p>
        )}
      </Section>

      {/* 3. Inspection method */}
      <Section n={3}>
        <p className="text-body text-ink">{method ?? <Empty />}</p>
      </Section>

      {/* 4. Condition of structural elements */}
      <Section n={4}>
        <table className="w-full border-collapse text-left text-body">
          <thead>
            <tr className="border-b border-line text-micro text-muted">
              <th scope="col" className="w-[34%] py-1.5 pr-3 font-medium">Element</th>
              <th scope="col" className="w-[22%] py-1.5 pr-3 font-medium">Condition</th>
              <th scope="col" className="py-1.5 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {PARTS.map((p) => {
              const e = d.parts[p.id];
              return (
                <tr key={p.id} className="border-b border-line align-top last:border-b-0 print:break-inside-avoid">
                  <th scope="row" className="py-2 pr-3 font-medium text-ink">{p.label}</th>
                  <td className={`py-2 pr-3 ${e.condition ? CONDITION_TEXT[e.condition] : "text-muted"}`}>
                    {e.condition ? RATING_LABEL[e.condition] : "—"}
                  </td>
                  <td dir="auto" className="py-2 whitespace-pre-wrap [unicode-bidi:plaintext] break-words text-ink">
                    {e.note || <Empty />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {partPhotos.length > 0 && (
          <div className={`mt-4 grid gap-2 ${print ? "grid-cols-4" : "grid-cols-3 sm:grid-cols-4"}`}>
            {partPhotos.map((ph, i) => (
              <figure key={ph.path} className="print:break-inside-avoid">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, short-lived links from our own server */}
                <img src={photoUrl(ph.path)} alt={`${ph.part}, photo ${i + 1}`} className="aspect-square w-full rounded-control border border-line object-cover" />
                <figcaption className="mt-0.5 text-micro text-muted">
                  <span className="tabular">{i + 1}.</span> {ph.part}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Section>

      {/* 5. Observations and remarks */}
      <Section n={5}>
        {r.final_observation?.trim() ? (
          <p dir="auto" className="whitespace-pre-wrap [unicode-bidi:plaintext] break-words text-body text-ink">{r.final_observation}</p>
        ) : (
          <Empty />
        )}
      </Section>

      {/* 6. Overall classification */}
      <Section n={6}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="inline-flex items-center gap-2 text-lead font-semibold text-ink">
            <span className={`h-3 w-3 rounded-[2px] ${DOT_CLASS[r.colour]}`} aria-hidden />
            {CLASSIFICATION[r.colour]}
          </p>
          <p className="text-body text-muted">
            Estimated damage: <span className="tabular text-ink">{d.damage ?? "—"}</span>
          </p>
        </div>
      </Section>

      {/* 7. Recommended actions */}
      <Section n={7}>
        <Facts
          rows={[
            ["Actions", d.actions.picks.join(", ")],
            ["Inspect again by", d.actions.inspectBy ? formatDate(d.actions.inspectBy) : null],
            ["Note", d.actions.note],
          ]}
        />
      </Section>

      {/* 8. Certification */}
      <Section n={8}>
        <Facts
          rows={[
            ["Engineer", r.engineer_name],
            ["Discipline", r.engineer_discipline ? DISCIPLINE_LABEL[r.engineer_discipline] : null],
            ["OEA no.", r.engineer_oea_number],
            ["Contact", r.engineer_contact],
            ["Saved", formatSaveTime(r.created_at)],
          ]}
        />
        {print && (
          <div className="mt-10 grid grid-cols-2 gap-10 text-micro text-muted">
            <p className="border-t border-ink pt-1.5">Signature</p>
            <p className="border-t border-ink pt-1.5">Stamp</p>
          </div>
        )}
      </Section>
    </article>
  );
}

function Section({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <section className="print:break-inside-avoid-page">
      <h3 className="mb-2.5 border-b border-ink/80 pb-1.5 text-micro font-semibold tracking-[0.06em] text-ink uppercase">
        <span className="tabular mr-2 text-muted">{n}.</span>
        {SECTIONS[n - 1]}
      </h3>
      {children}
    </section>
  );
}

/** Label and value rows; an empty value shows a quiet dash. */
function Facts({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl className="grid grid-cols-[8.5rem_1fr] gap-x-3 gap-y-1.5 text-body">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd dir="auto" className="tabular min-w-0 break-words whitespace-pre-wrap [unicode-bidi:plaintext] text-ink">
            {value?.trim() ? value : <Empty />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Empty() {
  return <span className="text-muted">—</span>;
}
