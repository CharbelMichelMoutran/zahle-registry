"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MONTHS, NOT_YET_VERIFIED, REPORT_TEXT } from "@/lib/content";
import { formatConstructionDate } from "@/lib/format";
import {
  CLASSIFICATION,
  CONSTRUCTION,
  DAMAGE_ESTIMATES,
  DETAIL_LIMITS,
  FEATURES,
  METHODS,
  OCCUPANCY,
  PARTS,
  prefillDetails,
  RATING_LABEL,
  RATINGS,
  RECOMMENDED_ACTIONS,
  SECTIONS,
  type Details,
  type PartEntry,
  type PartId,
  type Rating,
} from "@/lib/engineer-report";
import {
  COLOURS,
  LIMITS,
  reportConstructionDate,
  todayParts,
  validateReport,
  type Colour,
  type FieldErrors,
  type ObservationInput,
  type Report,
  type ReportInput,
} from "@/lib/report";
import type { Engineer } from "@/lib/account";
import { apiFetch } from "@/lib/client-fetch";
import { shrinkPhoto } from "../../emt/assessment/draft";
import { DOT_CLASS } from "../../report/ColourBadge";
import { ReportBy } from "./ReportBy";
import { AutoTextarea, compactInputClass, FieldError, Row, Toggle } from "../../report/ui";

/**
 * A new draft. Construction date and the building's identification and
 * description come from the last report (`latest` for the date, `previous`
 * for the details, which an EMT simple report does not have).
 */
export function newDraft(latest: Report | null, previous?: Details | null): ReportInput {
  const [y, m, d] = todayParts();
  const empty = (): ObservationInput => ({ text: "", notInspected: false, reason: "" });
  return {
    clientRequestId: crypto.randomUUID(),
    basedOnReportId: latest?.id ?? null,
    day: String(d),
    month: String(m),
    year: String(y),
    residents: latest && !latest.residents_not_verified && latest.residents_count !== null ? String(latest.residents_count) : "",
    residentsNotVerified: false,
    ...prefillConstruction(latest),
    constructionChangeReason: "",
    observations: { roof: empty(), columns: empty(), foundations: empty(), final: empty() },
    colour: null,
    details: prefillDetails(previous),
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

const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));

/** Claude's answer for one part or for the remarks: shown greyed, applied only on "Use". */
type PartSuggestion = { condition: Exclude<Rating, "unseen"> | null; note: string };
type RemarksSuggestion = { remarks: string; actions: string[] };
type Ask<T> = { state: "asking" } | { state: "ready"; value: T } | { state: "failed"; message: string };

const CLAUDE_FAILED: Record<string, string> = {
  off: "Claude is not connected.",
  busy: "Claude is busy. Try again in a few minutes.",
  empty: "Fill in some of the report first.",
  failed: "Claude could not help this time.",
};

/** Joins a suggestion to what the engineer already wrote, never replacing it. */
const appendText = (current: string, add: string) => (current.trim() ? `${current.trim()}\n\n${add}` : add);

/**
 * The engineer report (owner, 23 Nov 2026, plan.md item 27): one page in
 * numbered sections, like a paper engineering form. Only the overall
 * classification is required; everything else is optional, in any order.
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
  const [claudeOn, setClaudeOn] = useState(false);
  const [partAsks, setPartAsks] = useState<Partial<Record<string, Ask<PartSuggestion>>>>({});
  const [remarksAsk, setRemarksAsk] = useState<Ask<RemarksSuggestion> | null>(null);

  // Claude's links show only when it is connected (an API key is set).
  useEffect(() => {
    let live = true;
    apiFetch("/api/engineer/claude")
      .then((r) => r.json())
      .then((b) => live && setClaudeOn(b.on === true))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const details = draft.details ?? prefillDetails(null);
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
  const setDetails = (update: (d: Details) => Details) =>
    onChange((d) => ({ ...d, details: update(d.details ?? prefillDetails(null)) }));
  const setPart = (id: PartId, patch: Partial<PartEntry>) =>
    setDetails((d) => ({ ...d, parts: { ...d.parts, [id]: { ...d.parts[id], ...patch } } }));
  const remarks = draft.observations.final.text;
  const setRemarks = (text: string) =>
    onChange((d) => ({ ...d, observations: { ...d.observations, final: { ...d.observations.final, text } } }));

  const fieldId = (field: string) => `${uid}-${field.replace(/\W/g, "-")}`;
  const focusFirst = (fields: FieldErrors) => {
    const first = Object.keys(fields)[0];
    if (first) document.getElementById(fieldId(first))?.focus();
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

  async function askClaude<T>(body: object): Promise<Ask<T>> {
    try {
      const res = await apiFetch("/api/engineer/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await res.json().catch(() => ({}));
      if (b.status === "ok") return { state: "ready", value: b.result as T };
      return { state: "failed", message: CLAUDE_FAILED[b.status] ?? CLAUDE_FAILED.failed };
    } catch {
      return { state: "failed", message: REPORT_TEXT.offline.split(".")[0] + "." };
    }
  }

  const readPhoto = async (part: PartId, path: string) => {
    setPartAsks((a) => ({ ...a, [path]: { state: "asking" } }));
    const result = await askClaude<PartSuggestion>({ kind: "photo", part, path, note: details.parts[part].note });
    setPartAsks((a) => ({ ...a, [path]: result }));
  };

  const draftRemarks = async () => {
    setRemarksAsk({ state: "asking" });
    setRemarksAsk(await askClaude<RemarksSuggestion>({ kind: "remarks", details, remarks, colour: draft.colour }));
  };

  const residentsUnknown = draft.residentsNotVerified;
  const hasYear = draft.constructionYear.trim() !== "";
  const n = (i: number) => ({ n: i + 1, title: SECTIONS[i] });

  return (
    <form
      id={formId}
      className="space-y-9 pb-6"
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
      {/* 1. Identification */}
      <Section {...n(0)}>
        <Panel>
          <Row label="Report no.">
            <span className="py-2.5 text-body text-muted">Assigned on save</span>
          </Row>
          <Row label={REPORT_TEXT.date} htmlFor={fieldId("reportDate")} error={shown("reportDate")}>
            <input
              id={fieldId("reportDate")}
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
          <Row label="Location">
            <span className="py-2.5 text-body text-muted">GPS recorded from the map</span>
          </Row>
          {(
            [
              ["buildingName", "Building name"],
              ["street", "Street"],
              ["landmark", "Landmark"],
              ["plot", "Plot no."],
            ] as const
          ).map(([key, text]) => (
            <Row key={key} label={text} htmlFor={fieldId(`id.${key}`)} error={shown(`id.${key}`)}>
              <input
                id={fieldId(`id.${key}`)}
                dir="auto"
                maxLength={DETAIL_LIMITS.short}
                value={details.identification[key]}
                onChange={(e) => {
                  const value = e.target.value;
                  setDetails((d) => ({ ...d, identification: { ...d.identification, [key]: value } }));
                }}
                aria-invalid={!!shown(`id.${key}`)}
                className={`${compactInputClass} w-full min-w-0 px-3`}
              />
            </Row>
          ))}
        </Panel>
        <div className="mt-3">
          <Photos
            label="Front of building"
            buildingId={buildingId}
            paths={details.identification.coverPhoto ? [details.identification.coverPhoto] : []}
            max={1}
            onChange={(p) => setDetails((d) => ({ ...d, identification: { ...d.identification, coverPhoto: p[0] ?? null } }))}
          />
        </div>
      </Section>

      {/* 2. Building description */}
      <Section {...n(1)}>
        <Panel>
          <Row label={REPORT_TEXT.built} htmlFor={fieldId("constructionYear")} error={shown("constructionYear")}>
            <input
              id={fieldId("constructionYear")}
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
              htmlFor={fieldId("constructionChangeReason")}
              hint={`${REPORT_TEXT.previously} ${formatConstructionDate(previous)}`}
              error={shown("constructionChangeReason")}
            >
              <input
                id={fieldId("constructionChangeReason")}
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
          {(
            [
              ["floors", "Floors"],
              ["basements", "Basements"],
              ["addedOnRoof", "Added on roof"],
              ["units", "Units"],
            ] as const
          ).map(([key, text]) => (
            <Row key={key} label={text} htmlFor={fieldId(`desc.${key}`)}>
              <input
                id={fieldId(`desc.${key}`)}
                inputMode="numeric"
                maxLength={DETAIL_LIMITS.number}
                value={details.description[key]}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setDetails((d) => ({ ...d, description: { ...d.description, [key]: value } }));
                }}
                className={`${compactInputClass} w-16 text-center`}
              />
            </Row>
          ))}
          <Row label={REPORT_TEXT.residents} htmlFor={fieldId("residents")} error={shown("residents")}>
            <input
              id={fieldId("residents")}
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
          <Row label="Structure" htmlFor={fieldId("desc.structure")}>
            <select
              id={fieldId("desc.structure")}
              value={details.description.structure ?? ""}
              onChange={(e) => {
                const value = e.target.value || null;
                setDetails((d) => ({ ...d, description: { ...d.description, structure: value } }));
              }}
              className={`${compactInputClass} w-full min-w-0`}
            >
              <option value="">—</option>
              {CONSTRUCTION.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Row>
        </Panel>
        <Picks
          label="Use"
          options={OCCUPANCY}
          value={details.description.use}
          onChange={(use) => setDetails((d) => ({ ...d, description: { ...d.description, use } }))}
        />
        <Picks
          label="Features"
          options={FEATURES}
          value={details.description.features}
          onChange={(features) => setDetails((d) => ({ ...d, description: { ...d.description, features } }))}
        />
      </Section>

      {/* 3. Inspection method (Eurocode 8-3 knowledge level, in plain words) */}
      <Section {...n(2)}>
        <Segmented
          label={SECTIONS[2]}
          options={METHODS.map((m) => ({ value: m.id, label: m.label }))}
          value={details.method}
          onChange={(method) => setDetails((d) => ({ ...d, method }))}
        />
      </Section>

      {/* 4. Condition of structural elements */}
      <Section {...n(3)} note="Minor / none · Moderate · Severe · Not seen">
        <div className="divide-y divide-line rounded-control border border-line bg-surface">
          {PARTS.map((part) => (
            <PartRow
              key={part.id}
              id={fieldId(`part.${part.id}`)}
              label={part.label}
              hint={"hint" in part ? part.hint : undefined}
              entry={details.parts[part.id]}
              error={shown(`part.${part.id}`)}
              buildingId={buildingId}
              claudeOn={claudeOn}
              asks={partAsks}
              onChange={(patch) => setPart(part.id, patch)}
              onRead={(path) => readPhoto(part.id, path)}
              onUse={(path, s) => {
                const entry = details.parts[part.id];
                setPart(part.id, { condition: s.condition ?? entry.condition, note: appendText(entry.note, s.note) });
                setPartAsks((a) => ({ ...a, [path]: undefined }));
              }}
              onDismiss={(path) => setPartAsks((a) => ({ ...a, [path]: undefined }))}
            />
          ))}
        </div>
      </Section>

      {/* 5. Observations and remarks */}
      <Section
        {...n(4)}
        action={
          claudeOn && (
            <ClaudeLink busy={remarksAsk?.state === "asking"} onClick={draftRemarks}>
              Draft remarks
            </ClaudeLink>
          )
        }
      >
        <AutoTextarea
          id={fieldId("final")}
          dir="auto"
          aria-label={SECTIONS[4]}
          maxLength={LIMITS.observationMax}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          aria-invalid={!!shown("final")}
          className="min-h-28"
        />
        <FieldError message={shown("final")} />
        {remarksAsk?.state === "failed" && <p className="mt-2 text-micro text-muted">{remarksAsk.message}</p>}
        {remarksAsk?.state === "ready" && (
          <Suggestion
            onUse={() => {
              setRemarks(appendText(remarks, remarksAsk.value.remarks));
              if (remarksAsk.value.actions.length > 0) {
                setDetails((d) => ({
                  ...d,
                  actions: { ...d.actions, picks: [...new Set([...d.actions.picks, ...remarksAsk.value.actions])] },
                }));
              }
              setRemarksAsk(null);
            }}
            onDismiss={() => setRemarksAsk(null)}
          >
            <p dir="auto" className="whitespace-pre-wrap">
              {remarksAsk.value.remarks}
            </p>
            {remarksAsk.value.actions.length > 0 && (
              <p className="mt-1.5">Recommended actions: {remarksAsk.value.actions.join(", ")}</p>
            )}
          </Suggestion>
        )}
      </Section>

      {/* 6. Overall classification: the only required field */}
      <Section {...n(5)} note="Required · Used for triage after an earthquake">
        <fieldset>
          <legend className="sr-only">{SECTIONS[5]}</legend>
          <div className="grid grid-cols-3 overflow-hidden rounded-control border border-line bg-surface">
            {COLOURS.map((colour) => {
              const selected = draft.colour === colour;
              return (
                <label
                  key={colour}
                  className={[
                    "flex min-h-14 cursor-pointer items-center justify-center gap-2 border-l border-line px-2 text-center text-body font-medium first:border-l-0",
                    "transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-accent",
                    selected ? CLASS_SELECTED[colour] : "text-ink hover:bg-surface-soft",
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
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${DOT_CLASS[colour]}`} aria-hidden />
                  {CLASSIFICATION[colour]}
                </label>
              );
            })}
          </div>
          <FieldError message={shown("colour")} />
        </fieldset>
        <div className="mt-4">
          <Segmented
            label="Estimated damage"
            showLabel
            options={DAMAGE_ESTIMATES.map((d) => ({ value: d, label: d }))}
            value={details.damage}
            onChange={(damage) => setDetails((d) => ({ ...d, damage }))}
          />
        </div>
      </Section>

      {/* 7. Recommended actions */}
      <Section {...n(6)}>
        <Picks
          label={SECTIONS[6]}
          hideLabel
          options={RECOMMENDED_ACTIONS}
          value={details.actions.picks}
          onChange={(picks) => setDetails((d) => ({ ...d, actions: { ...d.actions, picks } }))}
        />
        <div className="mt-3 space-y-3">
          <Panel>
            <Row label="Inspect again by" htmlFor={fieldId("actions.inspectBy")}>
              <input
                id={fieldId("actions.inspectBy")}
                type="date"
                value={details.actions.inspectBy}
                onChange={(e) => {
                  const inspectBy = e.target.value;
                  setDetails((d) => ({ ...d, actions: { ...d.actions, inspectBy } }));
                }}
                className={`${compactInputClass} px-3`}
              />
            </Row>
          </Panel>
          <AutoTextarea
            id={fieldId("actions.note")}
            dir="auto"
            aria-label="Note on recommended actions"
            placeholder="Note"
            maxLength={DETAIL_LIMITS.note}
            value={details.actions.note}
            onChange={(e) => {
              const note = e.target.value;
              setDetails((d) => ({ ...d, actions: { ...d.actions, note } }));
            }}
            aria-invalid={!!shown("actions.note")}
          />
          <FieldError message={shown("actions.note")} />
        </div>
      </Section>

      {/* 8. Certification: from the account, locked */}
      <Section {...n(7)}>
        {engineer ? (
          <ReportBy
            name={engineer.fullName}
            discipline={engineer.discipline}
            oeaNumber={engineer.oeaNumber}
            contact={engineer.contact}
          />
        ) : (
          <div className="motion-safe-only h-[18px] w-2/3 animate-pulse rounded-control bg-surface-soft" aria-label="Loading your account" />
        )}
      </Section>
    </form>
  );
}

const CLASS_SELECTED: Record<Colour, string> = {
  green: "bg-vine/12 text-ink shadow-[inset_0_-2px_0_var(--color-vine)]",
  yellow: "bg-apricot/15 text-ink shadow-[inset_0_-2px_0_var(--color-apricot)]",
  red: "bg-rooftile/10 text-ink shadow-[inset_0_-2px_0_var(--color-rooftile)]",
};

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

/** A numbered section, like a paper engineering form. */
function Section({
  n,
  title,
  note,
  action,
  children,
}: {
  n: number;
  title: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between gap-3 border-b border-ink/80 pb-1.5">
        <h3 className="text-micro font-semibold tracking-[0.06em] text-ink uppercase">
          <span className="tabular mr-2 text-muted">{n}.</span>
          {title}
        </h3>
        {action}
      </div>
      {note && <p className="-mt-1 mb-2.5 text-micro text-muted">{note}</p>}
      {children}
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-line rounded-control border border-line bg-surface">{children}</div>;
}

/** One choice from a few, tapped again to clear. */
function Segmented<T extends string>({
  label,
  showLabel = false,
  options,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  showLabel?: boolean;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  compact?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      {showLabel && <p className="mb-1.5 text-micro font-medium text-muted">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? null : o.value)}
              className={[
                "rounded-full border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                compact ? "min-h-9 px-3 text-micro" : "min-h-11 px-4 text-body",
                selected ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink hover:border-line-strong",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Any number of choices from a list. */
function Picks({
  label,
  hideLabel = false,
  options,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div role="group" aria-label={label} className={hideLabel ? "" : "mt-3"}>
      {!hideLabel && <p className="mb-1.5 text-micro font-medium text-muted">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
              className={[
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-micro font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                on ? "border-accent bg-accent-soft text-ink" : "border-line bg-surface text-muted hover:text-ink",
              ].join(" ")}
            >
              <span
                aria-hidden
                className={`grid h-3.5 w-3.5 place-items-center rounded-[3px] border ${on ? "border-accent bg-accent text-surface" : "border-line-strong"}`}
              >
                {on && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2.5 6.2 5 8.5l4.5-5" />
                  </svg>
                )}
              </span>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** One row of the condition table: the part, its condition, and (opened) a note and photos. */
function PartRow({
  id,
  label,
  hint,
  entry,
  error,
  buildingId,
  claudeOn,
  asks,
  onChange,
  onRead,
  onUse,
  onDismiss,
}: {
  id: string;
  label: string;
  hint?: string;
  entry: PartEntry;
  error?: string;
  buildingId: string;
  claudeOn: boolean;
  asks: Partial<Record<string, Ask<PartSuggestion>>>;
  onChange: (patch: Partial<PartEntry>) => void;
  onRead: (path: string) => void;
  onUse: (path: string, s: PartSuggestion) => void;
  onDismiss: (path: string) => void;
}) {
  const filled = entry.note.trim() !== "" || entry.photos.length > 0;
  const [open, setOpen] = useState(filled);
  return (
    <div className="px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex min-h-9 min-w-0 items-center gap-1.5 text-left focus-visible:outline-2 focus-visible:outline-accent"
        >
          <svg viewBox="0 0 12 12" className={`h-3 w-3 shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`} fill="currentColor" aria-hidden>
            <path d="M4 2.5 8 6l-4 3.5z" />
          </svg>
          <span className="text-body font-medium text-ink">{label}</span>
          {!open && filled && (
            <span className="text-micro text-muted">
              · {entry.photos.length > 0 ? `${entry.photos.length} photo${entry.photos.length > 1 ? "s" : ""}` : "note"}
            </span>
          )}
        </button>
        <Segmented
          label={`${label} condition`}
          compact
          options={RATINGS.map((r) => ({ value: r, label: RATING_LABEL[r] }))}
          value={entry.condition}
          onChange={(condition) => onChange({ condition })}
        />
      </div>
      {open && (
        <div className="mt-2.5 space-y-2.5 pl-[18px]">
          {hint && <p className="text-micro text-muted">{hint[0].toUpperCase() + hint.slice(1)}</p>}
          <AutoTextarea
            id={id}
            dir="auto"
            aria-label={`${label} note`}
            placeholder="Note"
            maxLength={DETAIL_LIMITS.note}
            value={entry.note}
            onChange={(e) => onChange({ note: e.target.value })}
            aria-invalid={!!error}
          />
          <FieldError message={error} />
          <Photos
            label="Photos"
            buildingId={buildingId}
            paths={entry.photos}
            max={DETAIL_LIMITS.photosPerPart}
            onChange={(photos) => onChange({ photos })}
            readable={claudeOn ? { asks, onRead } : undefined}
          />
          {entry.photos.map((path) => {
            const ask = asks[path];
            if (ask?.state === "failed") return <p key={path} className="text-micro text-muted">{ask.message}</p>;
            if (ask?.state !== "ready") return null;
            return (
              <Suggestion key={path} onUse={() => onUse(path, ask.value)} onDismiss={() => onDismiss(path)}>
                {ask.value.condition && <p className="font-medium">{RATING_LABEL[ask.value.condition]}</p>}
                <p dir="auto">{ask.value.note}</p>
              </Suggestion>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Thumbnails, an add button, and (when Claude is on) "Read photo" under each. */
function Photos({
  label,
  buildingId,
  paths,
  max,
  onChange,
  readable,
}: {
  label: string;
  buildingId: string;
  paths: string[];
  max: number;
  onChange: (paths: string[]) => void;
  readable?: { asks: Partial<Record<string, Ask<PartSuggestion>>>; onRead: (path: string) => void };
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The latest list, so photos added in one pick all land even as the parent re-renders.
  const latest = useRef(paths);
  useEffect(() => {
    latest.current = paths;
  }, [paths]);

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    for (const file of [...files].slice(0, max - latest.current.length)) {
      try {
        const image = await shrinkPhoto(file);
        const res = await apiFetch("/api/engineer/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buildingId, image }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || typeof body.path !== "string") {
          setError(body.error ?? "Could not add the photo. Please try again.");
          break;
        }
        onChange([...latest.current, body.path]);
        latest.current = [...latest.current, body.path];
      } catch {
        setError("Could not read this photo. Try another.");
        break;
      }
    }
    setUploading(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <div className="flex flex-wrap items-start gap-2">
        {paths.map((path) => {
          const ask = readable?.asks[path];
          return (
            <figure key={path} className="w-24">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, short-lived links from our own server */}
                <img
                  src={`/api/engineer/photo?path=${encodeURIComponent(path)}`}
                  alt=""
                  className="h-24 w-24 rounded-control border border-line bg-surface-soft object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => onChange(paths.filter((p) => p !== path))}
                  className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-surface hover:bg-ink focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="m3 3 6 6M9 3 3 9" />
                  </svg>
                </button>
              </div>
              {readable && (
                <ClaudeLink busy={ask?.state === "asking"} onClick={() => readable.onRead(path)} className="mt-1">
                  Read photo
                </ClaudeLink>
              )}
            </figure>
          );
        })}
        {paths.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={uploading}
            className="grid h-24 w-24 place-items-center rounded-control border border-dashed border-line-strong bg-surface text-center text-micro font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
          >
            {uploading ? "Adding…" : `+ ${label}`}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={max > 1}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => add(e.target.files)}
      />
      <FieldError message={error ?? undefined} />
    </div>
  );
}

/** Claude lends a hand only when asked: a quiet text link. */
function ClaudeLink({
  busy,
  onClick,
  className = "",
  children,
}: {
  busy: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`text-micro font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent disabled:text-muted disabled:no-underline ${className}`}
    >
      {busy ? "Claude is reading…" : children}
    </button>
  );
}

/** Claude's suggestion, greyed: nothing changes until the engineer taps "Use". */
function Suggestion({ onUse, onDismiss, children }: { onUse: () => void; onDismiss: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded-control border border-dashed border-line-strong bg-surface-soft px-3 py-2.5 text-body text-muted">
      <p className="mb-1 text-micro font-semibold tracking-[0.06em] uppercase">Claude suggests</p>
      {children}
      <div className="mt-2 flex gap-4">
        <button type="button" onClick={onUse} className="text-micro font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent">
          Use
        </button>
        <button type="button" onClick={onDismiss} className="text-micro font-medium text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent">
          Dismiss
        </button>
      </div>
    </div>
  );
}

