"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import mapSize from "@/lib/landing-map.json";
import { FLIGHT } from "@/lib/landing-content";

/**
 * The landing page's moving parts (plan.md item 28). Each one reads scroll
 * position in a requestAnimationFrame and writes CSS variables; the look is in
 * landing.css. Under reduced motion every part renders still and complete.
 */

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Calls `fn` once per frame while the page scrolls, and once on mount. */
function useScrollFrame(fn: () => void) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    if (reduced()) return;
    let raf = 0;
    const tick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ref.current());
    };
    tick();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
    };
  }, []);
}

/** Lenis smooth scrolling for the landing page only. */
export function SmoothScroll() {
  useEffect(() => {
    if (reduced()) return;
    let raf = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let gone = false;
    import("lenis").then(({ default: Lenis }) => {
      if (gone) return;
      lenis = new Lenis({ lerp: 0.1 });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      gone = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);
  return null;
}

/** The giant faint زحلة behind the hero: it rises and grows as the hero scrolls away. */
export function HeroArabic() {
  const el = useRef<HTMLDivElement>(null);
  useScrollFrame(() => {
    const p = clamp(window.scrollY / window.innerHeight);
    el.current?.style.setProperty("--p", String(p));
  });
  return (
    <div ref={el} className="lp-hero-ar" aria-hidden="true">
      <span>زحلة</span>
    </div>
  );
}

/**
 * Template A's map that opens to full width, then template C's camera flight
 * from the valley down to one building. Captions change on the way.
 */
export function CityFlight() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useScrollFrame(() => {
    const t = track.current;
    const s = stage.current;
    if (!t || !s) return;
    const r = t.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - window.innerHeight));
    // 0 to 0.28: the frame opens. 0.28 to 1: the camera flies in.
    const open = easeOut(clamp(p / 0.28));
    const fly = easeInOut(clamp((p - 0.28) / 0.72));
    s.style.setProperty("--inset-y", `${lerp(9, 0, open)}%`);
    s.style.setProperty("--inset-x", `${lerp(6, 0, open)}%`);
    s.style.setProperty("--radius", `${lerp(28, 0, open)}px`);
    s.style.setProperty("--zoom", String(lerp(1.18, 1, open) * lerp(1, 4.2, fly)));
    s.style.setProperty("--wash", String(lerp(0.55, 0, clamp(fly * 2)) + lerp(0, 0.35, clamp((p - 0.9) / 0.1))));
    s.style.setProperty("--marker", String(clamp((fly - 0.75) / 0.2)));
    let i = 0;
    FLIGHT.forEach((f, k) => {
      if (p >= f.at) i = k;
    });
    setStep((prev) => (prev === i ? prev : i));
  });

  return (
    <div ref={track} className="lp-flight">
      <div ref={stage} className="lp-flight-stage">
        <div className="lp-flight-frame">
          <div className="lp-flight-world">
            <Image
              src="/landing/zahle-map-2400.webp"
              alt="Map of Zahle: the Berdawni valley and its buildings"
              width={mapSize.width}
              height={mapSize.height}
              sizes="100vw"
              className="lp-flight-img"
            />
          </div>
          <div className="lp-flight-wash" />
          <div className="lp-flight-marker" aria-hidden="true" />
        </div>
        <div className="lp-flight-caps" aria-live="polite">
          {FLIGHT.map((f, k) => (
            <div key={f.label} className="lp-flight-cap" data-on={k === step || undefined}>
              <span className="lp-label">{f.label}</span>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A statement whose words light up one by one as it scrolls past. */
export function LightWords({ text, className = "" }: { text: string; className?: string }) {
  const el = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");
  const [lit, setLit] = useState(words.length);
  useScrollFrame(() => {
    const e = el.current;
    if (!e) return;
    const r = e.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
    const n = Math.round(p * words.length);
    setLit((prev) => (prev === n ? prev : n));
  });
  return (
    <p ref={el} className={`lp-light ${className}`}>
      {words.map((w, i) => (
        <span key={i} data-on={i < lit || undefined}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}

/** Fades and lifts its content in, once, when it comes into view. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const e = el.current;
    // Under reduced motion the CSS shows it at once (landing.css).
    if (!e || reduced()) return;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(e);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={el} className={`lp-reveal ${className}`} data-seen={seen || undefined} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** A number that counts up once, when it comes into view. */
export function CountUp({ to }: { to: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    const e = el.current;
    if (!e || reduced() || to === 0) return;
    setV(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const k = clamp((t - t0) / 1400);
          setV(Math.round(to * (1 - Math.pow(1 - k, 4))));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(e);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <span ref={el} className="tabular">
      {v.toLocaleString("en")}
    </span>
  );
}
