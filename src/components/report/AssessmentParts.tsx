import {
  GROUP_LABEL,
  ITEMS,
  POSTING_COLOUR,
  POSTING_LABEL,
  POSTING_MEANING,
  RATING_LABEL,
  SCENE_CHECKS,
  type Assessment,
  type Posting,
  type Rating,
  type Sketch,
} from "@/lib/atc20";
import { formatDate } from "@/lib/format";
import { RatingArches } from "../ui/Arch";
import { STATUS_TEXT } from "./ColourBadge";

/**
 * Pieces of the EMT assessment shared by both maps (plan.md item 25): the
 * posting badge, Claude's debrief, the line sketch and the read-only view.
 */

const POSTING_BG: Record<Posting, string> = {
  inspected: "bg-vine/12 border-vine/30",
  restricted: "bg-apricot/15 border-apricot/40",
  unsafe: "bg-rooftile/12 border-rooftile/35",
};

/** An ATC-20 placard: colour, arches and the word together, like a rating (plan rule 1). */
export function PostingBadge({ posting, size = "small" }: { posting: Posting; size?: "small" | "large" }) {
  const colour = POSTING_COLOUR[posting];
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-chip border font-medium text-ink ${POSTING_BG[posting]} ${
        size === "large" ? "min-h-10 gap-2.5 py-1 pr-4 pl-3 text-lead" : "min-h-7 gap-2 px-2.5 py-0.5 text-micro"
      }`}
    >
      <RatingArches colour={colour} large={size === "large"} className={STATUS_TEXT[colour]} />
      {POSTING_LABEL[posting]}
    </span>
  );
}

/** Says plainly that an EMT, not an engineer, made this posting. */
export function EmtLabel() {
  return <span className="text-micro text-muted">EMT posting, not yet reviewed by an engineer</span>;
}

/** Claude's short debrief of the whole record, above the history. */
export function DebriefCard({ text }: { text: string }) {
  return (
    <section aria-label="Claude's debrief" className="rounded-card border border-line bg-surface-soft px-3.5 py-3">
      <p className="micro-label">Claude&apos;s debrief</p>
      <div className="mt-1.5 space-y-1 text-body text-ink">
        {text.split("\n").filter(Boolean).map((line, i) => (
          <p key={i} dir="auto">
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}

const MARK_COLOUR = { moderate: "var(--color-apricot)", severe: "var(--color-rooftile)" } as const;

/** Claude's line sketch of one photo, drawn from numbers only (never raw SVG from Claude). */
export function SketchView({ sketch, className = "" }: { sketch: Sketch; className?: string }) {
  const clamp = (n: number) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
  return (
    <figure className={className}>
      <svg viewBox="-4 -4 108 108" className="h-auto w-full rounded-control border border-line bg-surface" role="img" aria-label={`Sketch: ${sketch.title}`}>
        <defs>
          <pattern id="sketch-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="var(--color-line)" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#sketch-grid)" />
        {sketch.lines.slice(0, 60).map((l, i) => (
          <line key={`l${i}`} x1={clamp(l.x1)} y1={clamp(l.y1)} x2={clamp(l.x2)} y2={clamp(l.y2)} stroke="var(--color-ink)" strokeWidth="0.8" strokeLinecap="round" />
        ))}
        {sketch.boxes.slice(0, 40).map((b, i) => (
          <g key={`b${i}`}>
            <rect x={clamp(b.x)} y={clamp(b.y)} width={clamp(b.w)} height={clamp(b.h)} fill="none" stroke="var(--color-muted)" strokeWidth="0.5" />
            {b.label && (
              <text x={clamp(b.x) + 1} y={clamp(b.y) + 3.5} fontSize="3" fill="var(--color-muted)">
                {b.label.slice(0, 24)}
              </text>
            )}
          </g>
        ))}
        {sketch.marks.slice(0, 20).map((m, i) => (
          <g key={`m${i}`}>
            <circle cx={clamp(m.x)} cy={clamp(m.y)} r="3.2" fill={MARK_COLOUR[m.rating]} fillOpacity="0.9" />
            <text x={clamp(m.x)} y={clamp(m.y) + 1.1} fontSize="2.8" textAnchor="middle" fill="#fff" fontWeight="600">
              {m.item.slice(0, 3)}
            </text>
          </g>
        ))}
        {sketch.north && (
          <g transform={`translate(${clamp(sketch.north.x)} ${clamp(sketch.north.y)}) rotate(${sketch.north.angle})`}>
            <path d="M0 -5 L2 2 L0 1 L-2 2 Z" fill="var(--color-ink)" />
            <text y="6" fontSize="3" textAnchor="middle" fill="var(--color-ink)">N</text>
          </g>
        )}
      </svg>
      <figcaption className="mt-1 text-micro text-muted">
        {sketch.title}
        {sketch.street && ` · ${sketch.street}`}
        {sketch.marks.length > 0 && ` · ${sketch.marks.map((m) => `${m.item}: ${m.note}`).join(", ")}`}
      </figcaption>
    </figure>
  );
}

export const photoUrl = (path: string) => `/api/emt/photo?path=${encodeURIComponent(path)}`;

const RATING_TEXT: Record<Rating, string> = {
  none: "text-muted",
  moderate: "text-attention font-medium",
  severe: "text-rooftile font-semibold",
  unseen: "text-muted italic",
};

/** A saved assessment, read only, on both maps. */
export function AssessmentView({ assessment: a }: { assessment: Assessment }) {
  const d = a.data;
  const f = d.facts;
  const rated = ITEMS.filter((i) => d.items?.[i.id]?.rating);
  const groups = [...new Set(rated.map((i) => i.group))];
  const changedByEmt = rated.filter((i) => {
    const x = d.items[i.id];
    return x.claude !== null && x.rating !== x.claude;
  }).length;
  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-2">
        <PostingBadge posting={a.posting} size="large" />
        <p className="text-body text-ink">{POSTING_MEANING[a.posting]}</p>
        <EmtLabel />
        {a.stopped_reason && (
          <p className="rounded-control bg-rooftile/10 px-3 py-2 text-body text-ink">
            Stopped at a danger: {a.stopped_reason}. Evacuation ordered.
          </p>
        )}
        {d.restrictions && <p dir="auto" className="text-body text-ink">Restrictions: {d.restrictions}</p>}
        <p className="text-micro text-muted">
          {formatDate(a.created_at.slice(0, 10))} · {a.inspector_name}
          {d.organization && ` · ${d.organization}`}
          {a.claude_posting && ` · Claude suggested ${POSTING_LABEL[a.claude_posting]}`}
          {a.overrode_claude && " · EMT overrode Claude"}
          {changedByEmt > 0 && ` · EMT changed ${changedByEmt} of Claude's answers`}
        </p>
      </div>

      {d.claudePosting?.reason && (
        <Section title="Claude's reasoning">
          <p dir="auto" className="text-body text-ink">{d.claudePosting.reason}</p>
        </Section>
      )}

      {rated.length > 0 && (
        <Section title="Damage (ATC-20)">
          {groups.map((g) => (
            <div key={g} className="space-y-1">
              <p className="text-micro font-medium text-muted">{GROUP_LABEL[g]}</p>
              <ul className="divide-y divide-line rounded-card border border-line">
                {rated.filter((i) => i.group === g).map((i) => {
                  const x = d.items[i.id];
                  return (
                    <li key={i.id} className="flex flex-wrap items-baseline justify-between gap-x-3 px-3 py-2 text-body">
                      <span className="text-ink">{i.label}</span>
                      <span className={RATING_TEXT[x.rating!]}>
                        {RATING_LABEL[x.rating!]}
                        {x.claude && x.claude !== x.rating && (
                          <span className="font-normal text-muted not-italic"> (Claude: {RATING_LABEL[x.claude]})</span>
                        )}
                      </span>
                      {x.reason && <span dir="auto" className="w-full text-micro text-muted">{x.reason}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {d.photos?.length > 0 && (
        <Section title="Photos and sketches">
          <ul className="grid gap-4 sm:grid-cols-2">
            {d.photos.map((p) => (
              <li key={p.path} className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, short-lived links */}
                <img src={photoUrl(p.path)} alt={p.caption || `Photo ${p.number}`} className="aspect-[4/3] w-full rounded-control border border-line object-cover" loading="lazy" />
                <p className="text-micro text-muted">
                  Photo {p.number}: {p.caption || p.prompt}
                </p>
                {p.sketch && <SketchView sketch={p.sketch} />}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Scene safety">
        <Facts
          rows={SCENE_CHECKS.map((s) => [s.label, d.checks?.[s.id] === "yes" ? "Yes" : d.checks?.[s.id] === "no" ? "No" : "Not answered"])}
        />
      </Section>

      <Section title="Building">
        <Facts
          rows={[
            ["Location", [f.street, f.municipality, f.district, f.governorate].filter(Boolean).join(", ")],
            ["GPS", f.lat && f.lng ? `${f.lat}, ${f.lng}` : ""],
            ["Floors above ground", f.floors],
            ["Basements", f.basements],
            ["Added on roof", f.addedOnRoof],
            ["Apartments / units", f.units],
            ["People inside", f.peopleInside],
            ["Footprint", f.footprint],
            ["Age", f.age],
            ["Construction", [...f.construction, f.constructionOther].filter(Boolean).join(", ")],
            ["Occupancy", f.occupancy.join(", ")],
            ["Features", f.features.join(", ")],
            ["Sides seen", d.sidesSeen?.join(", ")],
            ["Went inside", d.gate === "enter" ? "Yes" : d.gate === "do-not-enter" ? "No" : ""],
          ]}
        />
      </Section>

      <Section title="Actions">
        <Facts
          rows={[
            ["Barricade", d.actions?.barricade],
            ["Engineer evaluation", d.actions?.engineer?.join(", ")],
            ["Shut off", d.actions?.shutOff?.join(", ")],
            ["Check or evacuate neighbours", d.actions?.neighbours ? "Yes" : ""],
            ["Notify", d.actions?.notify?.join(", ")],
            ["Other", d.actions?.other],
            ["Estimated damage", d.damage],
          ]}
        />
        {d.comments && <p dir="auto" className="text-body text-ink">{d.comments}</p>}
      </Section>
      <p className="text-micro text-muted">
        Adapted from the ATC-20 Detailed Evaluation form, © Applied Technology Council. This adaptation is not an ATC
        publication and is not endorsed by ATC.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="micro-label">{title}</h3>
      {children}
    </section>
  );
}

function Facts({ rows }: { rows: [string, string | undefined][] }) {
  const shown = rows.filter(([, v]) => v);
  if (shown.length === 0) return <p className="text-body text-muted">Nothing recorded.</p>;
  return (
    <dl className="divide-y divide-line rounded-card border border-line">
      {shown.map(([k, v]) => (
        <div key={k} className="flex flex-wrap justify-between gap-x-3 px-3 py-2 text-body">
          <dt className="text-muted">{k}</dt>
          <dd dir="auto" className="text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

