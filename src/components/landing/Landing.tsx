import Image from "next/image";
import Link from "next/link";
import { MAP_PATH } from "@/lib/maps";
import { PRIORITY_NOTE, PRIORITY_STEPS } from "@/lib/priority";
import { ADAPTED, ATC20, AUTHOR, CLAUDE, CLOSE, HERO, SITUATION, SOLUTION, SOURCES, TASK } from "@/lib/landing-content";
import type { Sketch } from "@/lib/atc20";
import sketchJson from "@/lib/landing-sketch.json";
import { SketchView } from "../report/AssessmentParts";
import { Logo } from "../ui/Logo";
import { CityFlight, HeroArabic, LightWords, Reveal, SmoothScroll } from "./motion";
import "./landing.css";

/** Claude's real answer for the damaged-building photo (scripts/landing-sketch.ts). */
const sketch = sketchJson as Sketch;

/**
 * The portfolio landing page at / (plan.md item 28): a case study in STAR order,
 * after template A (docs/templates/a-editorial.html) with template C's giant
 * زحلة and camera flight. Light only. Words live in src/lib/landing-content.ts.

 */
export default function Landing() {
  return (
    <div className="lp">
      <SmoothScroll />
      <Nav />
      <Hero />
      <CityFlight />
      <Situation />
      <Task />
      <Atc20 />
      <Adapted />
      <Solution />
      <ClaudeSection />
      <Author />
      <Close />
    </div>
  );
}

function Nav() {
  return (
    <nav className="lp-nav" aria-label="Main">
      <Link href="/" aria-label="Zahle on Record" className="lp-nav-logo">
        <Logo cut="small" className="h-9" title={null} />
      </Link>
      <div className="lp-nav-links">
        <Pill href={MAP_PATH.engineer}>Engineer</Pill>
        <Pill href={MAP_PATH.emt}>Volunteer</Pill>
      </div>
    </nav>
  );
}

function Pill({ href, children, solid = false }: { href: string; children: React.ReactNode; solid?: boolean }) {
  return (
    <Link href={href} className="lp-pill" data-solid={solid || undefined}>
      <span>{children}</span>
    </Link>
  );
}

function Hero() {
  return (
    <header className="lp-hero">
      <HeroArabic />
      <p className="lp-label lp-fade">{HERO.kicker}</p>
      <h1 className="lp-hero-title">
        {HERO.lines.map((l, i) => (
          <span key={l} className="lp-line">
            <span style={{ animationDelay: `${i * 80}ms` }}>{l}</span>
          </span>
        ))}
        <span className="lp-line">
          <span style={{ animationDelay: "160ms" }}>
            <em className="lp-serif">{HERO.accent}</em>
          </span>
        </span>
      </h1>
      <div className="lp-hero-foot lp-fade">
        <p className="lp-lead">{HERO.lead}</p>
        <div className="lp-hero-actions">
          <Pill href={MAP_PATH.engineer} solid>
            Engineer map
          </Pill>
          <Pill href={MAP_PATH.emt}>Volunteer map</Pill>
        </div>
      </div>
    </header>
  );
}

function Chapter({ index, label, side, id, children }: { index: string; label: string; side: string; id?: string; children: React.ReactNode }) {
  return (
    <section className="lp-chapter" id={id} aria-label={`${label}: ${side}`}>
      <div className="lp-chapter-head">
        <span className="lp-label">
          {index} — {label}
        </span>
        <span className="lp-label">{side}</span>
      </div>
      {children}
    </section>
  );
}

/** A real screen from the product on a soft panel, with what it shows under it. */
function Shot({ src, alt, width, height, credit, phone = false }: { src: string; alt: string; width: number; height: number; credit: string; phone?: boolean }) {
  return (
    <figure className="lp-shot" data-phone={phone || undefined}>
      <div className="lp-shot-panel">
        <Image src={src} alt={alt} width={width} height={height} sizes={phone ? "300px" : "400px"} />
      </div>
      <figcaption>{credit}</figcaption>
    </figure>
  );
}

/** A small numbered badge that opens the source of the fact beside it. */
function Src({ n }: { n: number }) {
  const s = SOURCES.find((x) => x.id === n);
  if (!s) return null;
  return (
    <a href={s.url} className="lp-src" target="_blank" rel="noreferrer" aria-label={`Source: ${s.label}`} title={s.label}>
      {n}
    </a>
  );
}

/** A photo in a rounded frame that settles in as it comes into view, with its credit under it. */
function Photo({ src, alt, width, height, credit, sizes, className = "" }: { src: string; alt: string; width: number; height: number; credit?: string; sizes: string; className?: string }) {
  return (
    <figure className={`lp-photo ${className}`}>
      <div className="lp-photo-frame">
        <Image src={src} alt={alt} width={width} height={height} sizes={sizes} />
      </div>
      {credit && <figcaption>{credit}</figcaption>}
    </figure>
  );
}

function Situation() {
  const s = SITUATION;
  return (
    <Chapter index={s.index} label={s.label} side={s.side}>
      <LightWords text={s.statement} className="lp-statement" />
      <p className="lp-note">
        Lebanon Health Ministry <Src n={s.statementSource} />
      </p>
      <div className="lp-facts">
        {s.facts.map((f, i) => (
          <Reveal key={f.text} delay={i * 90} className="lp-fact">
            <b>
              {f.value}
              {f.unit && <small>{f.unit}</small>}
            </b>
            <p>
              {f.text} <Src n={f.source} />
            </p>
          </Reveal>
        ))}
      </div>
      <div className="lp-split">
        <Reveal>
          <Photo {...s.photo} sizes="(min-width: 900px) 40vw, 100vw" />
        </Reveal>
        <Reveal className="lp-prose" delay={90}>
          {s.body.map((p, i) => (
            <p key={p}>
              {p}
              {i === 0 && (
                <>
                  {" "}
                  <Src n={s.bodySource} />
                </>
              )}
            </p>
          ))}
        </Reveal>
      </div>
    </Chapter>
  );
}

function Task() {
  const t = TASK;
  return (
    <Chapter index={t.index} label={t.label} side={t.side}>
      <Reveal>
        <h2 className="lp-h2 lp-h2-wide">
          {t.title} <em className="lp-serif">{t.titleAccent}</em>
        </h2>
      </Reveal>
      <div className="lp-split lp-split-rev">
        <Reveal>
          <Photo {...t.photo} sizes="(min-width: 900px) 50vw, 100vw" />
        </Reveal>
        <Reveal className="lp-prose" delay={90}>
          {t.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Reveal>
      </div>
      <div className="lp-heard">
        <Reveal>
          <p className="lp-label">{t.heard.label}</p>
          <p className="lp-heard-intro">{t.heard.intro}</p>
        </Reveal>
        <ol className="lp-rows">
          {t.heard.points.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <li className="lp-row">
                <span className="lp-label">0{i + 1}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </Chapter>
  );
}

function Atc20() {
  const a = ATC20;
  return (
    <Chapter index={a.index} label={a.label} side={a.side}>
      <Reveal>
        <h2 className="lp-h2 lp-h2-wide">{a.title}</h2>
      </Reveal>
      <Reveal className="lp-prose lp-prose-wide">
        {a.body.map((p, i) => (
          <p key={p}>
            {p} <Src n={a.bodySources[i]} />
          </p>
        ))}
      </Reveal>
      <div className="lp-placards">
        {a.placards.map((p, i) => (
          <Reveal key={p.word} delay={i * 110}>
            <div className="lp-placard" data-tone={p.tone}>
              <span className="lp-placard-bar" />
              <span className="lp-label">Posting</span>
              <b>{p.word}</b>
              <p>{p.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal className="lp-why">
        <p className="lp-label">{a.why.title}</p>
        <p className="lp-why-text">{a.why.text}</p>
      </Reveal>
    </Chapter>
  );
}

function Adapted() {
  const a = ADAPTED;
  return (
    <Chapter index={a.index} label={a.label} side={a.side}>
      <Reveal>
        <h2 className="lp-h2">{a.title}</h2>
      </Reveal>
      <ol className="lp-rows">
        {a.steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 60}>
            <li className="lp-row">
              <span className="lp-label">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
      <Reveal className="lp-callout">
        <p className="lp-label">{a.oea.label}</p>
        <p>{a.oea.text}</p>
      </Reveal>
    </Chapter>
  );
}

function Solution() {
  const s = SOLUTION;
  return (
    <Chapter index={s.index} label={s.label} side={s.side}>
      <Reveal>
        <h2 className="lp-h2">{s.title}</h2>
      </Reveal>
      <div className="lp-maps">
        {s.maps.map((m, i) => (
          <Reveal key={m.name} delay={i * 110}>
            <Link href={i === 0 ? MAP_PATH.engineer : MAP_PATH.emt} className="lp-map-card">
              <div className="lp-screen" data-phone={i === 1 || undefined}>
                <Image src={m.screen.src} alt={m.screen.alt} width={m.screen.width} height={m.screen.height} sizes={i === 0 ? "(min-width: 860px) 48vw, 100vw" : "260px"} />
              </div>
              <div className="lp-map-meta">
                <span className="lp-label">{m.who}</span>
                <h3>
                  {m.name} <span className="lp-arrow">→</span>
                </h3>
                <p>{m.text}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
      <div className="lp-triage lp-triage-rev">
        <Reveal delay={110}>
          <Shot {...SOLUTION.nearMe.shot} phone />
        </Reveal>
        <Reveal className="lp-triage-text">
          <span className="lp-label">{SOLUTION.nearMe.label}</span>
          <h3>{SOLUTION.nearMe.title}</h3>
          <p>{SOLUTION.nearMe.text}</p>
        </Reveal>
      </div>
      <Reveal className="lp-key">
        <span>
          <i className="lp-key-fill" /> Engineer report fills the building
        </span>
        <span>
          <i className="lp-key-line" /> Volunteer posting outlines it
        </span>
      </Reveal>
    </Chapter>
  );
}

function ClaudeSection() {
  const c = CLAUDE;
  return (
    <Chapter index={c.index} label={c.label} side={c.side} id="claude">
      <Reveal>
        <h2 className="lp-h2 lp-h2-wide">{c.title}</h2>
      </Reveal>
      <Reveal className="lp-prose lp-prose-wide">
        <p>{c.lead}</p>
      </Reveal>

      <div className="lp-sketch">
        <Reveal>
          <Photo {...c.sketch.photo} sizes="(min-width: 900px) 46vw, 100vw" className="lp-photo-sketch" />
        </Reveal>
        <Reveal delay={120}>
          <figure className="lp-sketch-out">
            <SketchView sketch={sketch} />
            <p className="lp-note">{c.sketch.output}</p>
          </figure>
        </Reveal>
        <Reveal className="lp-sketch-text" delay={200}>
          <h3>{c.sketch.title}</h3>
          <p>{c.sketch.text}</p>
        </Reveal>
      </div>

      <div className="lp-features">
        {c.features.map((f, i) => (
          <Reveal key={f.title} delay={i * 90} className="lp-feature">
            <span className="lp-label">0{i + 1}</span>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </Reveal>
        ))}
      </div>

      <div className="lp-triage">
        <Reveal className="lp-triage-text">
          <h3>{c.triage.title}</h3>
          {c.triage.text.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </Reveal>
        <Reveal delay={110}>
          <Shot {...c.triage.shot} />
        </Reveal>
      </div>

      <div className="lp-ranking" id="ranking">
        <Reveal className="lp-triage-text">
          <h3>{c.ranking.title}</h3>
          <p>{c.ranking.lead}</p>
        </Reveal>
        <Reveal delay={110}>
          <ol className="lp-ranking-steps">
            {PRIORITY_STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="lp-ranking-note">{PRIORITY_NOTE}</p>
        </Reveal>
      </div>

      <div className="lp-ranking">
        <Reveal className="lp-triage-text">
          <h3>{c.ranking.bias.title}</h3>
          <p>{c.ranking.bias.lead}</p>
        </Reveal>
        <Reveal delay={110}>
          <ul className="lp-bias">
            {c.ranking.bias.points.map((b) => (
              <li key={b.title}>
                <strong>{b.title}</strong> {b.text}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Chapter>
  );
}

function Author() {
  const a = AUTHOR;
  return (
    <section className="lp-chapter lp-author" aria-label="About the author">
      <Reveal className="lp-author-photo">
        <Image src="/landing/author.webp" alt={a.photoAlt} width={1000} height={1333} sizes="(min-width: 900px) 34vw, 100vw" />
      </Reveal>
      <Reveal className="lp-author-text" delay={100}>
        <p className="lp-label">{a.label}</p>
        <h2 className="lp-h2">{a.name}</h2>
        <p className="lp-author-role">{a.role}</p>
        <p className="lp-lead">{a.line}</p>
        <div className="lp-author-links">
          {a.links.map((l) => (
            <a key={l.label} href={l.href} className="lp-pill" target="_blank" rel="noreferrer">
              <span>{l.label} ↗</span>
            </a>
          ))}
        </div>
        <p className="lp-note">{a.email}</p>
      </Reveal>
    </section>
  );
}

function Close() {
  return (
    <footer className="lp-close">
      <div className="lp-close-big">
        <h2>
          {CLOSE.title[0]}
          <br />
          {CLOSE.title[1]}
        </h2>
        <span className="lp-close-ar" aria-hidden="true">
          زحلة
        </span>
      </div>
      <div className="lp-close-actions">
        <Pill href={MAP_PATH.engineer} solid>
          {CLOSE.engineer}
        </Pill>
        <Pill href={MAP_PATH.emt}>{CLOSE.volunteer}</Pill>
      </div>
      <div className="lp-close-row">
        <span>Zahle on Record</span>
        <span>{CLOSE.credit}</span>
      </div>
    </footer>
  );
}
