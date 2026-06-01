/*
 * File:    frontend/src/components/home/PricingAnchor.tsx
 * Purpose: The headline pricing moment. Sits just above FinalCTA so the
 *          principal walks into the closer with the number already in
 *          their head: ₹100 per student / month for the whole AI School
 *          Program — labs, training, software.
 *
 *          Per-course pricing has been removed from every public surface
 *          (homepage marketplace, /marketplace catalog, featured strip)
 *          for the same reason: the right number for the buyer is the
 *          per-student-per-month rate, not a per-workshop fee.
 *
 *          Design intent: a single huge ₹100 with a small "per student
 *          / month" caption, a one-line value-prop, four inclusion
 *          chips (what's covered for that price), and a CTA that
 *          matches the one in FinalCTA so the offer is unmistakable.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const INCLUSIONS = [
  "8 Labs installed on campus",
  "Teacher training + 24×7 support",
  "Code4AI + AI Career Copilot",
  "All courses · all grades · zero add-ons",
];

export function PricingAnchor() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-[var(--cream-soft)]">
      {/* Soft brand-tinted ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
        style={{ backgroundImage: "var(--gradient-warmth)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
        style={{ backgroundImage: "var(--gradient-cool)" }}
      />

      <div className="relative mx-auto max-w-[1280px] px-6 py-28 text-center md:py-36 lg:px-12">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-white/90 px-3.5 py-1.5 backdrop-blur-sm"
        >
          <Sparkles size={12} strokeWidth={2.4} className="text-[var(--orange-500)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-secondary)]">
            School-priced. School-simple.
          </span>
        </motion.div>

        {/* The headline price — single huge number with "Starts at"
           prefix so the buyer reads it as the entry point of a range
           (which is the truth — larger schools negotiate down further). */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="mt-8 flex flex-col items-center"
        >
          {/* "Starts at" kicker, sets up the number below */}
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-[var(--ink-secondary)] md:text-[14px]">
            Starts at
          </p>

          <div className="mt-3 flex items-start justify-center gap-2 md:gap-3">
            <span
              className="font-semibold leading-none tracking-[-0.04em] bg-clip-text text-transparent animate-brand-shift bg-[length:200%_100%]"
              style={{
                backgroundImage: "var(--gradient-brand)",
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                marginTop: "0.7em",
              }}
            >
              ₹
            </span>
            <span
              className="font-semibold leading-[0.95] tracking-[-0.05em] bg-clip-text text-transparent animate-brand-shift bg-[length:200%_100%]"
              style={{
                backgroundImage: "var(--gradient-brand)",
                fontSize: "clamp(6rem, 16vw, 12rem)",
              }}
            >
              100
            </span>
            <span
              className="self-end font-semibold leading-none tracking-[-0.02em] text-[var(--ink-tertiary)]"
              style={{
                fontSize: "clamp(1rem, 1.6vw, 1.35rem)",
                marginBottom: "0.6em",
              }}
            >
              /month
            </span>
          </div>
          <p
            className="mt-3 font-semibold tracking-[-0.01em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)" }}
          >
            per student
          </p>
        </motion.div>

        {/* One-line value prop */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
          className="mx-auto mt-8 max-w-[680px] text-[18px] leading-[1.55] text-[var(--ink-secondary)] md:text-[20px]"
        >
          Everything you&apos;ve seen on this page —{" "}
          <span className="font-semibold text-[var(--ink-primary)]">labs, teacher training, and AI software</span>{" "}
          — for the cost of a school textbook.
        </motion.p>

        {/* Inclusion chips */}
        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          className="mx-auto mt-10 flex max-w-[840px] flex-wrap items-center justify-center gap-2.5"
        >
          {INCLUSIONS.map((line) => (
            <li
              key={line}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--ink-primary)] shadow-soft"
            >
              <CheckCircle2 size={14} strokeWidth={2.2} className="text-[var(--green-accent)]" />
              {line}
            </li>
          ))}
        </motion.ul>

        {/* CTA — identical to the one in FinalCTA so they read as one offer */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
          className="mt-12 flex flex-col items-center gap-3"
        >
          <Link
            href="/request-demo"
            className="cta-sun inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold text-white shadow-warm transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            <span className="relative z-10">Book a school visit</span>
            <ArrowRight size={15} strokeWidth={2.2} className="relative z-10" />
          </Link>
          <p className="text-[12.5px] text-[var(--ink-tertiary)]">
            No setup fee · No per-lab pricing · No surprise add-ons
          </p>
        </motion.div>
      </div>
    </section>
  );
}
