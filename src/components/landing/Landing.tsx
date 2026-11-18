import Image from "next/image";
import Link from "next/link";
import { LANDING as T } from "@/lib/content";
import mapSize from "@/lib/landing-map.json";
import { LinkButton } from "../ui/LinkButton";
import { Logo } from "../ui/Logo";
import { ProductShot } from "./ProductShot";
import { Ribbon } from "./Ribbon";

/**
 * The public landing page (plan.md item 23, DESIGN.md 13 to 15).
 * Shown at / to signed-out visitors (src/proxy.ts). A static page: it makes no
 * database or API call, and its map is a flat picture drawn from open
 * OpenStreetMap outlines by scripts/render-landing-map.ts, every footprint grey.
 *
 * The river-blue ribbon (Ribbon.tsx) grows out of the ز tail in the logo, runs
 * down the text column and ties back into the ز of the footer logo. It finds its way by the
 * data-ribbon marks below: it runs beside text, never over it, and passes
 * behind the product pictures.
 */
export default function Landing() {
  return (
    <div data-ribbon="root" className="relative isolate overflow-x-clip bg-ground text-ink">
      <Ribbon />
      <Hero />
      <Showcase />
      <About />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <header className="relative flex flex-col md:block md:min-h-[min(100svh,820px)]">
      {/* The map: on laptops it fills the right of the hero and fades into the ground under the text. */}
      <div className="landing-map pointer-events-none relative order-last h-[340px] md:absolute md:inset-y-0 md:right-0 md:left-[30%] md:h-auto">
        <div className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_80%,transparent)] md:[mask-image:linear-gradient(to_right,transparent,black_30%),linear-gradient(to_bottom,black_75%,transparent)] md:[mask-composite:intersect]">
          <Image
            src="/landing/zahle-map-2400.webp"
            alt=""
            width={mapSize.width}
            height={mapSize.height}
            priority
            sizes="(min-width: 768px) 70vw, 100vw"
            className="h-full w-full object-cover object-[52%_52%]"
          />
        </div>
        {/* Required credit for the picture's map data and terrain, kept on the picture itself. */}
        <p className="pointer-events-auto absolute right-4 bottom-3 text-[12px] leading-4 text-muted sm:right-8 md:bottom-[22%]">
          {T.mapCredit}
        </p>
      </div>

      <div className="relative mx-auto flex max-w-[1200px] flex-col px-4 pt-5 sm:px-8 md:min-h-[inherit] md:pt-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Zahle on Record"
            className="-m-1 rounded-control p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span data-ribbon="logo" className="block">
              <Logo className="h-[72px] sm:h-24" title={null} />
            </span>
          </Link>
          <LinkButton href="/login" className="relative z-[2]">
            {T.signIn}
          </LinkButton>
        </div>

        <div data-ribbon="text" className="max-w-[560px] pt-20 pb-12 md:my-auto md:pt-16 md:pb-28">
          <p className="landing-fade micro-label">{T.place}</p>
          <h1
            className="landing-rise mt-4 font-serif text-[40px]/[44px] font-medium tracking-[-0.015em] text-balance text-ink sm:text-hero"
            style={{ animationDelay: "40ms" }}
          >
            {T.headline}
          </h1>
          <p className="landing-rise mt-6 max-w-[31rem] text-lead text-muted" style={{ animationDelay: "140ms" }}>
            {T.problem}
          </p>
        </div>
      </div>
    </header>
  );
}

function Showcase() {
  return (
    <section aria-labelledby="showcase-title" className="mx-auto max-w-[1200px] px-4 pt-16 pb-20 sm:px-8 md:pt-24">
      <div data-ribbon="text" className="max-w-[640px]">
        <p className="micro-label">{T.showcase.label}</p>
        <h2 id="showcase-title" className="mt-3 font-serif text-heading font-medium tracking-[-0.01em] text-ink sm:text-display">
          {T.showcase.title}
        </h2>
      </div>
      {/* The pictures sit above the ribbon: it passes behind them. */}
      <div data-ribbon="cards" className="relative z-[2]">
        <div className="mt-10 md:mt-14">
          <ProductShot />
        </div>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line md:mt-16 md:grid-cols-3">
          {T.showcase.points.map((p) => (
            <li key={p.label} className="bg-surface px-5 py-5">
              <p className="micro-label">{p.label}</p>
              <p className="mt-2 text-body text-ink">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function About() {
  return (
    <section aria-labelledby="about-title" className="border-t border-line">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-16 sm:px-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-24 md:py-24">
        <div data-ribbon="about-title">
          <p className="micro-label">{T.about.label}</p>
          <h2 id="about-title" className="mt-3 font-serif text-heading font-medium tracking-[-0.01em] text-ink sm:text-display">
            {T.about.title}
          </h2>
        </div>
        <div data-ribbon="about-body" className="max-w-[36rem] space-y-4">
          {T.about.body.map((p) => (
            <p key={p} className="text-lead text-muted first:text-ink">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The logo only. Its Arabic waits fainter until the ribbon ties back into the ز (Ribbon.tsx). */
function Footer() {
  return (
    <footer className="mx-auto max-w-[1200px] px-4 pt-10 pb-[max(4rem,env(safe-area-inset-bottom))] sm:px-8 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-24 md:pt-12 md:pb-20">
      <div className="md:col-start-2">
        <span data-ribbon="footer-logo" className="inline-block">
          <Logo cut="footer" className="h-[72px] sm:h-24" arabicClassName="ribbon-footer-arabic" />
        </span>
      </div>
    </footer>
  );
}
