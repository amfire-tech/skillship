/*
 * File:    frontend/src/components/home/CareerRoadmap.tsx
 * Purpose: Second Career Pilot feature section. The first CareerPilot
 *          section ("It listens / maps / guides / grows") explains how the
 *          agent BEHAVES. This section explains what the student actually
 *          GETS — interest detection → best-fit career → personalised
 *          roadmap, all in one continuous animated pipeline.
 *
 *          Layout: split — visual pipeline on the left, supporting copy
 *          + three feature points on the right. The visual is one tall
 *          card containing three stacked stages connected by arrows;
 *          each stage runs its own continuous loop so the whole pipeline
 *          always reads as "live."
 *
 *          Animations are CSS-keyframe driven (declared in globals.css
 *          under the `cr-*` prefix) so they run on the GPU and don't
 *          depend on React state.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  User, Bot, Code2, Atom, Rocket, Palette, Music,
  Target, Map, CheckCircle2, Sparkles, ArrowRight,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ─────────────── Stage 1 · Interest detection ─────────────── */

interface InterestPill {
  label: string;
  icon: LucideIcon;
  color: string;
  /** Position around the avatar — angle in degrees, distance in % radius. */
  angle: number;
  distance: number;
  delay: number;
}

const INTERESTS: InterestPill[] = [
  { label: "Robotics", icon: Bot,     color: "var(--orange-500)", angle: -90,  distance: 92, delay: 0.0 },
  { label: "Coding",   icon: Code2,   color: "var(--teal-500)",   angle: -30,  distance: 92, delay: 0.4 },
  { label: "Science",  icon: Atom,    color: "var(--green-accent)", angle: 30,   distance: 92, delay: 0.8 },
  { label: "Space",    icon: Rocket,  color: "var(--orange-600)", angle: 90,   distance: 92, delay: 1.2 },
  { label: "Art",      icon: Palette, color: "var(--orange-400)", angle: 150,  distance: 92, delay: 1.6 },
  { label: "Music",    icon: Music,   color: "var(--teal-400)",   angle: 210,  distance: 92, delay: 2.0 },
];

function Phase1Interests() {
  return (
    <div className="relative">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]">
        Step 01 · Detecting interests
      </p>

      <div className="relative mt-4 h-[180px]">
        {/* Detection rings emanating from the avatar */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border-2 border-[var(--teal-500)]"
            style={{
              animation: "cr-detect-ring 3s ease-out infinite",
              animationDelay: `${i * 1}s`,
            }}
          />
        ))}

        {/* Central student avatar */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative grid h-14 w-14 place-items-center rounded-full text-white shadow-cool"
            style={{ backgroundImage: "var(--gradient-cool)" }}>
            <User size={22} strokeWidth={1.8} />
          </div>
        </div>

        {/* Orbiting interest pills */}
        {INTERESTS.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const x = Math.cos(rad) * (p.distance / 2);
          const y = Math.sin(rad) * (p.distance / 2);
          const Icon = p.icon;
          return (
            <div
              key={p.label}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
            >
              <div
                className="flex items-center gap-1.5 rounded-full border border-[color:var(--border-subtle)] bg-white px-2.5 py-1 shadow-soft"
                style={{
                  animation: "cr-pill-tag 4s ease-in-out infinite",
                  animationDelay: `${p.delay}s`,
                }}
              >
                <span
                  className="grid h-4 w-4 place-items-center rounded-full text-white"
                  style={{ backgroundColor: p.color }}
                >
                  <Icon size={9} strokeWidth={2.4} />
                </span>
                <span className="text-[10.5px] font-semibold text-[var(--ink-primary)]">
                  {p.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── Connector arrow between phases ─────────────── */

function PhaseConnector() {
  return (
    <div className="my-3 flex flex-col items-center" aria-hidden>
      <span className="h-3 w-px bg-[color:var(--border-subtle)]" />
      <span
        className="grid h-6 w-6 place-items-center rounded-full bg-white text-[var(--teal-600)] shadow-soft"
        style={{ animation: "cr-arrow-bounce 1.8s ease-in-out infinite" }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
        </svg>
      </span>
      <span className="h-3 w-px bg-[color:var(--border-subtle)]" />
    </div>
  );
}

/* ─────────────── Stage 2 · Career match ─────────────── *
 * Three "best match" career cards stacked at the same position. Each
 * runs the cr-career-cycle keyframe on a 10s loop with staggered
 * delays (0s · -3.33s · -6.66s) so they hand off visibility in turn:
 * Aerospace Engineer → Game Designer → Data Scientist → repeat.
 * The progress bar inside each card fills to that career's specific
 * % fit using a CSS custom property (--target). */

interface CareerMatch {
  career: string;
  pct: number;
  why: string;
  secondary: { career: string; pct: number }[];
  delay: string;
}

const CAREER_MATCHES: CareerMatch[] = [
  {
    career: "Aerospace Engineer",
    pct: 92,
    why: "Strong in Math · Physics · Robotics",
    secondary: [
      { career: "Robotics Engineer", pct: 84 },
      { career: "AI Researcher",     pct: 79 },
    ],
    delay: "0s",
  },
  {
    career: "Game Designer",
    pct: 88,
    why: "Strong in Art · Coding · Storytelling",
    secondary: [
      { career: "UI/UX Designer", pct: 81 },
      { career: "Animator",       pct: 76 },
    ],
    delay: "-3.33s",
  },
  {
    career: "Data Scientist",
    pct: 86,
    why: "Strong in Math · Stats · Coding",
    secondary: [
      { career: "AI Engineer",     pct: 80 },
      { career: "Quant Analyst",   pct: 74 },
    ],
    delay: "-6.66s",
  },
];

function MatchCard({ m }: { m: CareerMatch }) {
  return (
    <div
      className="absolute inset-x-0 top-0"
      style={{ animation: "cr-career-cycle 10s ease-in-out infinite", animationDelay: m.delay }}
    >
      {/* Top match — large card */}
      <div className="rounded-2xl border border-[var(--orange-500)]/30 bg-[var(--card)] p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-white"
              style={{ backgroundImage: "var(--gradient-warmth)" }}
            >
              <Target size={17} strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--orange-600)]">
                Best Match
              </p>
              <p className="text-[14.5px] font-semibold leading-[1.2] text-[var(--ink-primary)]">
                {m.career}
              </p>
            </div>
          </div>
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white"
            style={{
              backgroundImage: "var(--gradient-warmth)",
              animation: "cr-pct-pop 10s ease-out infinite",
              animationDelay: m.delay,
            }}
          >
            {m.pct}% fit
          </span>
        </div>

        {/* Progress bar — synced to the card's visibility window */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--cream)]">
          <span
            className="block h-full rounded-full"
            style={{
              ["--target" as string]: `${m.pct}%`,
              backgroundImage: "var(--gradient-warmth)",
              animation: "cr-bar-fill 10s cubic-bezier(0.16,1,0.3,1) infinite",
              animationDelay: m.delay,
            } as React.CSSProperties}
          />
        </div>

        <p className="mt-2.5 text-[11.5px] text-[var(--ink-secondary)]">
          {m.why}
        </p>
      </div>

      {/* Secondary matches for this career */}
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {m.secondary.map((s) => (
          <div
            key={s.career}
            className="rounded-xl border border-[color:var(--border-subtle)] bg-[var(--card)]/80 px-3 py-2"
          >
            <p className="text-[11px] font-semibold text-[var(--ink-primary)]">{s.career}</p>
            <p className="text-[10px] text-[var(--ink-tertiary)]">{s.pct}% fit</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Phase2Match() {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--orange-500)]">
        Step 02 · Matching careers
      </p>

      {/* Stack of 3 cards — visibility cycles through them forever.
         The min-h reserves enough room for the tallest card so the
         layout below (the connector + roadmap) doesn't jump. */}
      <div className="relative mt-4 min-h-[170px]">
        {CAREER_MATCHES.map((m) => (
          <MatchCard key={m.career} m={m} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Stage 3 · Roadmap ─────────────── */

interface Milestone {
  stage: string;
  title: string;
  desc: string;
}

const MILESTONES: Milestone[] = [
  { stage: "Grade 8",   title: "Foundations",      desc: "Math · Physics · Coding basics" },
  { stage: "Grade 10",  title: "Specialization",   desc: "Robotics + Aerodynamics labs" },
  { stage: "Grade 12",  title: "Build portfolio",  desc: "Drone project + internship" },
  { stage: "Beyond",    title: "Career launch",    desc: "Engineering college + first role" },
];

function Phase3Roadmap() {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--green-accent)]">
        Step 03 · Personal roadmap
      </p>

      <div className="relative mt-4 pl-7">
        {/* Vertical spine */}
        <span
          aria-hidden
          className="absolute left-2.5 top-2 bottom-2 w-0.5 rounded-full"
          style={{ backgroundImage: "linear-gradient(to bottom, var(--teal-500), var(--orange-500))" }}
        />

        {MILESTONES.map((m, i) => (
          <div
            key={m.title}
            className="relative mb-3 last:mb-0 rounded-xl border border-[color:var(--border-subtle)] bg-white px-3.5 py-2.5"
            style={{
              animation: `cr-milestone-light 8s ease-in-out infinite`,
              animationDelay: `${i * 2}s`,
            }}
          >
            {/* Milestone node on the spine */}
            <span
              aria-hidden
              className="absolute -left-[18px] top-3.5 grid h-5 w-5 place-items-center rounded-full bg-white shadow-soft cr-node"
              style={{ animationDelay: `${i * 2}s` }}
            >
              <span className="cr-node-check">
                <CheckCircle2 size={14} strokeWidth={2.2} className="text-[var(--green-accent)]" />
              </span>
              <span className="cr-node-dot h-1.5 w-1.5 rounded-full bg-[var(--ink-tertiary)]" />
            </span>

            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[12.5px] font-semibold leading-[1.2] text-[var(--ink-primary)]">
                {m.title}
              </p>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-tertiary)]">
                {m.stage}
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] leading-[1.45] text-[var(--ink-secondary)]">
              {m.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Visual pipeline (left column) ─────────────── */

function VisualPipeline() {
  return (
    <div
      className="relative overflow-hidden rounded-[32px] border border-[color:var(--border-subtle)] bg-[var(--cream-soft)] p-6 shadow-medium md:p-8"
    >
      {/* Soft brand-tinted ambient glow in the background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ backgroundImage: "var(--gradient-warmth)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ backgroundImage: "var(--gradient-cool)" }}
      />

      <div className="relative">
        <Phase1Interests />
        <PhaseConnector />
        <Phase2Match />
        <PhaseConnector />
        <Phase3Roadmap />
      </div>
    </div>
  );
}

/* ─────────────── Main section ─────────────── */

interface FeaturePoint {
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: string;
}

const FEATURES: FeaturePoint[] = [
  {
    icon: Sparkles,
    title: "It detects every interest",
    desc: "Every quiz answer, every content view, every project submission becomes a signal. Career Pilot builds a profile no two students share.",
    accent: "var(--teal-500)",
  },
  {
    icon: Target,
    title: "It matches careers by fit",
    desc: "Surface the top 3 careers ranked by personal fit — from Aerospace Engineer to AI Researcher to Game Designer.",
    accent: "var(--orange-500)",
  },
  {
    icon: Map,
    title: "It draws the roadmap",
    desc: "A milestone-by-milestone plan from today's class to the chosen career — adapting as the student grows.",
    accent: "var(--green-accent)",
  },
];

export function CareerRoadmap() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Header */}
        <div className="mx-auto max-w-[820px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
          >
            For students · Career Pilot in action
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
          >
            Find your{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-warmth)" }}
            >
              career
            </span>
            .<br />
            Build the{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-cool)" }}
            >
              roadmap
            </span>{" "}
            to get there.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
            className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.6] text-[var(--ink-secondary)] md:text-[18px]"
          >
            Career Pilot watches how a student learns, identifies their
            strengths, and turns them into a step-by-step plan — from
            today&apos;s classroom to the career they&apos;re actually built for.
          </motion.p>
        </div>

        {/* Visual + supporting copy. items-center vertically centres
           the shorter right column against the taller left pipeline,
           so the leftover whitespace splits evenly above and below the
           right column instead of being pumped into big gaps between
           its elements (the previous justify-between approach made
           the column look hollow at common viewport sizes). */}
        <div className="mt-16 grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Visual pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="lg:col-span-6"
          >
            <VisualPipeline />
          </motion.div>

          {/* Right column — natural-height stack of three groups:
             three feature points → mini stats strip → CTA. Tight
             gap-8 spacing so the column reads compact, not spread. */}
          <div className="flex flex-col gap-8 lg:col-span-6">
            <ul className="space-y-7">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.li
                    key={f.title}
                    initial={{ opacity: 0, y: 18 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.12, ease: EASE }}
                    className="flex items-start gap-4"
                  >
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-soft"
                      style={{ background: "var(--cream)", color: f.accent }}
                    >
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <div>
                      <h3 className="text-[17px] font-semibold leading-[1.25] tracking-[-0.015em] text-[var(--ink-primary)]">
                        {f.title}
                      </h3>
                      <p className="mt-1.5 text-[14.5px] leading-[1.6] text-[var(--ink-secondary)]">
                        {f.desc}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            {/* Mini stats strip — adds vertical weight + concrete proof */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.75, ease: EASE }}
              className="grid grid-cols-3 gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--cream-soft)] p-4"
            >
              {[
                { v: "1,400+",  l: "Career paths" },
                { v: "12+",     l: "Skill domains" },
                { v: "24/7",    l: "Continuous re-plan" },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <p
                    className="bg-clip-text text-[20px] font-semibold tracking-[-0.02em] text-transparent md:text-[22px]"
                    style={{ backgroundImage: "var(--gradient-brand)" }}
                  >
                    {s.v}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--ink-tertiary)]">
                    {s.l}
                  </p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
              className="flex flex-wrap items-center gap-4"
            >
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white shadow-warm transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(243,156,50,0.32)]"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                Try Career Pilot
                <ArrowRight size={14} strokeWidth={2.2} />
              </a>
              <p className="text-[13px] text-[var(--ink-tertiary)]">
                Built into every student dashboard
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
