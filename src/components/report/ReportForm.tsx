"use client";

import { motion } from "motion/react";
import { useEffect, useId, useMemo, useState } from "react";
import { AREA_LABEL, COLOUR_CONTENT, MONTHS, NOT_INSPECTED, NOT_YET_VERIFIED, REPORT_TEXT } from "@/lib/content";
import { formatConstructionDate } from "@/lib/format";
import { springSnappy } from "@/lib/motion";
import {
  areaAllowsNotInspected,
  AREAS,
  COLOURS,
  LIMITS,
  reportConstructionDate,
  todayParts,
  validateReport,
  type Area,
  type Colour,
  type FieldErrors,
  type ObservationInput,
  type Report,
  type ReportInput,
} from "@/lib/report";
import type { Engineer } from "@/lib/account";
import { apiFetch } from "@/lib/client-fetch";
import { RatingArches } from "../ui/Arch";
import { STATUS_TEXT } from "./ColourBadge";
import { ReportBy } from "./ReportBy";
import { AutoTextarea, compactInputClass, FieldError, Row, Toggle, writeClass } from "./ui";

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

/** What the tray's Save buttons show (header on wider screens, bottom bar on phones). */
export type SaveState = { disabled: boolean; label: string; error: string | null };
export const INITIAL_SAVE_STATE: SaveState = { disabled: true, label: REPORT_TEXT.save, error: null };

type Props = {
  /** The Save buttons outside the form submit it through this id. */
  formId: string;
  buildingId: string;
  engineer: Engineer | null;
  draft: ReportInput;
  onChange: (update: (d: ReportInput) => ReportInput) => void;
  /** The report the construction date was prefilled from. */
  latest: Report | null;
  onSaved: (report: Report) => void;
  /** Another report was saved meanwhile: reload and re-base the prefill. */
  onStale: () => Promise<void>;
  onSaveState: (state: SaveState) => void;
};

/** Order in which a field is focused when Save finds something to fix. */
const FIELD_ORDER = ["reportDate", "residents", "constructionYear", "constructionChangeReason", ...AREAS] as const;

const STATUS_SELECTED: Record<Colour, string> = {
  green: "border-vine bg-vine/12 ring-1 ring-vine",
  yellow: "border-apricot bg-apricot/15 ring-1 ring-apricot",
  red: "border-rooftile bg-rooftile/10 ring-1 ring-rooftile",
};

const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));

/**
 * Create report (owner, 17 Nov 2026): one calm page. Only the rating is
 * required; it can be chosen at any time. Everything else is optional, with
 * short labels and no help text. Limits are checked only on Save.
 */
export default function ReportForm({
  formId,
  buildingId,
  engineer,
  draft,
  onChange,
  latest,
  onSaved,
  onStale,
  onSaveState,
}: Props) {
  const uid = useId();
  const [showErrors, setShowErrors] = useState(false);
  // Field messages from the server, kept only for the draft they were about.
  const [serverFields, setServerFields] = useState<{ draft: ReportInput; fields: FieldErrors } | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const previous = latest ? reportConstructionDate(latest) : null;
  const { errors, constructionChanged } = useMemo(
    () => validateReport(draft, previous, todayParts()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, latest],
  );
  const canSave = draft.colour !== null && engineer !== null && !saving;

  const shown = (field: string) =>
    showErrors ? (errors[field] ?? (serverFields?.draft === draft ? serverFields.fields[field] : undefined)) : undefined;
  const set = <K extends keyof ReportInput>(key: K, value: ReportInput[K]) => onChange((d) => ({ ...d, [key]: value }));
  const setObservation = (area: Area, patch: Partial<ObservationInput>) =>
    onChange((d) => ({ ...d, observations: { ...d.observations, [area]: { ...d.observations[area], ...patch } } }));

  const ids: Record<(typeof FIELD_ORDER)[number], string> = {
    reportDate: `${uid}-day`,
    residents: `${uid}-residents`,
    constructionYear: `${uid}-cyear`,
    constructionChangeReason: `${uid}-reason`,
    roof: `${uid}-roof`,
    columns: `${uid}-columns`,
    foundations: `${uid}-foundations`,
    final: `${uid}-final`,
  };

  const focusFirst = (fields: FieldErrors) => {
    const first = FIELD_ORDER.find((f) => fields[f]);
    if (first) document.getElementById(ids[first])?.focus();
  };

  async function save() {
    if (!canSave) return;
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      setServerError(errors.form ?? null);
      focusFirst(errors);
      return;
    }
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
      if (body.fields) {
        setServerFields({ draft, fields: body.fields });
        setShowErrors(true);
        focusFirst(body.fields);
      }
      setServerError(`${REPORT_TEXT.saveFailed} ${body.error ?? ""}`.trim());
    } catch {
      setServerError(REPORT_TEXT.offline);
    } finally {
      setSaving(false);
    }
  }

  const label = saving ? REPORT_TEXT.saving : serverError ? REPORT_TEXT.saveAgain : REPORT_TEXT.save;
  useEffect(() => onSaveState({ disabled: !canSave, label, error: serverError }), [canSave, label, serverError, onSaveState]);
  // Leaving the form clears the tray's Save, so nothing stale shows when it opens again.
  useEffect(() => () => onSaveState(INITIAL_SAVE_STATE), [onSaveState]);

  const residentsUnknown = draft.residentsNotVerified;
  const hasYear = draft.constructionYear.trim() !== "";

  return (
    <form
      id={formId}
      className="space-y-7 pb-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      onKeyDown={(e) => {
        // Enter in a one-line field never saves by surprise; Save is a deliberate tap.
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
      }}
    >
      {/* Rating: the only required field, choosable at any time. */}
      <fieldset>
        <legend className="sr-only">{REPORT_TEXT.ratingLabel}</legend>
        <div className="grid grid-cols-3 gap-2">
          {COLOURS.map((colour) => {
            const selected = draft.colour === colour;
            return (
              <motion.label
                key={colour}
                whileTap={{ scale: 0.97 }}
                transition={springSnappy}
                className={[
                  "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-card border px-2 py-3 text-center transition-colors",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                  selected ? STATUS_SELECTED[colour] : "border-line bg-surface hover:bg-surface-soft",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name={`${uid}-rating`}
                  value={colour}
                  checked={selected}
                  onChange={() => set("colour", colour)}
                  className="sr-only"
                />
                <RatingArches colour={colour} large className={STATUS_TEXT[colour]} />
                <span className="text-body leading-tight font-medium text-ink">{COLOUR_CONTENT[colour].word}</span>
              </motion.label>
            );
          })}
        </div>
        <p className="mt-2.5 text-center text-micro text-muted">{REPORT_TEXT.ratingNote}</p>
      </fieldset>

      {/* Date, residents, construction date: compact rows. */}
      <div className="divide-y divide-line rounded-card border border-line bg-surface">
        <Row label={REPORT_TEXT.date} htmlFor={ids.reportDate} error={shown("reportDate")}>
          <input
            id={ids.reportDate}
            aria-label="Day"
            inputMode="numeric"
            maxLength={2}
            value={draft.day}
            onChange={(e) => set("day", e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!shown("reportDate")}
            className={`${compactInputClass} w-12 text-center`}
          />
          <select
            aria-label="Month"
            value={draft.month}
            onChange={(e) => set("month", e.target.value)}
            aria-invalid={!!shown("reportDate")}
            className={`${compactInputClass} w-[4.75rem]`}
          >
            {SHORT_MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>
                {m}
              </option>
            ))}
          </select>
          <input
            aria-label="Year"
            inputMode="numeric"
            maxLength={4}
            value={draft.year}
            onChange={(e) => set("year", e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!shown("reportDate")}
            className={`${compactInputClass} w-[4.25rem] text-center`}
          />
        </Row>

        <Row label={REPORT_TEXT.residents} htmlFor={ids.residents} error={shown("residents")}>
          <input
            id={ids.residents}
            inputMode="numeric"
            maxLength={4}
            disabled={residentsUnknown}
            value={residentsUnknown ? "" : draft.residents}
            onChange={(e) => set("residents", e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!shown("residents")}
            className={`${compactInputClass} w-16 text-center`}
          />
          <Toggle label={NOT_YET_VERIFIED} checked={residentsUnknown} onChange={(v) => set("residentsNotVerified", v)} />
        </Row>

        <Row label={REPORT_TEXT.built} htmlFor={ids.constructionYear} error={shown("constructionYear")}>
          <input
            id={ids.constructionYear}
            aria-label="Construction year"
            inputMode="numeric"
            placeholder="Year"
            maxLength={4}
            value={draft.constructionYear}
            onChange={(e) => set("constructionYear", e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!shown("constructionYear")}
            className={`${compactInputClass} w-[4.25rem] text-center`}
          />
          {hasYear && (
            <>
              <select
                aria-label="Construction month (optional)"
                value={draft.constructionMonth}
                onChange={(e) => set("constructionMonth", e.target.value)}
                className={`${compactInputClass} w-[5.5rem]`}
              >
                <option value="">{REPORT_TEXT.month}</option>
                {SHORT_MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>
                    {m}
                  </option>
                ))}
              </select>
              <Toggle
                label={REPORT_TEXT.approximate}
                checked={draft.constructionApproximate}
                onChange={(v) => set("constructionApproximate", v)}
              />
            </>
          )}
        </Row>

        {/* Changed from the previous report: the old value is kept; a reason is optional. */}
        {constructionChanged && previous && (
          <Row
            label={REPORT_TEXT.reason}
            htmlFor={ids.constructionChangeReason}
            hint={`${REPORT_TEXT.previously} ${formatConstructionDate(previous)}`}
            error={shown("constructionChangeReason")}
          >
            <input
              id={ids.constructionChangeReason}
              dir="auto"
              placeholder={REPORT_TEXT.reasonPlaceholder}
              maxLength={LIMITS.reasonMax}
              value={draft.constructionChangeReason}
              onChange={(e) => set("constructionChangeReason", e.target.value)}
              aria-invalid={!!shown("constructionChangeReason")}
              className={`${compactInputClass} w-full min-w-0 px-3`}
            />
          </Row>
        )}
      </div>

      {/* Observations: plain writing areas. */}
      <div className="space-y-5">
        {AREAS.map((area) => (
          <Observation
            key={area}
            id={ids[area]}
            area={area}
            value={draft.observations[area]}
            error={shown(area)}
            onChange={(patch) => setObservation(area, patch)}
          />
        ))}
      </div>

      <div className="border-t border-dashed border-line pt-4">
        {engineer ? (
          <ReportBy name={engineer.fullName} discipline={engineer.discipline} oeaNumber={engineer.oeaNumber} />
        ) : (
          <div className="motion-safe-only h-[18px] w-2/3 animate-pulse rounded-control bg-surface-soft" aria-label="Loading your account" />
        )}
      </div>
    </form>
  );
}

function Observation({
  id,
  area,
  value,
  error,
  onChange,
}: {
  id: string;
  area: Area;
  value: ObservationInput;
  error?: string;
  onChange: (patch: Partial<ObservationInput>) => void;
}) {
  const canSkip = areaAllowsNotInspected(area);
  const notInspected = canSkip && value.notInspected;

  return (
    <section>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <label htmlFor={id} className="text-body font-semibold text-ink">
          {AREA_LABEL[area]}
        </label>
        {canSkip && <Toggle label={NOT_INSPECTED} checked={value.notInspected} onChange={(v) => onChange({ notInspected: v })} />}
      </div>
      {notInspected ? (
        <input
          id={id}
          dir="auto"
          placeholder={REPORT_TEXT.notInspectedReason}
          maxLength={LIMITS.reasonMax}
          value={value.reason}
          onChange={(e) => onChange({ reason: e.target.value })}
          aria-invalid={!!error}
          className={`${writeClass} min-h-11`}
        />
      ) : (
        <AutoTextarea
          id={id}
          dir="auto"
          placeholder={REPORT_TEXT.write}
          maxLength={LIMITS.observationMax}
          value={value.text}
          onChange={(e) => onChange({ text: e.target.value })}
          aria-invalid={!!error}
        />
      )}
      <FieldError message={error} />
    </section>
  );
}
