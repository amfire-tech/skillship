/*
 * File:    frontend/src/components/home/Hero.tsx
 * Purpose: Public homepage hero. Rebuilt per Skillship catalogue refresh —
 *          the right-side visual is no longer a dashboard mockup (which made
 *          the pitch read as "we have a quiz feature"). Instead it's an
 *          animated "AI School" emblem: a school building at the centre,
 *          four orbital lab/service nodes floating around it, and pulsing
 *          dotted lines connecting them — so the eye reads "infrastructure
 *          + training + software transforming a school" in the first second.
 *
 *          Layout intent: the section is exactly one viewport tall (minus
 *          the sticky navbar) using min-h with svh units, vertically
 *          centred, so the user never has to scroll to see the full hero.
 *
 *          Word-safe StaggeredLine: previously split per-character which
 *          let long words wrap mid-glyph ("soft" / "ware."). Now splits
 *          per-word; each word is a non-breaking inline-block whose
 *          characters animate in stagger.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Bot, Boxes, Plane, GraduationCap, Sparkles } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

// Word-safe character stagger. Splits the string by spaces, then animates
// each character inside the word — the word itself is an inline-block so
// it never breaks across lines mid-letter.
function StaggeredLine({
  text,
  delay,
  gradient = false,
  className = "",
}: {
  text: string;
  delay: number;
  gradient?: boolean;
  className?: string;
}) {
  const words = text.split(" ");
  let charIndex = 0;
  return (
    <span className={`inline-block overflow-hidden align-bottom ${className}`}>
      {words.map((word, wi) => (
        <span
          key={wi}
          // Each word is a non-breaking unit. Margin-right gives the space
          // back so words still flow naturally with the wrap.
          className="inline-block whitespace-nowrap"
          style={{ marginRight: wi === words.length - 1 ? 0 : "0.28em" }}
        >
          {word.split("").map((ch) => {
            const i = charIndex++;
            return (
              <motion.span
                key={i}
                aria-hidden="true"
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%",   opacity: 1 }}
                transition={{ duration: 0.85, ease: EASE, delay: delay + i * 0.022 }}
                className={`inline-block ${
                  gradient
                    ? "bg-clip-text text-transparent animate-brand-shift bg-[length:200%_100%]"
                    : ""
                }`}
                style={
                  gradient
                    ? { backgroundImage: "var(--gradient-brand)" }
                    : undefined
                }
              >
                {ch}
              </motion.span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

// Soft drifting brand-tinted background blobs for the dawn surface.
function AmbientShapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[var(--orange-500)] opacity-[0.09] blur-3xl animate-hero-drift" style={{ animationDuration: "11s" }} />
      <div className="absolute right-[-6rem] top-[40%] h-80 w-80 rounded-full bg-[var(--teal-500)] opacity-[0.08] blur-3xl animate-hero-drift" style={{ animationDuration: "13s", animationDelay: "1.5s" }} />
      <div className="absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-[var(--orange-400)] opacity-[0.10] blur-2xl animate-hero-drift" style={{ animationDuration: "9s", animationDelay: "0.8s" }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * AI School emblem — the new hero visual.
 * Centre = stylised school building (SVG line-art, brand-gradient stroke).
 * Around it = four orbital lab/service nodes with icons.
 * Between them = pulsing dotted connection lines (CSS, GPU-friendly).
 * ───────────────────────────────────────────────────────────────────── */

function SchoolBuilding() {
  return (
    <motion.svg
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, delay: 0.9, ease: EASE }}
      viewBox="0 0 220 180"
      className="relative h-full w-full drop-shadow-[0_8px_24px_rgba(243,156,50,0.18)]"
    >
      <defs>
        <linearGradient id="schoolStroke" x1="0" y1="0" x2="220" y2="180">
          <stop offset="0%"  stopColor="#F39C32" />
          <stop offset="100%" stopColor="#2EB6B5" />
        </linearGradient>
        <linearGradient id="schoolFill" x1="0" y1="0" x2="0" y2="180">
          <stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FAF4E6" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* base footing */}
      <rect x="20" y="148" width="180" height="6" rx="2" fill="url(#schoolFill)" stroke="url(#schoolStroke)" strokeWidth="1.5" />

      {/* left wing */}
      <rect x="28" y="86" width="68" height="62" fill="url(#schoolFill)" stroke="url(#schoolStroke)" strokeWidth="1.6" />
      {/* right wing */}
      <rect x="124" y="86" width="68" height="62" fill="url(#schoolFill)" stroke="url(#schoolStroke)" strokeWidth="1.6" />

      {/* central tower */}
      <rect x="92" y="48" width="36" height="100" fill="url(#schoolFill)" stroke="url(#schoolStroke)" strokeWidth="1.6" />
      {/* tower roof */}
      <polygon points="92,48 110,28 128,48" fill="url(#schoolFill)" stroke="url(#schoolStroke)" strokeWidth="1.6" />
      {/* flag pole */}
      <line x1="110" y1="28" x2="110" y2="14" stroke="url(#schoolStroke)" strokeWidth="1.4" strokeLinecap="round" />
      {/* flag */}
      <polygon points="110,14 122,18 110,22" fill="url(#schoolStroke)" />

      {/* tower clock */}
      <circle cx="110" cy="74" r="9" fill="#FFFFFF" stroke="url(#schoolStroke)" strokeWidth="1.4" />
      <line x1="110" y1="74" x2="110" y2="68" stroke="#0F1419" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="110" y1="74" x2="114" y2="76" stroke="#0F1419" strokeWidth="1.2" strokeLinecap="round" />

      {/* central door */}
      <rect x="102" y="120" width="16" height="28" rx="8" fill="#FAF4E6" stroke="url(#schoolStroke)" strokeWidth="1.4" />
      <circle cx="115" cy="135" r="0.9" fill="#0F1419" />

      {/* left wing windows */}
      {[0, 1].map((row) => (
        [0, 1, 2].map((col) => (
          <rect
            key={`lw-${row}-${col}`}
            x={36 + col * 18}
            y={94 + row * 22}
            width="12"
            height="14"
            rx="1.5"
            fill="#FAF4E6"
            stroke="url(#schoolStroke)"
            strokeWidth="1.2"
          />
        ))
      )).flat()}

      {/* right wing windows */}
      {[0, 1].map((row) => (
        [0, 1, 2].map((col) => (
          <rect
            key={`rw-${row}-${col}`}
            x={132 + col * 18}
            y={94 + row * 22}
            width="12"
            height="14"
            rx="1.5"
            fill="#FAF4E6"
            stroke="url(#schoolStroke)"
            strokeWidth="1.2"
          />
        ))
      )).flat()}

      {/* tower window (small) */}
      <rect x="103" y="96" width="14" height="14" rx="1.5" fill="#FAF4E6" stroke="url(#schoolStroke)" strokeWidth="1.2" />
    </motion.svg>
  );
}

interface OrbitNode {
  label: string;
  icon: typeof Brain;
  position: string; // tailwind class for absolute placement
  delay: number;
  tint: string;
}

const ORBIT_NODES: OrbitNode[] = [
  { label: "AI Lab",       icon: Brain, position: "top-2 left-2 md:top-6 md:left-6",       delay: 1.4, tint: "var(--teal-500)" },
  { label: "Robotics",     icon: Bot,   position: "top-2 right-2 md:top-6 md:right-6",     delay: 1.6, tint: "var(--orange-500)" },
  { label: "3D Printing",  icon: Boxes, position: "bottom-6 left-2 md:bottom-8 md:left-6", delay: 1.8, tint: "var(--green-accent)" },
  { label: "Drone Tech",   icon: Plane, position: "bottom-6 right-2 md:bottom-8 md:right-6", delay: 2.0, tint: "var(--orange-600)" },
];

function NodeCard({ node }: { node: OrbitNode }) {
  const Icon = node.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: node.delay, ease: EASE }}
      className={`absolute ${node.position} z-20`}
    >
      <div
        className="flex items-center gap-2 rounded-2xl border border-[color:var(--border-subtle)] bg-white/95 py-2 pl-2 pr-3 shadow-medium backdrop-blur-sm animate-float-slow"
        style={{ animationDelay: `${node.delay}s` }}
      >
        <span
          className="grid h-8 w-8 place-items-center rounded-xl text-white"
          style={{ backgroundColor: node.tint }}
        >
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <span className="text-[11.5px] font-semibold leading-tight text-[var(--ink-primary)]">
          {node.label}
        </span>
      </div>
    </motion.div>
  );
}

// Animated dotted connectors radiating from the school. They live behind
// the nodes; tiny moving dots travel along each path to suggest "energy"
// flowing into the school.
function ConnectorLines() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 400"
      className="absolute inset-0 z-10 h-full w-full"
    >
      <defs>
        <linearGradient id="connectorGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#F39C32" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#2EB6B5" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* four diagonal connectors from each corner to centre */}
      {[
        "M 60 60 L 200 200",
        "M 340 60 L 200 200",
        "M 60 340 L 200 200",
        "M 340 340 L 200 200",
      ].map((d, i) => (
        <g key={d}>
          <motion.path
            d={d}
            stroke="url(#connectorGrad)"
            strokeWidth="1.2"
            strokeDasharray="2 5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 0.9, delay: 1.6 + i * 0.12, ease: EASE }}
          />
          {/* moving "energy" dot along the path */}
          <motion.circle
            r="3"
            fill="#F39C32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4 + i * 0.15, duration: 0.4 }}
          >
            <animateMotion
              dur={`${3 + i * 0.3}s`}
              repeatCount="indefinite"
              begin={`${2 + i * 0.4}s`}
              path={d}
            />
          </motion.circle>
        </g>
      ))}
    </svg>
  );
}

function AIBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 1.3, ease: EASE }}
    >
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-warm"
        style={{ backgroundImage: "var(--gradient-brand)" }}
      >
        <Sparkles size={11} strokeWidth={2.4} />
        AI School
      </div>
    </motion.div>
  );
}

function PlatformCaption() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 2.2, ease: EASE }}
    >
      <div className="flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-white/95 px-3.5 py-1.5 shadow-soft backdrop-blur-sm">
        <GraduationCap size={13} strokeWidth={1.8} className="text-[var(--teal-600)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-secondary)]">
          8 Labs · 8 Services · 1 Platform
        </span>
      </div>
    </motion.div>
  );
}

function AISchoolEmblem() {
  // Stacked column: AI badge → square emblem (school + orbits + connectors)
  // → platform caption. Keeping the labels OUTSIDE the square stops them
  // from colliding with the orbital lab pills at the corners.
  return (
    <div className="flex w-full max-w-[460px] flex-col items-center gap-3">
      <AIBadge />

      <div className="relative aspect-square w-full">
        {/* soft halo behind the school */}
        <div
          aria-hidden
          className="absolute inset-[18%] rounded-full opacity-30 blur-3xl"
          style={{ backgroundImage: "var(--gradient-warmth)" }}
        />

        <ConnectorLines />

        {/* The school building sits in the very centre. The inset is
           generous so the orbital pills at the corners stay clear of
           the building. */}
        <div className="absolute inset-[24%] z-20 grid place-items-center">
          <SchoolBuilding />
        </div>

        {/* The four orbital lab nodes — at the corners of the square */}
        {ORBIT_NODES.map((n) => (
          <NodeCard key={n.label} node={n} />
        ))}
      </div>

      <PlatformCaption />
    </div>
  );
}

export function Hero() {
  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-4.5rem)] items-start overflow-hidden bg-[var(--bg-warm)]"
      style={{ backgroundImage: "var(--gradient-dawn)" }}
    >
      <AmbientShapes />

      <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-start gap-8 px-6 pb-12 pt-6 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pb-14 lg:pt-10">
        {/* Left: copy column */}
        <div className="lg:col-span-7">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-white/70 px-3.5 py-1.5 backdrop-blur-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--teal-500)] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--teal-500)]" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--teal-600)]">
              India&apos;s complete AI School ecosystem
            </span>
          </motion.div>

          {/* Headline — smaller max size so it always fits on one screen */}
          <h1
            className="mt-5 font-semibold leading-[1.04] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 5.2vw, 4.5rem)" }}
          >
            <span className="block">
              <StaggeredLine text="Build an AI School." delay={0.2} />
            </span>
            <span className="block">
              <StaggeredLine text="Don’t just teach AI." delay={0.7} gradient />
            </span>
          </h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.15, ease: EASE }}
            className="mt-5 max-w-[560px] text-[15.5px] leading-[1.55] text-[var(--ink-secondary)] md:text-[17px]"
          >
            We bring{" "}
            <span className="font-semibold text-[var(--ink-primary)]">labs</span>,{" "}
            <span className="font-semibold text-[var(--ink-primary)]">teacher training</span>{" "}
            and{" "}
            <span className="font-semibold text-[var(--ink-primary)]">AI software</span>{" "}
            to your campus — turning a traditional school into a future-ready
            one, one classroom at a time.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 1.4, ease: EASE }}
            className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <Link
              href="/request-demo"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold text-white shadow-warm transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(243,156,50,0.32)]"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              Book a school visit
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
            <Link
              href="#pillars"
              className="group inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold text-[var(--teal-600)] transition-colors hover:text-[var(--teal-500)]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full border border-[var(--teal-500)]/30 bg-white transition-transform group-hover:scale-110">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </span>
              See the program
            </Link>
          </motion.div>
        </div>

        {/* Right: AI School emblem — animated, communicates transformation */}
        <div className="relative flex justify-center lg:col-span-5 lg:justify-end">
          <AISchoolEmblem />
        </div>
      </div>

      {/* Scroll cue — kept subtle, anchored to the very bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 hidden justify-center md:flex">
        <div className="flex flex-col items-center gap-1 text-[var(--ink-tertiary)]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">Scroll</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "scroll-cue 2s ease-in-out infinite" }}>
            <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
          </svg>
        </div>
      </div>
    </section>
  );
}
