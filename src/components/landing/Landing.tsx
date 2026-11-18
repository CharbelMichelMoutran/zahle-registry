import Image from "next/image";
import Link from "next/link";
import { LANDING as T } from "@/lib/content";
import mapSize from "@/lib/landing-map.json";
import { LinkButton } from "../ui/LinkButton";
import { Wordmark } from "../ui/Wordmark";
import { ProductShot } from "./ProductShot";

const ENGINEER_LOGIN = "/login?as=engineer";
const RESIDENT_LOGIN = "/login?as=resident";

/**
 * The public landing page (plan.md item 23, DESIGN.md 13 and 14.9 item 9).
 * Shown at / to signed-out visitors (src/proxy.ts). A static page: it makes no
 * database or API call, and its map is a flat picture drawn from open
 * OpenStreetMap outlines by scripts/render-landing-map.ts, every footprint grey.
 */
export default function Landing() {
  return (
    <div className="overflow-x-clip bg-ground text-ink">
      <Hero />
      <Showcase />
      <About />
      <Footer />
    </div>
  );
}

function SignInButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 min-[480px]:flex-row ${className}`}>
      <LinkButton href={ENGINEER_LOGIN}>{T.signInEngineer}</LinkButton>
      <LinkButton href={RESIDENT_LOGIN} variant="secondary">
        {T.signInResident}
      </LinkButton>
    </div>
  );
}

function Hero() {
  return (
    <header className="relative isolate flex flex-col md:block md:min-h-[min(100svh,820px)]">
      {/* The map: on laptops it fills the right of the hero and fades into the limestone under the text. */}
      <div
        className="landing-map pointer-events-none order-last h-[340px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_80%,transparent)] md:absolute md:inset-y-0 md:right-0 md:left-[30%] md:h-auto md:[mask-image:linear-gradient(to_right,transparent,black_30%),linear-gradient(to_bottom,black_75%,transparent)] md:[mask-composite:intersect]"
      >
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

      <div className="relative mx-auto flex max-w-[1200px] flex-col px-4 pt-6 sm:px-8 md:min-h-[inherit] md:pt-8">
        <div className="flex items-start justify-between gap-4">
          <Link href="/" aria-label="Zahle Building Registry" className="rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
            <Wordmark />
          </Link>
          <Link
            href="/login"
            className="mt-1 inline-flex min-h-11 items-center px-2 text-body font-medium text-accent underline-offset-4 hover:underline"
          >
            {T.logIn}
          </Link>
        </div>

        <div className="max-w-[560px] pt-14 pb-10 md:my-auto md:pt-16 md:pb-28">
          <p className="landing-rise micro-label" style={{ animationDelay: "0ms" }}>
            {T.place}
          </p>
          <h1
            className="landing-rise mt-4 font-serif text-[40px]/[44px] font-medium tracking-[-0.01em] text-balance text-ink sm:text-hero"
            style={{ animationDelay: "60ms" }}
          >
            {T.headline}
          </h1>
          <p className="landing-rise mt-5 max-w-[30rem] text-lead text-muted" style={{ animationDelay: "120ms" }}>
            {T.problem}
          </p>
          <div className="landing-rise mt-8" style={{ animationDelay: "180ms" }}>
            <SignInButtons />
          </div>
        </div>
      </div>
    </header>
  );
}

function Showcase() {
  return (
    <section aria-labelledby="showcase-title" className="mx-auto max-w-[1200px] px-4 pt-16 pb-20 sm:px-8 md:pt-24">
      <div className="max-w-[640px]">
        <p className="micro-label">{T.showcase.label}</p>
        <h2 id="showcase-title" className="mt-3 font-serif text-heading font-medium text-ink sm:text-display">
          {T.showcase.title}
        </h2>
      </div>
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
    </section>
  );
}

function About() {
  return (
    <section aria-labelledby="about-title" className="border-t border-dashed border-line">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-16 sm:px-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:py-24">
        <div>
          <p className="micro-label">{T.about.label}</p>
          <h2 id="about-title" className="mt-3 font-serif text-heading font-medium text-ink sm:text-display">
            {T.about.title}
          </h2>
        </div>
        <div className="max-w-[36rem] space-y-4">
          {T.about.body.map((p) => (
            <p key={p} className="text-lead text-muted first:text-ink">
              {p}
            </p>
          ))}
          <div className="border-t border-dashed border-line pt-8">
            <p className="text-lead font-medium text-ink">{T.closing}</p>
            <SignInButtons className="mt-4" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <Wordmark size="small" />
          <p className="text-body text-muted">{T.footer.line}</p>
          <p className="text-body text-muted">{T.footer.credit}</p>
        </div>
        <p className="text-micro text-muted md:max-w-[22rem] md:text-right">{T.footer.attribution}</p>
      </div>
    </footer>
  );
}
