"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import {
  ACTIONS,
  AGES,
  cleanConfidence,
  confidenceText,
  CONSTRUCTION,
  DAMAGE_ESTIMATES,
  EMERGENCY_NUMBERS,
  emptyAnswer,
  FEATURES,
  FOOTPRINTS,
  GOVERNORATES,
  GROUP_LABEL,
  INSIDE_CHECKS,
  isDowngrade,
  itemsFor,
  OCCUPANCY,
  ORGANIZATIONS,
  PHOTO_PROMPTS,
  POSTING_LABEL,
  POSTING_MEANING,
  POSTINGS,
  RATING_LABEL,
  RATINGS,
  SCENE_CHECKS,
  STEP_LABEL,
  STEPS,
  STOP_ORDER,
  type Assessment,
  type CheckId,
  type Draft,
  type Facts,
  type Item,
  type Rating,
  type Step,
  type Walk,
} from "@/lib/atc20";
import { apiFetch } from "@/lib/client-fetch";
import { fadeFast } from "@/lib/motion";
import type { Report } from "@/lib/report";
import { photoUrl, PostingBadge, SketchView } from "../../report/AssessmentParts";
import { AutoTextarea, inputClass } from "../../report/ui";
import { Button, Spinner } from "../../ui/Button";
import { applyClaude, clearDraft, knownSoFar, loadDraft, newDraft, shrinkPhoto, storeDraft, type PhotoClaude } from "./draft";

/**
 * The EMT safety assessment (plan.md item 25): one step at a time, outside
 * before inside, as on the owner's form. Claude fills in what it can from the
 * map, the record and each photo; the EMT changes anything with one tap, is
 * never asked why, and is never blocked except by a danger, which stops the
 * assessment with an evacuation order (golden rule, owner 22 Nov 2026).
 */
export default function AssessmentFlow({
  buildingId,
  inspector,
  latestReport,
  latestAssessment,
  onSaved,
}: {
  buildingId: string;
  inspector: string;
  latestReport: Report | null;
  latestAssessment: Assessment | null;
  onSaved: (a: Assessment) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    // Read the phone's saved draft after mount (localStorage is browser-only).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(loadDraft(buildingId));
  }, [buildingId]);
  useEffect(() => {
    if (draft) storeDraft(draft);
  }, [draft]);

  const update = (change: (d: Draft) => Draft) => setDraft((d) => (d ? change(d) : d));
  const go = (step: Step) => {
    update((d) => ({ ...d, step }));
    document.getElementById("assessment-top")?.scrollIntoView({ block: "start" });
  };

  if (!draft) {
    return (
      <StartCard
        inspector={inspector}
        onStart={() => setDraft({ ...newDraft(buildingId, inspector, latestReport, latestAssessment), step: "start" })}
      />
    );
  }

  if (draft.stopped) {
    return <StopScreen draft={draft} onUndo={() => update(undoStop)} onSaved={onSaved} />;
  }

  const index = STEPS.indexOf(draft.step);
  const next = () => go(STEPS[Math.min(index + 1, STEPS.length - 1)]);
  const back = () => go(STEPS[Math.max(index - 1, 0)]);
  const stop = (check: string) => update((d) => ({ ...d, stopped: { check, at: new Date().toISOString() } }));

  return (
    <div className="pb-28">
      <div id="assessment-top" className="scroll-mt-4" />
      <Progress step={draft.step} onGo={go} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={draft.step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fadeFast} className="space-y-5 pt-4">
          {draft.step === "start" && <StartStep draft={draft} update={update} />}
          {draft.step === "scene" && (
            <Checks
              title="Scene safety"
              lead="From a distance, upwind. Answer from what you can smell, hear and see."
              checks={SCENE_CHECKS}
              draft={draft}
              update={update}
              onStop={stop}
            />
          )}
          {draft.step === "outside" && <Walkthrough walk="outside" draft={draft} update={update} />}
          {draft.step === "building" && <BuildingStep draft={draft} update={update} />}
          {draft.step === "gate" && <GateStep draft={draft} update={update} onStop={stop} onEnter={next} />}
          {draft.step === "inside" && (
            <>
              <Checks
                title="Before going further inside"
                lead="Pairs, helmet, gloves, torch. One person stays outside with a phone. No elevator."
                checks={INSIDE_CHECKS}
                draft={draft}
                update={update}
                onStop={stop}
              />
              <Walkthrough walk="inside" draft={draft} update={update} />
            </>
          )}
          {draft.step === "posting" && <PostingStep draft={draft} update={update} />}
          {draft.step === "actions" && <ActionsStep draft={draft} update={update} />}
          {draft.step === "review" && (
            <ReviewStep
              draft={draft}
              onSaved={(a) => {
                clearDraft(buildingId);
                onSaved(a);
              }}
              onGo={go}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {draft.step !== "review" && (
        <div className="fixed inset-x-0 bottom-0 z-[1150] border-t border-line bg-surface/95 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2">
            {index > 0 && (
              <Button variant="secondary" onClick={back} className="flex-1">
                Back
              </Button>
            )}
            <Button onClick={next} className="flex-[2]">
              {draft.step === "start" ? "Start at the scene" : `Next: ${STEP_LABEL[STEPS[index + 1]]}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const undoStop = (d: Draft): Draft => {
  const checks = { ...d.checks };
  for (const [k, v] of Object.entries(checks)) if (v === "yes" && d.stopped?.check.startsWith(k)) delete checks[k as CheckId];
  return { ...d, checks, gate: d.stopped?.check.startsWith("Gate") ? null : d.gate, stopped: null };
};

// ---------------------------------------------------------------------------
// Progress and small controls
// ---------------------------------------------------------------------------

function Progress({ step, onGo }: { step: Step; onGo: (s: Step) => void }) {
  const index = STEPS.indexOf(step);
  return (
    <nav aria-label="Assessment steps" className="space-y-2">
      <p className="text-micro text-muted">
        Step {index + 1} of {STEPS.length} · <span className="font-medium text-ink">{STEP_LABEL[step]}</span>
      </p>
      <ol className="flex gap-1">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <button
              type="button"
              onClick={() => onGo(s)}
              aria-label={STEP_LABEL[s]}
              aria-current={s === step ? "step" : undefined}
              className={`block h-1.5 w-full rounded-full transition-colors ${i <= index ? "bg-accent" : "bg-line"}`}
            />
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Heading({ title, lead }: { title: string; lead?: string }) {
  return (
    <div>
      <h2 className="font-serif text-[26px]/[30px] text-ink">{title}</h2>
      {lead && <p className="mt-1 text-body text-muted">{lead}</p>}
    </div>
  );
}

/** Claude's voice: a short line with a small mark, never a chat. */
function ClaudeLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-control bg-accent-soft px-3 py-2 text-body text-ink">
      <span className="mt-0.5 shrink-0 text-micro font-semibold text-accent">Claude</span>
      <span>{children}</span>
    </p>
  );
}

function Choice<T extends string>({
  options,
  value,
  onChange,
  labels,
  multi = false,
}: {
  options: readonly T[];
  value: T | T[] | null;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
  multi?: boolean;
}) {
  const on = (o: T) => (Array.isArray(value) ? value.includes(o) : value === o);
  return (
    <div className="flex flex-wrap gap-1.5" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role={multi ? "checkbox" : "radio"}
          aria-checked={on(o)}
          onClick={() => onChange(o)}
          className={`min-h-11 rounded-control border px-3 text-body transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
            on(o) ? "border-accent bg-accent-soft font-medium text-ink" : "border-line bg-surface text-ink hover:bg-surface-soft"
          }`}
        >
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Field({
  label,
  hint,
  claude,
  children,
}: {
  label: string;
  hint?: string;
  claude?: boolean;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex flex-wrap items-baseline gap-x-2 text-body font-medium text-ink">
        {label}
        {claude && <span className="text-micro font-medium text-accent">Filled in for you</span>}
        {hint && <span className="text-micro font-normal text-muted">{hint}</span>}
      </label>
      {children(id)}
    </div>
  );
}

function TextField({
  label,
  hint,
  draft,
  update,
  k,
  inputMode,
}: {
  label: string;
  hint?: string;
  draft: Draft;
  update: Update;
  k: keyof Facts;
  inputMode?: "numeric" | "decimal" | "tel" | "text";
}) {
  return (
    <Field label={label} hint={hint} claude={draft.claudeFacts.includes(k)}>
      {(id) => (
        <input
          id={id}
          dir="auto"
          inputMode={inputMode}
          value={draft.facts[k] as string}
          maxLength={200}
          onChange={(e) => update((d) => setFact(d, k, e.target.value))}
          className={inputClass}
        />
      )}
    </Field>
  );
}

type Update = (change: (d: Draft) => Draft) => void;

/** The EMT changed a fact: it is theirs now, and Claude leaves it alone. */
const setFact = (d: Draft, k: keyof Facts, v: Facts[keyof Facts]): Draft => ({
  ...d,
  facts: { ...d.facts, [k]: v },
  claudeFacts: d.claudeFacts.filter((x) => x !== k),
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

function StartCard({ inspector, onStart }: { inspector: string; onStart: () => void }) {
  return (
    <div className="space-y-5 py-2">
      <Heading
        title="Safety assessment"
        lead="An ATC-20 style check of whether people can use this building. Outside first, then inside only if it is safe. About 15 minutes."
      />
      <ClaudeLine>When you start, I will fill in what the map and the record already know, then ask you for one photo at a time.</ClaudeLine>
      <p className="text-micro text-muted">Inspector: {inspector}</p>
      <Button onClick={onStart} className="w-full">
        Start
      </Button>
    </div>
  );
}

function StartStep({ draft, update }: { draft: Draft; update: Update }) {
  return (
    <>
      <Heading title="Before you start" lead="Check what Claude filled in. Change anything that is wrong." />
      <ClaudeLine>
        I filled in the location from the map
        {draft.visit === "re-inspection" ? " and the building's facts from its last visit" : ""}. Ask a resident for the
        street and a contact if you can.
      </ClaudeLine>
      {draft.visit === "re-inspection" && (
        <div className="space-y-1 rounded-card border border-line px-3 py-2.5 text-body">
          <p className="font-medium text-ink">Re-inspection</p>
          <p className="text-muted">
            Last visit {draft.previous.date || "date unknown"}
            {draft.previous.inspector && ` by ${draft.previous.inspector}`}
            {draft.previous.posting && ` · posted ${POSTING_LABEL[draft.previous.posting]}`}
          </p>
        </div>
      )}
      <Field label="Organization">
        {() => (
          <Choice
            options={ORGANIZATIONS}
            value={draft.organization as (typeof ORGANIZATIONS)[number]}
            onChange={(v) => update((d) => ({ ...d, organization: v }))}
          />
        )}
      </Field>
      <Field label="Team" hint="optional">
        {(id) => (
          <input id={id} dir="auto" value={draft.team} maxLength={100} onChange={(e) => update((d) => ({ ...d, team: e.target.value }))} className={inputClass} />
        )}
      </Field>
      <Field label="Governorate" claude={draft.claudeFacts.includes("governorate")}>
        {() => <Choice options={GOVERNORATES} value={draft.facts.governorate as (typeof GOVERNORATES)[number]} onChange={(v) => update((d) => setFact(d, "governorate", v))} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="District (caza)" k="district" draft={draft} update={update} />
        <TextField label="Municipality" k="municipality" draft={draft} update={update} />
      </div>
      <TextField label="Neighbourhood / street" k="street" draft={draft} update={update} />
      <TextField label="Building name or number" k="buildingName" draft={draft} update={update} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="GPS latitude" k="lat" inputMode="decimal" draft={draft} update={update} />
        <TextField label="GPS longitude" k="lng" inputMode="decimal" draft={draft} update={update} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Contact name" hint="ask a resident" k="contactName" draft={draft} update={update} />
        <TextField label="Phone +961" k="contactPhone" inputMode="tel" draft={draft} update={update} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Danger checks: any Yes stops the assessment
// ---------------------------------------------------------------------------

function Checks({
  title,
  lead,
  checks,
  draft,
  update,
  onStop,
}: {
  title: string;
  lead: string;
  checks: readonly { id: CheckId; label: string }[];
  draft: Draft;
  update: Update;
  onStop: (check: string) => void;
}) {
  return (
    <section className="space-y-3">
      <Heading title={title} lead={lead} />
      <ClaudeLine>If any answer is Yes, I will stop the assessment and you order an evacuation.</ClaudeLine>
      <ul className="divide-y divide-line rounded-card border border-line">
        {checks.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
            <span className="text-body text-ink">{c.label}</span>
            <Choice
              options={["no", "yes"] as const}
              labels={{ no: "No", yes: "Yes" }}
              value={draft.checks[c.id] ?? null}
              onChange={(v) => {
                update((d) => ({ ...d, checks: { ...d.checks, [c.id]: v } }));
                if (v === "yes") onStop(`${c.id}: ${c.label}`);
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function StopScreen({ draft, onUndo, onSaved }: { draft: Draft; onUndo: () => void; onSaved: (a: Assessment) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    setSaving(true);
    setError(null);
    const result = await saveAssessment({ ...draft, posting: "unsafe" });
    setSaving(false);
    if ("error" in result) return setError(result.error);
    clearDraft(draft.buildingId);
    onSaved(result.assessment);
  }
  return (
    <div role="alert" className="space-y-5 py-2">
      <div className="space-y-2 rounded-card bg-rooftile px-4 py-5 text-white">
        <p className="text-[28px]/[32px] font-semibold">{STOP_ORDER}</p>
        <p className="text-body">Danger: {draft.stopped!.check.replace(/^[A-Z]\d+: /, "")}</p>
      </div>
      <ul className="space-y-1 rounded-card border border-line px-4 py-3">
        {EMERGENCY_NUMBERS.map((n) => (
          <li key={n.number} className="flex gap-3 text-lead">
            <a href={`tel:${n.number}`} className="tabular w-12 font-semibold text-accent underline underline-offset-2">
              {n.number}
            </a>
            <span className="text-ink">{n.name}</span>
          </li>
        ))}
      </ul>
      <p className="text-body text-muted">The building will be posted Unsafe and turn red on both maps.</p>
      {error && <p className="text-body text-attention">{error}</p>}
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save as Unsafe and close"}
      </Button>
      <button type="button" onClick={onUndo} className="mx-auto block min-h-11 px-2 text-body text-accent underline underline-offset-2">
        I tapped the wrong answer
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Photo walks: Claude asks for one photo at a time and fills the items
// ---------------------------------------------------------------------------

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "note"; text: string };

const CLAUDE_NOTES: Record<string, string> = {
  off: "Claude is not connected yet. Rate the items below yourself.",
  busy: "Claude is busy right now. Rate this photo yourself.",
  failed: "Claude could not read this photo. Rate the items below yourself.",
};

function Walkthrough({ walk, draft, update }: { walk: Walk; draft: Draft; update: Update }) {
  const prompts = PHOTO_PROMPTS[walk];
  const taken = draft.photos.filter((p) => p.walk === walk);
  const [skipped, setSkipped] = useState<string[]>([]);
  const nextPrompt = prompts.find((p) => !taken.some((t) => t.prompt === p.text) && !skipped.includes(p.id));
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [claudeNext, setClaudeNext] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const items = itemsFor(walk);

  async function onPhoto(file: File) {
    setStatus({ kind: "busy" });
    try {
      const image = await shrinkPhoto(file);
      const prompt = nextPrompt?.text ?? "Another photo of damage.";
      const res = await apiFetch("/api/emt/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildingId: draft.buildingId, walk, prompt, image, known: knownSoFar(draft) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.path) throw new Error(body.error ?? "Could not save the photo. Check your signal and try again.");
      const c = body.claude as PhotoClaude | null;
      update((d) => {
        const number = d.photos.length + 1;
        const withPhoto: Draft = {
          ...d,
          photos: [...d.photos, { number, path: body.path, walk, prompt, caption: c?.caption ?? "", sketch: c?.sketch ?? null }],
        };
        return c ? applyClaude(withPhoto, number, c) : withPhoto;
      });
      setClaudeNext(c?.next ?? "");
      setStatus(c ? { kind: "idle" } : { kind: "note", text: CLAUDE_NOTES[body.claudeStatus] ?? CLAUDE_NOTES.failed });
    } catch (err) {
      setStatus({ kind: "note", text: err instanceof Error ? err.message : "Could not read this photo." });
    }
  }

  return (
    <section className="space-y-4">
      <Heading
        title={walk === "outside" ? "Outside the building" : "Inside the building"}
        lead={walk === "outside" ? "Walk around the building. Ground floor and parking first." : "Stairs first, then basement, ground floor, and up. Leave the way you came if anything cracks, falls or shakes."}
      />

      <div className="space-y-3 rounded-card border border-line p-3.5">
        {status.kind === "busy" ? (
          <p className="flex items-center gap-2 text-body text-ink">
            <Spinner /> Claude is reading the photo…
          </p>
        ) : nextPrompt ? (
          <>
            <ClaudeLine>Take a photo of: {nextPrompt.text}</ClaudeLine>
            {claudeNext && <p className="text-micro text-muted">Also: {claudeNext}</p>}
          </>
        ) : (
          <ClaudeLine>That covers the photos I need here. Add more of any damage you see, then check the items below.</ClaudeLine>
        )}
        {status.kind === "note" && <p className="text-body text-attention">{status.text}</p>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onPhoto(f);
          }}
        />
        <div className="flex gap-2">
          <Button onClick={() => fileRef.current?.click()} disabled={status.kind === "busy"} className="flex-[2]">
            {nextPrompt ? "Take photo" : "Add a photo"}
          </Button>
          {nextPrompt && (
            <Button variant="secondary" onClick={() => setSkipped((s) => [...s, nextPrompt.id])} disabled={status.kind === "busy"} className="flex-1">
              Skip
            </Button>
          )}
        </div>
      </div>

      {taken.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {taken.map((p) => (
            <PhotoCard key={p.path} photo={p} update={update} />
          ))}
        </ul>
      )}

      {walk === "outside" && (
        <Field label="Sides you inspected">
          {() => (
            <Choice
              multi
              options={["Front (street)", "Back", "Left", "Right", "Roof (from outside)"] as const}
              value={draft.sidesSeen as never}
              onChange={(v) => update((d) => ({ ...d, sidesSeen: toggle(d.sidesSeen, v) }))}
            />
          )}
        </Field>
      )}
      {walk === "inside" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Floors walked" hint="e.g. B1, ground, 1–3">
            {(id) => <input id={id} value={draft.floorsWalked} maxLength={100} onChange={(e) => update((d) => ({ ...d, floorsWalked: e.target.value }))} className={inputClass} />}
          </Field>
          <Field label="Areas not inspected, and why">
            {(id) => <input id={id} dir="auto" value={draft.areasNotInspected} maxLength={200} onChange={(e) => update((d) => ({ ...d, areasNotInspected: e.target.value }))} className={inputClass} />}
          </Field>
        </div>
      )}

      <Items items={items} draft={draft} update={update} />
    </section>
  );
}

function PhotoCard({ photo: p, update }: { photo: Draft["photos"][number]; update: Update }) {
  const [busy, setBusy] = useState(false);
  async function redraw() {
    setBusy(true);
    const res = await apiFetch("/api/emt/sketch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: p.path }),
    }).catch(() => null);
    const body = res?.ok ? await res.json().catch(() => null) : null;
    setBusy(false);
    if (body?.sketch) update((d) => ({ ...d, photos: d.photos.map((x) => (x.path === p.path ? { ...x, sketch: body.sketch } : x)) }));
  }
  const removeSketch = () => update((d) => ({ ...d, photos: d.photos.map((x) => (x.path === p.path ? { ...x, sketch: null } : x)) }));
  return (
    <li className="space-y-2 rounded-card border border-line p-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- private, short-lived links */}
      <img src={photoUrl(p.path)} alt={p.caption || `Photo ${p.number}`} className="aspect-[4/3] w-full rounded-control object-cover" />
      <p className="text-micro text-muted">
        Photo {p.number}
        {p.caption && `: ${p.caption}`}
      </p>
      {p.sketch && <SketchView sketch={p.sketch} />}
      <div className="flex gap-3 text-micro">
        <button type="button" onClick={redraw} disabled={busy} className="min-h-11 text-accent underline underline-offset-2">
          {busy ? "Drawing…" : p.sketch ? "Redraw sketch" : "Draw sketch"}
        </button>
        {p.sketch && (
          <button type="button" onClick={removeSketch} className="min-h-11 text-muted underline underline-offset-2">
            Remove sketch
          </button>
        )}
      </div>
    </li>
  );
}

const RATING_ON: Record<Rating, string> = {
  none: "border-vine bg-vine/12",
  moderate: "border-apricot bg-apricot/15",
  severe: "border-rooftile bg-rooftile/12",
  unseen: "border-stone bg-surface-soft",
};

function Items({ items, draft, update }: { items: Item[]; draft: Draft; update: Update }) {
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g} className="space-y-2">
          <h3 className="micro-label">{GROUP_LABEL[g]}</h3>
          <ul className="space-y-2">
            {items.filter((i) => i.group === g).map((i) => {
              const a = draft.items[i.id] ?? emptyAnswer();
              const shown: Exclude<Rating, "unseen"> = a.rating && a.rating !== "unseen" ? a.rating : "none";
              return (
                <li key={i.id} className="space-y-2 rounded-card border border-line px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="text-body font-medium text-ink">{i.label}</span>
                    {a.claude && a.by === "claude" && (
                      <span className="text-micro font-medium text-accent">
                        Claude{a.confidence != null && ` · ${a.confidence}%`}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label={i.label}>
                    {RATINGS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={a.rating === r}
                        onClick={() =>
                          update((d) => ({
                            ...d,
                            items: { ...d.items, [i.id]: { ...(d.items[i.id] ?? emptyAnswer()), rating: r, by: "emt" } },
                          }))
                        }
                        className={`min-h-11 rounded-control border px-1 text-micro leading-tight font-medium text-ink transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                          a.rating === r ? RATING_ON[r] : "border-line bg-surface hover:bg-surface-soft"
                        }`}
                      >
                        {RATING_LABEL[r]}
                      </button>
                    ))}
                  </div>
                  {a.rating === "unseen" ? (
                    <p className="text-micro text-muted">You could not look at this.</p>
                  ) : a.rating ? (
                    <p className="text-micro text-muted">
                      {RATING_LABEL[shown]}: {i.levels[shown]}
                    </p>
                  ) : (
                    <ul className="space-y-0.5 text-micro text-muted">
                      {(["none", "moderate", "severe"] as const).map((r) => (
                        <li key={r}>
                          <span className="font-medium text-ink">{RATING_LABEL[r]}:</span> {i.levels[r]}
                        </li>
                      ))}
                    </ul>
                  )}
                  {a.claude && a.by === "emt" && a.rating !== a.claude && (
                    <p className="text-micro text-muted">
                      Claude said {RATING_LABEL[a.claude]}
                      {a.confidence != null && ` · ${a.confidence}%`}
                    </p>
                  )}
                  {a.reason && (
                    <p dir="auto" className="text-micro text-ink">
                      <span className="font-medium text-accent">Claude saw: </span>
                      {a.reason}
                      {a.photos.length > 0 && ` (photo ${a.photos.join(", ")})`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Building facts
// ---------------------------------------------------------------------------

function BuildingStep({ draft, update }: { draft: Draft; update: Update }) {
  const f = draft.facts;
  const claudeMark = (k: keyof Facts) => draft.claudeFacts.includes(k);
  return (
    <>
      <Heading title="The building" lead="Claude filled in what the photos show. Ask residents for the rest." />
      <ClaudeLine>Ask a resident: how many apartments are there, how many people are inside now, and is any unit not habitable?</ClaudeLine>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <TextField label="Floors above ground" k="floors" inputMode="numeric" draft={draft} update={update} />
        <TextField label="Basements" k="basements" inputMode="numeric" draft={draft} update={update} />
        <TextField label="Added on roof" k="addedOnRoof" draft={draft} update={update} />
        <TextField label="Apartments / units" hint="ask residents" k="units" inputMode="numeric" draft={draft} update={update} />
        <TextField label="Not habitable now" hint="ask residents" k="notHabitable" inputMode="numeric" draft={draft} update={update} />
        <TextField label="People inside" hint="ask residents" k="peopleInside" inputMode="numeric" draft={draft} update={update} />
      </div>
      <Field label="Footprint" claude={claudeMark("footprint")}>
        {() => <Choice options={FOOTPRINTS} value={f.footprint as (typeof FOOTPRINTS)[number]} onChange={(v) => update((d) => setFact(d, "footprint", v))} />}
      </Field>
      <Field label="Approximate age" claude={claudeMark("age")}>
        {() => <Choice options={AGES} value={f.age as (typeof AGES)[number]} onChange={(v) => update((d) => setFact(d, "age", v))} />}
      </Field>
      <Field label="Construction" hint="tick what you see" claude={claudeMark("construction")}>
        {() => (
          <Choice
            multi
            options={CONSTRUCTION.map((c) => c.id)}
            labels={Object.fromEntries(CONSTRUCTION.map((c) => [c.id, c.hint ? `${c.label} (${c.hint})` : c.label]))}
            value={f.construction}
            onChange={(v) => update((d) => setFact(d, "construction", toggle(d.facts.construction, v)))}
          />
        )}
      </Field>
      <Field label="Occupancy" claude={claudeMark("occupancy")}>
        {() => <Choice multi options={OCCUPANCY} value={f.occupancy as never} onChange={(v) => update((d) => setFact(d, "occupancy", toggle(d.facts.occupancy, v)))} />}
      </Field>
      <Field label="Features" hint="tick all that apply" claude={claudeMark("features")}>
        {() => <Choice multi options={FEATURES} value={f.features as never} onChange={(v) => update((d) => setFact(d, "features", toggle(d.facts.features, v)))} />}
      </Field>
    </>
  );
}

// ---------------------------------------------------------------------------
// The gate: go inside?
// ---------------------------------------------------------------------------

function GateStep({ draft, update, onStop, onEnter }: { draft: Draft; update: Update; onStop: (c: string) => void; onEnter: () => void }) {
  const outside = itemsFor("outside").map((i) => ({ i, a: draft.items[i.id] }));
  const severe = outside.filter((x) => x.a?.rating === "severe").map((x) => x.i.label);
  const unseen = outside.filter((x) => x.a?.rating === "unseen").length;
  return (
    <>
      <Heading title="Go inside?" lead="Decide from what you saw outside. Enter only if your team leader agrees." />
      <ClaudeLine>
        {severe.length > 0
          ? `Do not enter: severe damage outside (${severe.join(", ")}).`
          : unseen > 0
            ? "Nothing severe outside, but some parts could not be seen. If you enter, stay away from the sides you did not see."
            : "Nothing severe outside. You may enter in pairs if your team leader agrees."}
      </ClaudeLine>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant={draft.gate === "enter" ? "primary" : "secondary"}
          onClick={() => {
            update((d) => ({ ...d, gate: "enter" }));
            onEnter();
          }}
          className="min-h-14"
        >
          Enter
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            update((d) => ({ ...d, gate: "do-not-enter" }));
            onStop("Gate: do not enter, from what was seen outside");
          }}
          className="min-h-14"
        >
          Do not enter
        </Button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Posting: Claude proposes, the EMT decides
// ---------------------------------------------------------------------------

function PostingStep({ draft, update }: { draft: Draft; update: Update }) {
  const [status, setStatus] = useState<"idle" | "busy" | "off" | "failed">("idle");
  const asked = useRef(false);

  async function ask() {
    setStatus("busy");
    const res = await apiFetch("/api/emt/posting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft }),
    }).catch(() => null);
    const body = res?.ok ? await res.json().catch(() => null) : null;
    const r = body?.result;
    if (!r) return setStatus(body?.claudeStatus === "off" ? "off" : "failed");
    setStatus("idle");
    update((d) => ({
      ...d,
      claudePosting: { posting: r.posting, because: r.because, reason: r.reason, confidence: cleanConfidence(r.confidence) },
      // Claude's proposal fills only what the EMT has not set.
      posting: d.posting ?? r.posting,
      restrictions: d.restrictions || r.restrictions,
      damage: d.damage || r.damage,
      actions: isEmptyActions(d.actions) ? r.actions : d.actions,
    }));
  }

  useEffect(() => {
    if (asked.current || draft.claudePosting) return;
    asked.current = true;
    // Ask Claude once on arriving at this step; the EMT can ask again.
    ask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const c = draft.claudePosting;
  return (
    <>
      <Heading title="Posting" lead="The placard for the entrance. Claude proposes one; you decide." />
      {status === "busy" && (
        <p className="flex items-center gap-2 text-body text-ink">
          <Spinner /> Claude is weighing the assessment…
        </p>
      )}
      {status === "off" && <p className="text-body text-muted">Claude is not connected yet. Choose the posting yourself.</p>}
      {status === "failed" && (
        <p className="text-body text-attention">
          Claude could not propose a posting.{" "}
          <button type="button" onClick={ask} className="underline underline-offset-2">
            Ask again
          </button>
        </p>
      )}
      {c && (
        <div className="space-y-2">
          <ClaudeLine>
            I suggest <strong>{POSTING_LABEL[c.posting]}</strong>
            {c.confidence != null && ` (${confidenceText(c.confidence)})`}. {c.reason}
            {c.because.length > 0 && ` (items ${c.because.join(", ")})`}
          </ClaudeLine>
          <button type="button" onClick={ask} disabled={status === "busy"} className="min-h-11 text-micro text-accent underline underline-offset-2">
            Ask Claude again
          </button>
        </div>
      )}
      <div className="space-y-2" role="radiogroup" aria-label="Final posting">
        {POSTINGS.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={draft.posting === p}
            onClick={() => update((d) => ({ ...d, posting: p }))}
            className={`flex w-full items-center gap-3 rounded-card border-2 px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              draft.posting === p ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-soft"
            }`}
          >
            <PostingBadge posting={p} />
            <span className="text-micro text-muted">{POSTING_MEANING[p]}</span>
          </button>
        ))}
      </div>
      {c && draft.posting && isDowngrade(c.posting, draft.posting) && (
        <p className="rounded-control bg-attention-soft px-3 py-2 text-body text-attention">
          Claude proposed {POSTING_LABEL[c.posting]}. You chose {POSTING_LABEL[draft.posting]}.
        </p>
      )}
      <Field label="Placard restrictions" hint="exactly as written on the placard">
        {(id) => (
          <AutoTextarea id={id} dir="auto" value={draft.restrictions} maxLength={600} onChange={(e) => update((d) => ({ ...d, restrictions: e.target.value }))} />
        )}
      </Field>
    </>
  );
}

const isEmptyActions = (a: Draft["actions"]) =>
  !a.barricade && !a.other && !a.neighbours && a.engineer.length + a.shutOff.length + a.notify.length === 0;

// ---------------------------------------------------------------------------
// Actions, damage estimate, comments
// ---------------------------------------------------------------------------

function ActionsStep({ draft, update }: { draft: Draft; update: Update }) {
  const a = draft.actions;
  const set = (change: Partial<Draft["actions"]>) => update((d) => ({ ...d, actions: { ...d.actions, ...change } }));
  return (
    <>
      <Heading title="Actions" lead="Tick only what is needed. Claude filled in a suggestion." />
      <Field label="Barricade or cordon" hint="where">
        {(id) => <input id={id} dir="auto" value={a.barricade} maxLength={200} onChange={(e) => set({ barricade: e.target.value })} className={inputClass} />}
      </Field>
      <Field label="Engineer evaluation">
        {() => <Choice multi options={ACTIONS.engineer} value={a.engineer as never} onChange={(v) => set({ engineer: toggle(a.engineer, v) })} />}
      </Field>
      <Field label="Shut off">
        {() => <Choice multi options={ACTIONS.shutOff} value={a.shutOff as never} onChange={(v) => set({ shutOff: toggle(a.shutOff, v) })} />}
      </Field>
      <Field label="Neighbours">
        {() => (
          <Choice
            options={["yes"] as const}
            labels={{ yes: "Check or evacuate neighbours" }}
            value={a.neighbours ? "yes" : null}
            onChange={() => set({ neighbours: !a.neighbours })}
          />
        )}
      </Field>
      <Field label="Notify">
        {() => <Choice multi options={ACTIONS.notify} value={a.notify as never} onChange={(v) => set({ notify: toggle(a.notify, v) })} />}
      </Field>
      <Field label="Other recommendations">
        {(id) => <AutoTextarea id={id} dir="auto" value={a.other} maxLength={600} onChange={(e) => set({ other: e.target.value })} />}
      </Field>
      <Field label="Estimated damage" hint="repair ÷ replacement cost; only if authorities ask">
        {() => <Choice options={DAMAGE_ESTIMATES} value={draft.damage as (typeof DAMAGE_ESTIMATES)[number]} onChange={(v) => update((d) => ({ ...d, damage: d.damage === v ? "" : v }))} />}
      </Field>
      <Field label="Comments">
        {(id) => <AutoTextarea id={id} dir="auto" value={draft.comments} maxLength={2000} onChange={(e) => update((d) => ({ ...d, comments: e.target.value }))} />}
      </Field>
    </>
  );
}

// ---------------------------------------------------------------------------
// Review and save
// ---------------------------------------------------------------------------

async function saveAssessment(d: Draft): Promise<{ assessment: Assessment } | { error: string }> {
  try {
    const res = await apiFetch(`/api/buildings/${d.buildingId}/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: d }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.assessment) return { error: body.error ?? "Could not save. Your assessment is kept on this phone; try again." };
    return { assessment: body.assessment };
  } catch {
    return { error: "No connection. Your assessment is kept on this phone; try again when you have signal." };
  }
}

function ReviewStep({ draft, onSaved, onGo }: { draft: Draft; onSaved: (a: Assessment) => void; onGo: (s: Step) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rated = Object.values(draft.items).filter((a) => a.rating).length;
  const changed = Object.values(draft.items).filter((a) => a.claude && a.rating !== a.claude).length;

  async function save() {
    setSaving(true);
    setError(null);
    const result = await saveAssessment(draft);
    setSaving(false);
    if ("error" in result) return setError(result.error);
    onSaved(result.assessment);
  }

  return (
    <>
      <Heading title="Save the assessment" lead="It becomes part of the building's permanent record, on both maps." />
      {draft.posting ? (
        <div className="space-y-1">
          <PostingBadge posting={draft.posting} size="large" />
          {draft.restrictions && <p dir="auto" className="text-body text-ink">{draft.restrictions}</p>}
        </div>
      ) : (
        <p className="text-body text-attention">
          Choose a posting first.{" "}
          <button type="button" onClick={() => onGo("posting")} className="underline underline-offset-2">
            Go to Posting
          </button>
        </p>
      )}
      <ul className="space-y-1 text-body text-ink">
        <li>
          {draft.photos.length} {draft.photos.length === 1 ? "photo" : "photos"}, {rated} {rated === 1 ? "item" : "items"} rated
        </li>
        {changed > 0 && <li>You changed {changed} of Claude&apos;s answers</li>}
        {draft.claudePosting && draft.posting && draft.claudePosting.posting !== draft.posting && (
          <li>You chose {POSTING_LABEL[draft.posting]}; Claude suggested {POSTING_LABEL[draft.claudePosting.posting]}</li>
        )}
        <li>Inside: {draft.gate === "enter" ? "entered" : "not entered"}</li>
      </ul>
      {error && <p className="text-body text-attention">{error}</p>}
      <Button onClick={save} disabled={saving || !draft.posting} className="w-full">
        {saving ? "Saving…" : "Save assessment"}
      </Button>
      <Button variant="secondary" onClick={() => onGo("actions")} className="w-full">
        Back
      </Button>
    </>
  );
}

