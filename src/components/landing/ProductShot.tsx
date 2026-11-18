import { COLOUR_CONTENT, LANDING_EXAMPLE as X, REPORT_TEXT } from "@/lib/content";
import { COLOURS } from "@/lib/report";
import { ColourBadge, STATUS_TEXT } from "../report/ColourBadge";
import { RatingArches } from "../ui/Arch";
import { Logo } from "../ui/Logo";

/**
 * Product visuals for the public landing page (stageshow): a still of the
 * engineer map with the preview tray, and the report page beside it.
 *
 * Everything here is drawn, not loaded: the map is the same static picture as
 * the hero (no ratings on it), and the tray and report hold invented example
 * text from docs/engineering.md D3. Nothing reads the registry (plan rule 2).
 * It is one picture to assistive tech, with no focusable parts.
 */
export function ProductShot() {
  return (
    <figure
      role="img"
      aria-label="The engineer map with a building's preview tray open, and the report page beside it."
      className="relative mx-auto w-full max-w-[1120px] select-none md:h-[640px]"
    >
      <MapWindow />
      <ReportCard />
    </figure>
  );
}

const CHEVRON_PATH = { back: "M12 5l-5 5 5 5", up: "M5 12l5-5 5 5", close: "M5 5l10 10M15 5L5 15" } as const;

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The engineer's screen: top bar, the quiet map, the preview tray bottom-left. */
function MapWindow() {
  return (
    <div
      aria-hidden
      className="relative h-[520px] overflow-hidden rounded-card border border-line bg-ground shadow-tray md:absolute md:top-0 md:left-0 md:h-[560px] md:w-[80%]"
    >
      <div className="flex h-12 items-center gap-3 border-b border-line bg-surface px-4">
        <Logo cut="small" className="h-7" title={null} />
        <span className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-control border border-line px-2.5 text-micro font-medium text-ink">
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="10" cy="10" r="5.5" />
            <path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3" strokeLinecap="round" />
          </svg>
          Locate building
        </span>
        <span className="h-8 w-8 rounded-full border border-line bg-surface-soft" />
      </div>

      {/* The map: the landing picture at about one image pixel per screen pixel, centred on the old town. */}
      <div
        className="absolute inset-x-0 top-12 bottom-0 bg-ground bg-no-repeat"
        style={{
          backgroundImage: "url(/landing/zahle-map-2400.webp)",
          backgroundSize: "2400px auto",
          backgroundPosition: "47% 46%",
        }}
      />

      <PreviewTray />
    </div>
  );
}

/** The preview tray in the order it has in the app: status, dates, one line, actions. */
function PreviewTray() {
  return (
    <div className="absolute inset-x-2 bottom-2 rounded-tray border border-line bg-surface shadow-tray md:right-auto md:bottom-4 md:left-4 md:w-[400px]">
      <div className="flex items-center gap-1 px-4 pt-3">
        <span className="micro-label flex-1 pl-1">Building</span>
        <span className="flex h-9 w-9 items-center justify-center text-muted">
          <Glyph d={CHEVRON_PATH.up} />
        </span>
        <span className="flex h-9 w-9 items-center justify-center text-muted">
          <Glyph d={CHEVRON_PATH.close} />
        </span>
      </div>
      <div className="space-y-3 px-5 pt-1 pb-5">
        <ColourBadge colour="yellow" size="large" />
        <div className="tabular flex flex-wrap gap-x-4 text-body text-muted">
          <span>
            Built <span className="text-ink">{X.built}</span>
          </span>
          <span>
            Inspected <span className="text-ink">{X.inspected}</span>
          </span>
        </div>
        <p className="text-body text-ink">{X.final}</p>
        <p className="text-micro text-muted">
          By {X.engineer}, Structural engineer
        </p>
        <div className="flex gap-2 border-t border-dashed border-line pt-4">
          <span className="inline-flex min-h-11 flex-1 items-center justify-center rounded-control border border-line text-body font-medium text-ink">
            View history
          </span>
          <span className="inline-flex min-h-11 flex-1 items-center justify-center rounded-control bg-accent text-body font-medium text-white">
            Create report
          </span>
        </div>
      </div>
    </div>
  );
}

/** The full-screen report page, as a phone-width card overlapping the map window. Its foot fades out. */
function ReportCard() {
  return (
    <div
      aria-hidden
      className="relative z-10 mx-auto mt-4 w-full max-w-[360px] overflow-hidden rounded-tray border border-line bg-surface shadow-tray md:absolute md:top-16 md:right-0 md:mt-0 md:w-[360px]"
    >
      <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-line px-3">
        <span className="flex h-9 w-9 items-center justify-center text-muted">
          <Glyph d={CHEVRON_PATH.back} />
        </span>
        <span className="text-center text-body font-medium text-ink">Create report</span>
        <span className="inline-flex min-h-9 items-center rounded-control bg-accent px-3 text-micro font-medium text-white">
          {REPORT_TEXT.save}
        </span>
      </div>
      <div className="space-y-5 px-4 pt-4 pb-5">
        <div>
          <div className="grid grid-cols-3 gap-2">
            {COLOURS.map((c) => {
              const selected = c === "yellow";
              return (
                <span
                  key={c}
                  className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-card border px-1.5 text-center ${
                    selected ? "border-apricot bg-apricot/15 ring-1 ring-apricot" : "border-line"
                  }`}
                >
                  <RatingArches colour={c} large className={STATUS_TEXT[c]} />
                  <span className="text-micro leading-tight font-medium text-ink">{COLOUR_CONTENT[c].word}</span>
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-center text-micro text-muted">{REPORT_TEXT.ratingNote}</p>
        </div>
        <div className="divide-y divide-line rounded-card border border-line">
          {[
            [REPORT_TEXT.date, X.inspected],
            [REPORT_TEXT.residents, X.residents],
            [REPORT_TEXT.built, X.built],
          ].map(([label, value]) => (
            <div key={label} className="flex min-h-11 items-center justify-between px-3.5 text-body">
              <span className="font-medium text-ink">{label}</span>
              <span className="tabular text-ink">{value}</span>
            </div>
          ))}
        </div>
        {[
          ["Roof", X.roof],
          ["Columns", X.columns],
        ].map(([label, text]) => (
          <div key={label}>
            <div className="mb-1.5 text-body font-semibold text-ink">{label}</div>
            <div className="rounded-control bg-surface-soft px-3 py-2.5 text-body text-ink">{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
