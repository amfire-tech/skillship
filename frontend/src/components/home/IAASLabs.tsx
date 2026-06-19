/*
 * File:    frontend/src/components/home/IAASLabs.tsx
 * Purpose: Pillar 1 — Infrastructure as a Service. The 8 advanced labs that
 *          Skillship installs on a partner school's campus (catalogue p.4).
 *
 *          Showcase (client refresh): an auto-playing, interactive spotlight.
 *          A themed stage crossfades through each lab's animated glyph while a
 *          row of story-style progress bars fills underneath — one per lab.
 *          Hover/focus pauses it, a click jumps to any lab, and arrow keys
 *          step through. The active lab's brand colour tints the whole panel.
 *          Header photo + IAAS-advantage strip are retained around it.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { PillarNumberBackdrop } from "@/components/home/PillarNumberBackdrop";
import {
  Brain, Bot, Plane, Rocket, Code2, PlaneTakeoff, Cpu, Boxes,
  Wrench, ShieldCheck, BookOpen, TrendingUp, Headphones, CheckCircle2,
  ChevronLeft, ChevronRight,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;
/** How long each lab holds before the spotlight advances (ms). */
const AUTO_MS = 4800;

interface Lab {
  n: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  /** Tailwind gradient class for the icon tile. */
  tile: string;
  /** Brand-token color used for rings / particles / number watermark. */
  tint: string;
}

// 8 labs, taken from catalogue page 4 (left to right).
const LABS: Lab[] = [
  {
    n: "01",
    name: "AI Lab",
    desc: "Explore artificial intelligence, machine learning, and smart systems through practical, build-it-yourself applications.",
    icon: Brain,
    tile: "bg-[linear-gradient(135deg,#5CC9C8_0%,#2EB6B5_100%)]",
    tint: "#2EB6B5",
  },
  {
    n: "02",
    name: "Robotics Lab",
    desc: "Design, build and program robots using sensors, motors, and controllers to solve real-life challenges.",
    icon: Bot,
    tile: "bg-[linear-gradient(135deg,#FFB02E_0%,#FF7A14_100%)]",
    tint: "#FF8A00",
  },
  {
    n: "03",
    name: "Drone Technology Lab",
    desc: "Learn drone design, assembly, and flight operations with applications in surveillance, mapping, and agriculture.",
    icon: Plane,
    tile: "bg-[linear-gradient(135deg,#7BD685_0%,#4FB956_100%)]",
    tint: "#4FB956",
  },
  {
    n: "04",
    name: "Spacetech Lab",
    desc: "Dive into space science, satellites, rocketry, and next-generation space innovations.",
    icon: Rocket,
    tile: "bg-[linear-gradient(135deg,#5CC9C8_0%,#1F9594_100%)]",
    tint: "#1F9594",
  },
  {
    n: "05",
    name: "Coding & Computational Thinking",
    desc: "Develop programming skills, logical thinking, and structured problem-solving approaches from the ground up.",
    icon: Code2,
    tile: "bg-[linear-gradient(135deg,#FF8A00_0%,#D8861F_100%)]",
    tint: "#FF8A00",
  },
  {
    n: "06",
    name: "Aeromodelling Lab",
    desc: "Design and build aircraft models while understanding aerodynamics and core engineering concepts.",
    icon: PlaneTakeoff,
    tile: "bg-[linear-gradient(135deg,#F8B660_0%,#2EB6B5_100%)]",
    tint: "#5CC9C8",
  },
  {
    n: "07",
    name: "Electronics & IoT Lab",
    desc: "Create smart systems using sensors, circuits, and IoT to connect the physical and digital world.",
    icon: Cpu,
    tile: "bg-[linear-gradient(135deg,#FFB02E_0%,#FF8A00_100%)]",
    tint: "#FFB02E",
  },
  {
    n: "08",
    name: "3D Printing & Design Lab",
    desc: "Turn ideas into physical prototypes using advanced 3D design and printing technologies.",
    icon: Boxes,
    tile: "bg-[linear-gradient(135deg,#2EB6B5_0%,#4FB956_100%)]",
    tint: "#2EB6B5",
  },
];

interface Advantage {
  icon: LucideIcon;
  title: string;
  blurb: string;
}

const ADVANTAGES: Advantage[] = [
  { icon: Wrench,        title: "Complete setup",       blurb: "End-to-end installation on your campus." },
  { icon: CheckCircle2,  title: "Industry-grade kit",   blurb: "High-quality hardware aligned with real-world standards." },
  { icon: BookOpen,      title: "Curriculum-integrated", blurb: "Plug-and-play labs mapped to your syllabus." },
  { icon: ShieldCheck,   title: "Safe & durable",       blurb: "Built for safety and student-friendly use." },
  { icon: TrendingUp,    title: "Scalable & future-ready", blurb: "Designed to adapt as tech and student needs evolve." },
  { icon: Headphones,    title: "End-to-end support",   blurb: "From planning to training and ongoing technical help." },
];

const N = LABS.length;

/* Directional slide for the headline/description swap. `custom` carries the
   travel direction (+1 forward, -1 back) so content enters from the side it
   is travelling toward and exits the opposite way. */
const contentVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 36 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -36 }),
};

/** hex (#RRGGBB) → rgba() string at the given alpha. */
function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* ─────────────────────────────────────────────────────────────────────
 * The animated lab glyph that lives inside the stage. Themed by the lab's
 * tint: a big gradient icon tile, expanding sonar rings, three orbiting
 * nodes. Loops continuously so the active lab always feels alive.
 * ───────────────────────────────────────────────────────────────────── */
function LabGlyph({ lab }: { lab: Lab }) {
  const Icon = lab.icon;
  return (
    <div className="relative grid h-full w-full place-items-center">
      {/* sonar rings — cp-sonar carries the translate(-50%,-50%) centering, so
          the ring is ONLY centred while the animation is running. We use a
          NEGATIVE delay (not positive) to phase the three rings: each starts
          already mid-cycle, so the centering transform applies from the very
          first frame. A positive delay would leave the un-started rings with
          no transform — offset down-right and intersecting the icon for the
          first seconds after each card remounts. fill-mode backwards is a
          safety net for the same reason. */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="absolute left-1/2 top-1/2 h-28 w-28 rounded-full border"
          style={{
            borderColor: lab.tint,
            animation: "cp-sonar 4s ease-out infinite",
            animationDelay: `${i * -1.333}s`,
            animationFillMode: "backwards",
          }}
        />
      ))}

      {/* orbiting nodes — outer wrapper centres, inner wrapper spins */}
      <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2">
        <div className="h-full w-full animate-[spin_14s_linear_infinite]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: lab.tint,
                boxShadow: `0 0 12px ${lab.tint}`,
                transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateY(-7rem)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* central icon tile */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`relative grid h-24 w-24 place-items-center rounded-[28px] text-white shadow-medium ${lab.tile}`}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-[28px] opacity-50 blur-2xl"
          style={{ backgroundColor: lab.tint }}
        />
        <Icon size={42} strokeWidth={1.6} className="relative" />
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * The interactive auto-playing spotlight. Drives a single `active` index;
 * a framer motion value (`progress`) fills the active lab's bar and, on
 * complete, advances. Hover/focus pauses; clicks + arrow keys navigate.
 * Replaces the old scroll-pinned showcase entirely.
 * ───────────────────────────────────────────────────────────────────── */
function LabsSpotlight() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1); // slide direction for content swaps
  const [paused, setPaused] = useState(false);
  const progress = useMotionValue(0); // 0→1 fill of the ACTIVE bar

  // Auto-advance: animate `progress` to 1 over the remaining time, then step.
  // Pausing stops the animation and freezes the value; resuming continues
  // from where it left off. Reduced motion → no autoplay (manual only).
  useEffect(() => {
    if (reduce || paused) return;
    const remaining = AUTO_MS * (1 - progress.get());
    const controls = animate(progress, 1, {
      duration: Math.max(remaining, 0) / 1000,
      ease: "linear",
      onComplete: () => {
        progress.set(0);
        setDir(1);
        setActive((a) => (a + 1) % N);
      },
    });
    return () => controls.stop();
  }, [active, paused, reduce, progress]);

  const go = useCallback(
    (next: number) => {
      const target = (next + N) % N;
      setDir(target > active || (active === N - 1 && target === 0) ? 1 : -1);
      progress.set(0);
      setActive(target);
    },
    [active, progress],
  );

  const lab = LABS[active];

  return (
    <div
      className="relative z-10 mx-auto max-w-[1280px] px-6 lg:px-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      role="group"
      aria-roledescription="carousel"
      aria-label="Skillship labs"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
      }}
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* ── Stage ── */}
        <div className="relative mx-auto aspect-square w-full max-w-[460px] overflow-hidden rounded-[32px] border border-[color:var(--border-subtle)] bg-[var(--card)] shadow-strong ring-1 ring-black/5">
          {/* the themed glyph + wash crossfade together, keyed by active */}
          <AnimatePresence>
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="absolute inset-0"
            >
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ backgroundImage: `radial-gradient(circle at 50% 40%, ${hexA(lab.tint, 0.18)}, transparent 64%)` }}
              />
              {/* big faint number watermark */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-6 right-1 select-none text-[12rem] font-bold leading-none tracking-tighter"
                style={{ color: hexA(lab.tint, 0.1) }}
              >
                {lab.n}
              </span>
              <motion.div
                initial={{ scale: 0.94 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="absolute inset-0 grid place-items-center p-10"
              >
                <LabGlyph lab={lab} />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* caption pinned at the bottom of the stage */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-[color:var(--border-subtle)] bg-[var(--card)]/70 px-7 py-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[13px] font-semibold text-white transition-colors"
                style={{ backgroundColor: lab.tint }}
              >
                {lab.n}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink-primary)]"
                >
                  {lab.name}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
              {lab.n} / {N.toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* ── Content + selector ── */}
        <div>
          <p
            className="text-[11.5px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: lab.tint }}
          >
            Lab {lab.n} of {N.toString().padStart(2, "0")}
          </p>

          {/* swap headline + description with a directional slide */}
          <div className="relative mt-3 min-h-[210px] md:min-h-[200px]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={active}
                custom={dir}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.42, ease: EASE }}
                className="absolute inset-0"
              >
                <h3
                  className="font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--ink-primary)]"
                  style={{ fontSize: "clamp(1.7rem, 3vw, 2.5rem)" }}
                >
                  {lab.name}
                </h3>
                <p className="mt-4 max-w-[460px] text-[16px] leading-[1.65] text-[var(--ink-secondary)] md:text-[17px]">
                  {lab.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* story-style progress bars — one per lab, click to jump */}
          <div className="mt-8 flex items-center gap-2.5">
            {LABS.map((l, i) => (
              <button
                key={l.n}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${l.name}`}
                aria-current={i === active}
                className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border)] transition-[height] hover:h-2.5 focus-visible:h-2.5"
              >
                {/* labs already seen → solid fill */}
                {i < active && (
                  <span className="absolute inset-0 rounded-full" style={{ backgroundColor: hexA(l.tint, 0.45) }} />
                )}
                {/* active lab → live progress fill */}
                {i === active && (
                  <motion.span
                    className="absolute inset-y-0 left-0 w-full origin-left rounded-full"
                    style={{ scaleX: progress, backgroundColor: lab.tint }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* prev / next + counter */}
          <div className="mt-7 flex items-center gap-3">
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="Previous lab"
              className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--border-subtle)] bg-[var(--card)] text-[var(--ink-secondary)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:text-[var(--ink-primary)]"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="Next lab"
              className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--border-subtle)] bg-[var(--card)] text-[var(--ink-secondary)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:text-[var(--ink-primary)]"
            >
              <ChevronRight size={18} />
            </button>
            <span className="ml-1 text-[13px] font-medium text-[var(--ink-tertiary)]">
              Hover to pause · use ← → to browse
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IAASLabs() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="iaas-labs" ref={ref} className="relative bg-[var(--cream-soft)]">
      {/* Giant pillar 01 — holds for the whole IAAS section, then TAAS's 02
          takes over. */}
      <PillarNumberBackdrop number="01" align="right" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pt-28 md:pt-36 lg:px-12">
        {/* Header — eyebrow + headline */}
        <div className="max-w-[820px]">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--green-accent)]"
          >
            Pillar 1 · Infrastructure as a Service
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
          >
            One infrastructure.{" "}
            <span className="bg-clip-text text-transparent">Eight powerful labs.</span>
          </motion.h2>
        </div>

        {/* Small photo (left) + description (right) */}
        <div className="mt-12 grid items-center gap-10 md:grid-cols-2 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="card-pop relative overflow-hidden rounded-[24px] border border-[color:var(--border-subtle)] shadow-medium"
          >
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/iaas-classroom.jpg"
                alt="Skillship classroom in action — students working on robotics, drones, coding, and 3D printing"
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/2"
                style={{ backgroundImage: "linear-gradient(to top, rgba(15,20,25,0.78), transparent)" }}
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 text-white md:p-6">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] opacity-80">
                  One classroom · Many activities · Real outcomes
                </p>
                <p className="text-[16px] font-semibold leading-[1.25] tracking-[-0.015em] md:text-[19px]">
                  Where students learn by building.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.42, ease: EASE }}
          >
            <p className="text-[17px] leading-[1.65] text-[var(--ink-secondary)] md:text-[18px]">
              Skillship brings together 8 advanced, industry-relevant labs under
              one unified infrastructure — transforming traditional classrooms
              into innovation-driven learning environments.
            </p>
            <p className="mt-4 text-[15.5px] leading-[1.6] text-[var(--ink-tertiary)]">
              Each lab arrives campus-ready: industry-grade hardware, a
              syllabus-mapped curriculum, and complete installation — so your
              students start building from day one.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── The interactive auto-playing labs spotlight (all breakpoints) ── */}
      <div className="mt-20 md:mt-24">
        <LabsSpotlight />
      </div>

      {/* The IAAS advantage strip */}
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pb-28 pt-20 md:pb-36 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
        >
          The Skillship IAAS advantage
        </motion.p>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 lg:gap-6">
          {ADVANTAGES.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.05, ease: EASE } }}
                viewport={{ once: true, amount: 0.4 }}
                whileHover={{ y: -10, scale: 1.035, transition: { type: "spring", stiffness: 320, damping: 20 } }}
                className="group card-lift flex flex-col items-start gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-white p-5 shadow-soft"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--cream)] text-[var(--teal-600)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--teal-500)] group-hover:text-white group-hover:shadow-[0_6px_16px_-4px_var(--teal-500)]">
                  <Icon size={20} strokeWidth={1.7} />
                </span>
                <p className="text-[13.5px] font-semibold leading-[1.3] text-[var(--ink-primary)]">
                  {a.title}
                </p>
                <p className="text-[12.5px] leading-[1.5] text-[var(--ink-secondary)]">
                  {a.blurb}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
