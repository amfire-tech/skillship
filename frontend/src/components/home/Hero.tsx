/*
 * File:    frontend/src/components/home/Hero.tsx
 * Purpose: Public homepage hero — premium dark redesign (client brief: "more
 *          premium, best UI/UX"). A deep-navy hero surface with ambient brand
 *          glows, an animated "lit at night" AI-School emblem on the right
 *          (school building + four orbital lab cards + glowing connectors),
 *          a four-point feature strip, and a real-numbers impact bar folded
 *          into the bottom of the hero.
 *
 *          The hero is intentionally always-dark regardless of the site theme
 *          — a dark hero over the light/warm body is the premium pattern the
 *          client approved. All colours inside are therefore explicit (not
 *          theme tokens that would flip), except the brand gradients which
 *          read well on dark.
 *
 *          Impact numbers are the REAL catalogue figures (100+ schools,
 *          50,000+ students, 12+ courses, 8 labs) — the design reference
 *          screenshot used placeholder data, which we do not copy.
 * Owner:   Pranav (homepage rebuild — premium hero refresh)
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Brain, Bot, Boxes, Plane, Sparkles,
  GraduationCap, Users, Cpu, ShieldCheck,
  CalendarDays, Play, ArrowRight,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────────────────
 * Word-safe character stagger. Splits by spaces, animates each character
 * inside the word; the word is a non-breaking inline-block so it never
 * breaks mid-letter on a wrap.
 * ───────────────────────────────────────────────────────────────────── */
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
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.85, ease: EASE, delay: delay + i * 0.022 }}
                className={`inline-block ${
                  gradient
                    ? "bg-clip-text text-transparent animate-brand-shift bg-[length:200%_100%]"
                    : ""
                }`}
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

/* Hand-drawn underline swoosh that draws itself in under the headline. */
function UnderlineSwoosh() {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 320 24"
      className="absolute -bottom-1 left-0 h-3 w-[min(100%,22rem)] md:h-4"
      fill="none"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="swoosh" x1="0" y1="0" x2="320" y2="0">
          <stop offset="0%" stopColor="#FF5E0E" />
          <stop offset="100%" stopColor="#FFB02E" />
        </linearGradient>
      </defs>
      <motion.path
        d="M6 16 C 70 6, 150 6, 220 12 C 270 16, 300 14, 314 9"
        stroke="url(#swoosh)"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 1.25, ease: EASE }}
      />
    </motion.svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * Ambient background — deep navy with two soft brand glows, a faint grid,
 * and a scatter of drifting particles. Pure decoration, pointer-events off.
 * ───────────────────────────────────────────────────────────────────── */
function AmbientBackground() {
  // Deterministic particle field (no Math.random in render → stable SSR).
  const particles = [
    { x: "12%", y: "22%", d: "9s",  s: 2 },
    { x: "28%", y: "68%", d: "11s", s: 1.5 },
    { x: "44%", y: "16%", d: "13s", s: 2.5 },
    { x: "62%", y: "40%", d: "10s", s: 1.5 },
    { x: "74%", y: "24%", d: "12s", s: 2 },
    { x: "85%", y: "58%", d: "9.5s", s: 1.5 },
    { x: "55%", y: "78%", d: "14s", s: 2 },
    { x: "18%", y: "48%", d: "10.5s", s: 1.5 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* animated orange grid — slow seamless pan (tile size === pan distance) */}
      <div
        className="absolute inset-0 animate-[site-grid-pan_16s_linear_infinite]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,138,0,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,138,0,0.13) 1px, transparent 1px)",
          backgroundSize: "46px 46px, 46px 46px",
        }}
      />
      {/* warm glow, bottom-left */}
      <div className="absolute -left-32 bottom-[-6rem] h-[28rem] w-[28rem] rounded-full bg-[#FF7A14] opacity-[0.16] blur-[120px]" />
      {/* teal glow, top-right */}
      <div className="absolute -right-24 top-[-4rem] h-[26rem] w-[26rem] rounded-full bg-[#2EB6B5] opacity-[0.14] blur-[120px]" />
      {/* subtle violet depth, center */}
      <div className="absolute left-1/2 top-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[#3B6FE0] opacity-[0.10] blur-[120px]" />
      {/* drifting particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white/60 animate-float-slow"
          style={{
            left: p.x,
            top: p.y,
            height: p.s,
            width: p.s,
            animationDuration: p.d,
            boxShadow: "0 0 6px rgba(255,255,255,0.6)",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * The AI-School emblem — a "lit at night" school building on a glowing
 * platform, four orbital lab cards, and pulsing connectors.
 * ───────────────────────────────────────────────────────────────────── */
function SchoolBuilding() {
  return (
    <motion.svg
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.1, delay: 0.7, ease: EASE }}
      viewBox="0 0 240 210"
      className="relative h-full w-full drop-shadow-[0_18px_44px_rgba(255,138,0,0.28)]"
    >
      <defs>
        <linearGradient id="bStroke" x1="0" y1="0" x2="240" y2="210">
          <stop offset="0%" stopColor="#FFB02E" />
          <stop offset="100%" stopColor="#FF6A14" />
        </linearGradient>
        <linearGradient id="bBody" x1="0" y1="40" x2="0" y2="190">
          <stop offset="0%" stopColor="#1B2740" />
          <stop offset="100%" stopColor="#0F1830" />
        </linearGradient>
        <linearGradient id="bRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF8A00" />
          <stop offset="100%" stopColor="#D8861F" />
        </linearGradient>
        <radialGradient id="winGlow" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0%" stopColor="#FFD489" />
          <stop offset="100%" stopColor="#FF9A2E" />
        </radialGradient>
        <radialGradient id="plate" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#21314F" />
          <stop offset="100%" stopColor="#0B1326" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* glowing platform */}
      <ellipse cx="120" cy="186" rx="104" ry="22" fill="url(#plate)" />
      <ellipse cx="120" cy="184" rx="92" ry="15" fill="none" stroke="url(#bStroke)" strokeWidth="1.4" strokeOpacity="0.5" />

      {/* base footing */}
      <rect x="34" y="170" width="172" height="8" rx="3" fill="url(#bBody)" stroke="url(#bStroke)" strokeWidth="1.4" />

      {/* left + right wings */}
      <rect x="40" y="104" width="64" height="66" fill="url(#bBody)" stroke="url(#bStroke)" strokeWidth="1.6" />
      <rect x="136" y="104" width="64" height="66" fill="url(#bBody)" stroke="url(#bStroke)" strokeWidth="1.6" />

      {/* central tower */}
      <rect x="102" y="60" width="36" height="110" fill="url(#bBody)" stroke="url(#bStroke)" strokeWidth="1.8" />
      {/* tower roof */}
      <polygon points="100,60 120,38 140,60" fill="url(#bRoof)" stroke="url(#bStroke)" strokeWidth="1.6" />
      {/* flag */}
      <line x1="120" y1="38" x2="120" y2="22" stroke="url(#bStroke)" strokeWidth="1.6" strokeLinecap="round" />
      <polygon points="120,22 134,27 120,32" fill="url(#bStroke)" />

      {/* clock */}
      <circle cx="120" cy="86" r="9" fill="#0B1326" stroke="url(#bStroke)" strokeWidth="1.6" />
      <line x1="120" y1="86" x2="120" y2="80" stroke="#FFB02E" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="120" y1="86" x2="124" y2="88" stroke="#FFB02E" strokeWidth="1.4" strokeLinecap="round" />

      {/* glowing door */}
      <rect x="112" y="140" width="16" height="30" rx="8" fill="url(#winGlow)" opacity="0.92" />

      {/* wing windows — warm glow, a couple tinted teal for variety */}
      {[0, 1].map((row) =>
        [0, 1, 2].map((col) => {
          const teal = (row + col) % 4 === 0;
          return (
            <rect
              key={`lw-${row}-${col}`}
              x={48 + col * 17}
              y={112 + row * 24}
              width="12"
              height="15"
              rx="2"
              fill={teal ? "#5CC9C8" : "url(#winGlow)"}
              opacity="0.92"
            />
          );
        }),
      )}
      {[0, 1].map((row) =>
        [0, 1, 2].map((col) => {
          const teal = (row + col) % 3 === 0;
          return (
            <rect
              key={`rw-${row}-${col}`}
              x={144 + col * 17}
              y={112 + row * 24}
              width="12"
              height="15"
              rx="2"
              fill={teal ? "#5CC9C8" : "url(#winGlow)"}
              opacity="0.92"
            />
          );
        }),
      )}

      {/* tower window */}
      <rect x="111" y="106" width="18" height="18" rx="2.5" fill="url(#winGlow)" opacity="0.95" />
    </motion.svg>
  );
}

interface OrbitNode {
  label: string;
  sub: string;
  icon: typeof Brain;
  position: string;
  delay: number;
  tint: string;
}

const ORBIT_NODES: OrbitNode[] = [
  { label: "AI Labs",     sub: "Hands-on learning", icon: Brain, position: "top-0 left-0 md:top-2 md:left-2",       delay: 1.3, tint: "#3B82F6" },
  { label: "Robotics",    sub: "Build · Innovate",  icon: Bot,   position: "top-0 right-0 md:top-2 md:right-2",     delay: 1.5, tint: "#FF8A00" },
  { label: "3D Printing", sub: "Design · Create",   icon: Boxes, position: "bottom-2 left-0 md:bottom-4 md:left-2", delay: 1.7, tint: "#4FB956" },
  { label: "Drone Tech",  sub: "Fly · Explore",     icon: Plane, position: "bottom-2 right-0 md:bottom-4 md:right-2", delay: 1.9, tint: "#A855F7" },
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
        className="flex items-center gap-2.5 rounded-2xl border border-white/12 bg-white/[0.06] py-2 pl-2 pr-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md animate-float-slow"
        style={{ animationDelay: `${node.delay}s` }}
      >
        <span
          className="grid h-9 w-9 place-items-center rounded-xl text-white"
          style={{ backgroundColor: node.tint, boxShadow: `0 0 18px ${node.tint}66` }}
        >
          <Icon size={17} strokeWidth={1.9} />
        </span>
        <span className="leading-tight">
          <span className="block text-[12px] font-semibold text-white">{node.label}</span>
          <span className="block text-[10px] font-medium text-slate-400">{node.sub}</span>
        </span>
      </div>
    </motion.div>
  );
}

function ConnectorLines() {
  return (
    <svg aria-hidden viewBox="0 0 400 400" className="absolute inset-0 z-10 h-full w-full">
      <defs>
        <linearGradient id="conn" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2EB6B5" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {[
        "M 70 70 L 200 200",
        "M 330 70 L 200 200",
        "M 70 330 L 200 200",
        "M 330 330 L 200 200",
      ].map((d, i) => (
        <g key={d}>
          <motion.path
            d={d}
            stroke="url(#conn)"
            strokeWidth="1.3"
            strokeDasharray="2 6"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.75 }}
            transition={{ duration: 0.9, delay: 1.5 + i * 0.12, ease: EASE }}
          />
          <motion.circle
            r="3"
            fill="#FF9A2E"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.3 + i * 0.15, duration: 0.4 }}
          >
            <animateMotion dur={`${3 + i * 0.3}s`} repeatCount="indefinite" begin={`${2 + i * 0.4}s`} path={d} />
          </motion.circle>
        </g>
      ))}
    </svg>
  );
}

function AISchoolEmblem() {
  return (
    <div className="relative aspect-square w-full max-w-[520px]">
      {/* warm halo behind the school */}
      <div
        aria-hidden
        className="absolute inset-[16%] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #FF8A00 0%, transparent 70%)" }}
      />
      <ConnectorLines />
      <div className="absolute inset-[22%] z-20 grid place-items-center">
        <SchoolBuilding />
      </div>
      {ORBIT_NODES.map((n) => (
        <NodeCard key={n.label} node={n} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * Feature strip — four pillars of the program.
 * ───────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: GraduationCap, tint: "#3B82F6", title: "AI Curriculum",   sub: "Industry aligned" },
  { icon: Users,         tint: "#FF8A00", title: "Teacher Training", sub: "Upskill & empower" },
  { icon: Cpu,           tint: "#2EB6B5", title: "Future-Ready Labs", sub: "Hands-on learning" },
  { icon: ShieldCheck,   tint: "#4FB956", title: "End-to-End Support", sub: "Setup to success" },
];

function FeatureStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.55, ease: EASE }}
      className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm sm:grid-cols-4 sm:divide-x sm:divide-white/10 sm:gap-0"
    >
      {FEATURES.map((f) => {
        const Icon = f.icon;
        return (
          <div key={f.title} className="flex items-center gap-3 sm:px-4">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: `${f.tint}1f`, color: f.tint }}
            >
              <Icon size={18} strokeWidth={2} />
            </span>
            <span className="leading-tight">
              <span className="block text-[13.5px] font-semibold text-white">{f.title}</span>
              <span className="block text-[11.5px] text-slate-400">{f.sub}</span>
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * Impact stats bar — REAL catalogue numbers, count up on view.
 * ───────────────────────────────────────────────────────────────────── */
function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function Counter({ value, format, start, delayMs }: {
  value: number;
  format?: (n: number) => string;
  start: boolean;
  delayMs: number;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    const reduce = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(value); return; }
    let frame = 0;
    let started = 0;
    const startAt = performance.now() + delayMs;
    function tick(now: number) {
      if (now < startAt) { frame = requestAnimationFrame(tick); return; }
      if (!started) started = now;
      const t = Math.min(1, (now - started) / 1700);
      setN(Math.round(easeOutExpo(t) * value));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, value, delayMs]);
  return <>{format ? format(n) : n}</>;
}

const STATS = [
  { to: 100,   suffix: "+", label: "Schools collaborated" },
  { to: 50000, suffix: "+", label: "Students empowered", format: (n: number) => n.toLocaleString("en-IN") },
  { to: 12,    suffix: "+", label: "Industry-relevant courses" },
  { to: 8,     suffix: "",  label: "Advanced technology labs" },
];

function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <div ref={ref} className="relative border-t border-white/10 bg-white/[0.02]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-y-7 px-6 py-9 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-white/10 lg:px-12">
        {STATS.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center text-center sm:px-6">
            <p className="font-semibold tracking-[-0.02em] text-white" style={{ fontSize: "clamp(1.6rem, 2.6vw, 2.3rem)" }}>
              <Counter value={s.to} format={s.format} start={inView} delayMs={i * 130} />
              <span className="ml-0.5 bg-clip-text text-transparent">{s.suffix}</span>
            </p>
            <p className="mt-1 text-[12.5px] font-medium text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      className="relative isolate overflow-hidden bg-[#0A0F1E]"
      style={{ backgroundImage: "linear-gradient(135deg,#0A0F1E 0%,#0D1530 55%,#0A1024 100%)" }}
    >
      <AmbientBackground />

      <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-10 px-6 pb-8 pt-5 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pb-10 lg:pt-6">
        {/* Left: copy column */}
        <div className="lg:col-span-7">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-1.5 backdrop-blur-sm"
          >
            <Sparkles size={12} strokeWidth={2.4} className="text-[#5CC9C8]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7DD8D7]">
              India&apos;s complete AI School ecosystem
            </span>
          </motion.div>

          {/* Headline */}
          <h1
            className="mt-6 font-semibold leading-[1.03] tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(2.4rem, 5.4vw, 4.6rem)" }}
          >
            <span className="block">
              <StaggeredLine text="Build an AI School." delay={0.2} />
            </span>
            <span className="relative block">
              <StaggeredLine text="Don’t just teach AI." delay={0.7} gradient />
              <UnderlineSwoosh />
            </span>
          </h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1, ease: EASE }}
            className="mt-6 max-w-[560px] text-[15.5px] leading-[1.6] text-slate-300 md:text-[17px]"
          >
            We bring{" "}
            <span className="font-semibold text-white">labs</span>,{" "}
            <span className="font-semibold text-white">teacher training</span>{" "}
            and{" "}
            <span className="font-semibold text-white">AI software</span>{" "}
            to your campus — turning a traditional school into a future-ready
            one, one classroom at a time.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 1.3, ease: EASE }}
            className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <Link
              href="/request-demo"
              className="cta-sun inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold text-white transition-transform duration-300 ease-out hover:-translate-y-0.5"
              style={{ backgroundImage: "var(--gradient-headline)" }}
            >
              <CalendarDays size={17} strokeWidth={2.2} className="relative z-10" />
              <span className="relative z-10">Book a school visit</span>
              <ArrowRight size={16} strokeWidth={2.4} className="relative z-10" />
            </Link>
            <Link
              href="#pillars"
              className="btn-pop group inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[15px] font-semibold text-white backdrop-blur-sm hover:bg-white/[0.10]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 transition-transform group-hover:scale-110">
                <Play size={11} strokeWidth={0} fill="currentColor" className="ml-0.5" />
              </span>
              See the program
            </Link>
          </motion.div>

          <FeatureStrip />
        </div>

        {/* Right: AI School emblem */}
        <div className="relative flex justify-center lg:col-span-5 lg:justify-end">
          <AISchoolEmblem />
        </div>
      </div>

      {/* Impact stats folded into the hero */}
      <StatsBar />
    </section>
  );
}
