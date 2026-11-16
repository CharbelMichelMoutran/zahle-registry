"use client";

import { useId, useMemo, useState } from "react";
import {
  AREA_CONTENT,
  COLOUR_CONTENT,
  COLOUR_FIELD,
  DRAFT_BANNER,
  FIELDS,
  FINAL_PROMPT_BY_COLOUR,
  MONTHS,
  NOT_INSPECTED,
  NOT_YET_VERIFIED,
} from "@/lib/content";
import { firstLine, formatConstructionDate, formatDate } from "@/lib/format";
import {
  allAreasComplete,
  areaAllowsNotInspected,
  AREAS,
  COLOURS,
  LIMITS,
  reportConstructionDate,
  todayParts,
  validateReport,
  type Area,
  type ObservationInput,
  type Report,
  type ReportInput,
} from "@/lib/report";
import type { Engineer } from "@/lib/account";
import { apiFetch } from "@/lib/client-fetch";
import { DOT_CLASS } from "./ColourBadge";
import { REPORT_BY_HELP, ReportByBox } from "./ReportByBox";
import { Checkbox, DraftBanner, FieldError, inputClass, Section } from "./ui";

export function newDraft(latest: Report | null): ReportInput {
  const [y, m, d] = todayParts();
  const empty = (): ObservationInput => ({ text: "", notInspected: false, reason: "" });
  return {
    clientRequestId: crypto.randomUUID(),
    basedOnReportId: latest?.id ?? null,
    day: String(d),
    month: String(m),
    year: String(y),
    residents: "",
    residentsNotVerified: false,
    ...prefillConstruction(latest),
    constructionChangeReason: "",
    observations: { roof: empty(), columns: empty(), foundations: empty(), final: empty() },
    colour: null,
  };
}

/** Construction date fields prefilled from the latest report (empty for a first report). */
export function prefillConstruction(latest: Report | null) {
  return {
    constructionYear: latest?.construction_year ? String(latest.construction_year) : "",
    constructionMonth: latest?.construction_month ? String(latest.construction_month) : "",
    constructionApproximate: latest?.construction_approximate ?? false,
    constructionNotVerified: latest?.construction_not_verified ?? false,
  };
}

type Props = {
  buildingId: string;
  engineer: Engineer | null;
  draft: ReportInput;
  onChange: (update: (d: ReportInput) => ReportInput) => void;
  /** The report the construction date was prefilled from. */
  latest: Report | null;
  onSaved: (report: Report) => void;
  /** Another report was saved meanwhile: reload and re-base the prefill. */
  onStale: () => Promise<void>;
};

export default function ReportForm({ buildingId, engineer, draft, onChange, latest, onSaved, onStale }: Props) {
  const uid = useId();
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const previous = latest ? reportConstructionDate(latest) : null;
  const { errors, constructionChanged } = useMemo(
    () => validateReport(draft, previous, todayParts()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, latest],
  );
  const areasComplete = allAreasComplete(draft.observations);
  const valid = Object.keys(errors).length === 0 && engineer !== null;

  const touch = (field: string) => setTouched((t) => (t.has(field) ? t : new Set(t).add(field)));
  const shown = (field: string) => (touched.has(field) ? errors[field] : undefined);
  const set = <K extends keyof ReportInput>(key: K, value: ReportInput[K]) =>
    onChange((d) => ({ ...d, [key]: value }));
  const setObservation = (area: Area, patch: Partial<ObservationInput>) =>
    onChange((d) => ({
      ...d,
      observations: { ...d.observations, [area]: { ...d.observations[area], ...patch } },
    }));

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      const res = await apiFetch(`/api/buildings/${buildingId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        onSaved(body.report as Report);
        return;
      }
      if (res.status === 409) await onStale();
      if (body.fields) setTouched(new Set(Object.keys(body.fields)));
      setServerError(body.error ?? "Could not save the report. Please try again.");
    } catch {
      setServerError("No connection. Your report is kept here; try again when you are back online.");
    } finally {
      setSaving(false);
    }
  }

  const ids = {
    day: `${uid}-day`,
    residents: `${uid}-residents`,
    constructionYear: `${uid}-cyear`,
    reason: `${uid}-reason`,
  };

  const missing = missingList(errors);

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <DraftBanner text={DRAFT_BANNER} />

      {/* Engineer: from the account, locked. The server copies it from the session, not from this form. */}
      {engineer ? (
        <ReportByBox
          name={engineer.fullName}
          discipline={engineer.discipline}
          contact={engineer.contact}
          oeaNumber={engineer.oeaNumber}
          help={REPORT_BY_HELP}
        />
      ) : (
        <div className="h-24 animate-pulse rounded-lg bg-slate-100" aria-label="Loading your account" />
      )}

      {/* Date of report: day / month / year */}
      <Section label={FIELDS.reportDate.label} htmlFor={ids.day} help={FIELDS.reportDate.help}>
        <div className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-2" onBlur={() => touch("reportDate")}>
          <input
            id={ids.day}
            aria-label="Day"
            inputMode="numeric"
            placeholder="Day"
            maxLength={2}
            value={draft.day}
            onChange={(e) => set("day", e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!shown("reportDate")}
            className={inputClass}
          />
          <select
            aria-label="Month"
            value={draft.month}
            onChange={(e) => set("month", e.target.value)}
            aria-invalid={!!shown("reportDate")}
            className={inputClass}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>
                {m}
              </option>
            ))}
          </select>
          <input
            aria-label="Year"
            inputMode="numeric"
            placeholder="Year"
            maxLength={4}
            value={draft.year}
            onChange={(e) => set("year", e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!shown("reportDate")}
            className={inputClass}
          />
        </div>
        <FieldError message={shown("reportDate")} />
      </Section>

      {/* Residents */}
      <Section label={FIELDS.residents.label} htmlFor={ids.residents} help={FIELDS.residents.help}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <input
            id={ids.residents}
            inputMode="numeric"
            maxLength={4}
            disabled={draft.residentsNotVerified}
            value={draft.residentsNotVerified ? "" : draft.residents}
            onChange={(e) => set("residents", e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => touch("residents")}
            aria-invalid={!!shown("residents")}
            className={`${inputClass} max-w-32`}
          />
          <Checkbox
            label={NOT_YET_VERIFIED}
            checked={draft.residentsNotVerified}
            onChange={(v) => {
              set("residentsNotVerified", v);
              touch("residents");
            }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">{FIELDS.residents.caveat}</p>
        <FieldError message={shown("residents")} />
      </Section>

      {/* Construction date */}
      <Section label={FIELDS.construction.label} htmlFor={ids.constructionYear} help={FIELDS.construction.help}>
        {latest && (
          <p className="mb-2 text-[13px] text-slate-500">
            Prefilled from the report of {formatDate(latest.report_date)}.
          </p>
        )}
        <div className="grid grid-cols-[5.5rem_1fr] gap-2">
          <input
            id={ids.constructionYear}
            aria-label="Construction year"
            inputMode="numeric"
            placeholder="Year"
            maxLength={4}
            disabled={draft.constructionNotVerified}
            value={draft.constructionNotVerified ? "" : draft.constructionYear}
            onChange={(e) => set("constructionYear", e.target.value.replace(/\D/g, ""))}
            onBlur={() => touch("constructionYear")}
            aria-invalid={!!shown("constructionYear")}
            className={inputClass}
          />
          <select
            aria-label="Construction month (optional)"
            disabled={draft.constructionNotVerified}
            value={draft.constructionNotVerified ? "" : draft.constructionMonth}
            onChange={(e) => set("constructionMonth", e.target.value)}
            className={inputClass}
          >
            <option value="">Month (optional)</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-5">
          <Checkbox
            label={FIELDS.construction.approximate}
            checked={!draft.constructionNotVerified && draft.constructionApproximate}
            onChange={(v) => set("constructionApproximate", v)}
          />
          <Checkbox
            label={NOT_YET_VERIFIED}
            checked={draft.constructionNotVerified}
            onChange={(v) => {
              onChange((d) => ({ ...d, constructionNotVerified: v, constructionApproximate: v ? false : d.constructionApproximate }));
              touch("constructionYear");
            }}
          />
        </div>
        <FieldError message={shown("constructionYear")} />

        {constructionChanged && previous && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[13px] text-slate-700">
              Previous value: <span className="font-medium">{formatConstructionDate(previous)}</span>. It will be
              kept in the history.
            </p>
            <label htmlFor={ids.reason} className="mt-3 block text-sm font-semibold text-slate-900">
              {FIELDS.constructionReason.label}
            </label>
            <p className="mt-0.5 mb-2 text-[13px] text-slate-500">{FIELDS.constructionReason.prompt}</p>
            <textarea
              id={ids.reason}
              dir="auto"
              rows={2}
              maxLength={LIMITS.reasonMax + 50}
              value={draft.constructionChangeReason}
              onChange={(e) => set("constructionChangeReason", e.target.value)}
              onBlur={() => touch("constructionChangeReason")}
              aria-invalid={!!shown("constructionChangeReason")}
              className={inputClass}
            />
            <Counter value={draft.constructionChangeReason} max={LIMITS.reasonMax} />
            <FieldError message={shown("constructionChangeReason")} />
          </div>
        )}
      </Section>

      {/* Observations */}
      {AREAS.map((area) => (
        <ObservationField
          key={area}
          area={area}
          value={draft.observations[area]}
          prompt={area === "final" && draft.colour ? FINAL_PROMPT_BY_COLOUR[draft.colour] : undefined}
          error={shown(area)}
          onChange={(patch) => setObservation(area, patch)}
          onBlur={() => touch(area)}
        />
      ))}

      {/* Colour: last, required, no default */}
      <section className="space-y-3 border-t border-slate-200 pt-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{COLOUR_FIELD.label}</h3>
          <p className="mt-0.5 text-[13px] text-slate-500">{COLOUR_FIELD.help}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
            Your observations, in short
          </p>
          <dl className="space-y-1.5 text-[13px]">
            {AREAS.map((area) => (
              <div key={area} className="flex gap-2">
                <dt className="w-24 shrink-0 font-medium text-slate-700">{AREA_CONTENT[area].label}</dt>
                <dd dir="auto" className="min-w-0 break-words text-slate-600">
                  {summary(area, draft.observations[area])}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[13px] leading-snug text-amber-950">
          <span className="font-semibold">{COLOUR_FIELD.warningTitle}</span>{" "}
          <span className="hidden sm:inline">{COLOUR_FIELD.warning}</span>
          <span className="sm:hidden">{COLOUR_FIELD.warningShort.replace("Choose carefully. ", "")}</span>
        </div>

        <fieldset disabled={!areasComplete} className="space-y-2 disabled:opacity-50">
          <legend className="sr-only">{COLOUR_FIELD.label}</legend>
          {COLOURS.map((colour) => {
            const c = COLOUR_CONTENT[colour];
            const selected = draft.colour === colour;
            return (
              <label
                key={colour}
                className={[
                  "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
                  selected ? "border-slate-900 bg-white ring-1 ring-slate-900" : "border-slate-200 bg-white hover:border-slate-400",
                  !areasComplete ? "cursor-not-allowed" : "",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name={`${uid}-colour`}
                  value={colour}
                  checked={selected}
                  onChange={() => set("colour", colour)}
                  className="mt-1 h-4 w-4 shrink-0 accent-slate-900"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className={`h-3 w-3 rounded-full ${DOT_CLASS[colour]}`} aria-hidden />
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-slate-600">{c.description}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
        {!areasComplete ? (
          <p className="text-[13px] text-slate-500">{COLOUR_FIELD.locked}</p>
        ) : (
          !draft.colour && <p className="text-[13px] text-slate-500">{COLOUR_FIELD.required}</p>
        )}
      </section>

      {/* Save */}
      <div className="sticky bottom-0 -mx-5 border-t border-slate-200 bg-white/95 px-5 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur">
        {serverError && (
          <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-800">
            {serverError}
          </p>
        )}
        <button
          type="submit"
          disabled={!valid || saving}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? "Saving…" : "Save report"}
        </button>
        {!valid && missing && <p className="mt-1.5 truncate text-center text-xs text-slate-500">{missing}</p>}
      </div>
    </form>
  );
}

function ObservationField({
  area,
  value,
  prompt,
  error,
  onChange,
  onBlur,
}: {
  area: Area;
  value: ObservationInput;
  prompt?: string;
  error?: string;
  onChange: (patch: Partial<ObservationInput>) => void;
  onBlur: () => void;
}) {
  const id = useId();
  const content = AREA_CONTENT[area];
  const canSkip = areaAllowsNotInspected(area);
  const notInspected = canSkip && value.notInspected;

  return (
    <Section label={content.label} htmlFor={id} help={notInspected ? undefined : (prompt ?? content.prompt)}>
      {notInspected ? (
        <>
          <label htmlFor={id} className="mt-1.5 mb-1 block text-[13px] font-medium text-slate-700">
            {FIELDS.notInspected.reasonLabel}
          </label>
          <textarea
            id={id}
            dir="auto"
            rows={2}
            maxLength={LIMITS.reasonMax + 50}
            value={value.reason}
            onChange={(e) => onChange({ reason: e.target.value })}
            onBlur={onBlur}
            aria-invalid={!!error}
            className={inputClass}
          />
          <Counter value={value.reason} max={LIMITS.reasonMax} />
        </>
      ) : (
        <>
          <textarea
            id={id}
            dir="auto"
            rows={4}
            maxLength={LIMITS.observationMax + 100}
            value={value.text}
            onChange={(e) => onChange({ text: e.target.value })}
            onBlur={onBlur}
            aria-invalid={!!error}
            className={inputClass}
          />
          <Counter value={value.text} max={LIMITS.observationMax} />
        </>
      )}
      <FieldError message={error} />

      {canSkip && (
        <Checkbox
          label={NOT_INSPECTED}
          help={FIELDS.notInspected.help}
          checked={value.notInspected}
          onChange={(v) => {
            onChange({ notInspected: v });
            onBlur();
          }}
        />
      )}

      {!notInspected && (
        <details className="group mt-1 text-[13px]">
          <summary className="cursor-pointer py-1 font-medium text-slate-600 select-none hover:text-slate-900">
            What to look at
          </summary>
          <div className="mt-1 space-y-2 rounded-lg bg-slate-50 p-3 text-slate-600">
            <p>{content.lookAt}</p>
            <p className="text-xs text-slate-500">Example phrases (tap to add, then edit):</p>
            <div className="flex flex-col gap-1.5">
              {content.examples.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => {
                    const text = value.text.trim();
                    onChange({ text: text ? `${text}\n${phrase}` : phrase });
                  }}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-left text-slate-700 hover:border-slate-400"
                >
                  {phrase}
                </button>
              ))}
            </div>
            {content.note && <p className="text-xs text-slate-500">{content.note}</p>}
          </div>
        </details>
      )}
    </Section>
  );
}

function Counter({ value, max }: { value: string; max: number }) {
  const n = [...value.trim()].length;
  return (
    <p className={`mt-1 text-right text-xs tabular-nums ${n > max ? "text-red-700" : "text-slate-400"}`}>
      {n} / {max}
    </p>
  );
}

function summary(area: Area, o: ObservationInput) {
  if (o.notInspected && areaAllowsNotInspected(area)) {
    return o.reason.trim() ? `${NOT_INSPECTED}: ${firstLine(o.reason, 80)}` : `${NOT_INSPECTED}: (reason needed)`;
  }
  return o.text.trim() ? firstLine(o.text, 80) : <span className="text-slate-400">Not written yet</span>;
}

const FIELD_NAMES: Record<string, string> = {
  reportDate: "date of report",
  residents: "people living in the building",
  constructionYear: "construction date",
  constructionChangeReason: "reason for the change",
  roof: "roof",
  columns: "columns",
  foundations: "foundations",
  final: "final observation",
  colour: "colour",
};

function missingList(errors: Record<string, string | undefined>) {
  const names = Object.keys(errors).map((k) => FIELD_NAMES[k]).filter(Boolean);
  if (names.length === 0) return null;
  const shown = names.slice(0, 3).join(", ");
  return names.length > 3 ? `Still needed: ${shown} and ${names.length - 3} more.` : `Still needed: ${shown}.`;
}

