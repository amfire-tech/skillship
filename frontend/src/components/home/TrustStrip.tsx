/*
 * File:    frontend/src/components/home/TrustStrip.tsx
 * Purpose: Thin trust band beneath the hero (skillship_homepage_brief.md §3).
 *          Four real numbers count up from 0 on scroll-into-view, 1.8s,
 *          ease-out-expo, 150ms stagger between stats.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface Stat {
  /** Final numeric value the counter animates to. */
  to: number;
  /** Visual suffix appended after the number (e.g. "+", "k+"). */
  suffix: string;
  /** Caption underneath. */
  label: string;
  /** Format helper — used so 10,000 renders with the thousands separator. */
  format?: (n: number) => string;
}

// Numbers sourced from the AI School Program catalogue (page 8 — "Our Impact in
// Numbers"). Keep these in sync with whatever the client publishes externally.
const STATS: Stat[] = [
  { to: 100,   suffix: "+", label: "Schools collaborated" },
  { to: 50000, suffix: "+", label: "Students empowered", format: (n) => n.toLocaleString("en-IN") },
  { to: 12,    suffix: "+", label: "Industry-relevant courses" },
  { to: 8,     suffix: "",  label: "Advanced technology labs" },
];

// ease-out-expo as a function — matches the CSS curve used elsewhere.
function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Counter — animates 0 → value over `duration` ms when `start` flips true.
 * Respects prefers-reduced-motion by snapping straight to the final value.
 */
function Counter({ value, format, durationMs, delayMs, start }: {
  value: number;
  format?: (n: number) => string;
  durationMs: number;
  delayMs: number;
  start: boolean;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!start) return;

    const reduceMotion = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) { setN(value); return; }

    let frame = 0;
    let started = 0;
    const startAt = performance.now() + delayMs;

    function tick(now: number) {
      if (now < startAt) { frame = requestAnimationFrame(tick); return; }
      if (!started) started = now;
      const t = Math.min(1, (now - started) / durationMs);
      setN(Math.round(easeOutExpo(t) * value));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, value, durationMs, delayMs]);

  return <>{format ? format(n) : n}</>;
}

export function TrustStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section className="bg-[var(--cream-soft)]">
      <div
        ref={ref}
        className="mx-auto grid max-w-[1280px] grid-cols-2 gap-y-10 px-6 py-20 md:grid-cols-4 md:gap-y-0 md:divide-x md:divide-[color:var(--border-subtle)] lg:px-12"
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="flex flex-col items-center justify-center text-center md:px-6"
          >
            <p className="font-semibold tracking-[-0.02em] text-[var(--ink-primary)]"
               style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
              <Counter
                value={s.to}
                format={s.format}
                durationMs={1800}
                delayMs={i * 150}
                start={inView}
              />
              <span className="ml-0.5 bg-clip-text text-transparent"
                    style={{ backgroundImage: "var(--gradient-brand)" }}>
                {s.suffix}
              </span>
            </p>
            <p className="mt-1.5 text-[13px] font-medium text-[var(--ink-secondary)]">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
