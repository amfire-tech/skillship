/*
 * File:    frontend/src/components/home/IAASLabs.tsx
 * Purpose: Pillar 1 — Infrastructure as a Service. The 8 advanced labs that
 *          Skillship installs on a partner school's campus (catalogue p.4).
 *
 *          Design intent (client refresh): mirror the AI Career Pilot scroll
 *          pattern — a CONSTANT left frame that stays pinned while the right
 *          column scrolls through all 8 labs. As each lab enters its scroll
 *          range, the pinned frame crossfades to that lab's animated visual
 *          (themed glyph + sonar rings + orbiting nodes + big number) and the
 *          right-side step lights up. Header photo + IAAS-advantage strip are
 *          retained around the showcase.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { PillarNumberBackdrop } from "@/components/home/PillarNumberBackdrop";
import {
  Brain, Bot, Plane, Rocket, Code2, PlaneTakeoff, Cpu, Boxes,
  Wrench, ShieldCheck, BookOpen, TrendingUp, Headphones, CheckCircle2,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

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

/* ─────────────────────────────────────────────────────────────────────
 * The animated lab glyph that lives inside the constant frame. Themed by
 * the lab's tint: a big gradient icon tile, expanding sonar rings, three
 * orbiting nodes, and a large faint number watermark. Loops continuously
 * so whichever lab is active always feels alive.
 * ───────────────────────────────────────────────────────────────────── */
function LabGlyph({ lab }: { lab: Lab }) {
  const Icon = lab.icon;
  return (
    <div className="relative grid h-full w-full place-items-center">
      {/* sonar rings — cp-sonar applies translate(-50%,-50%) so anchor at centre */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="absolute left-1/2 top-1/2 h-28 w-28 rounded-full border"
          style={{
            borderColor: lab.tint,
            animation: "cp-sonar 4s ease-out infinite",
            animationDelay: `${i * 1.1}s`,
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

/* Each lab's visual layer — owns its own scroll-driven opacity so the
   pinned frame crossfades through all 8 as the column scrolls. */
function LabVisualLayer({
  lab,
  index,
  scrollYProgress,
}: {
  lab: Lab;
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const seg = 1 / N;
  const cf = seg * 0.4; // crossfade window
  const a = index * seg;
  const b = (index + 1) * seg;

  // First lab visible from the top; last lab visible to the very end; the
  // middle labs fade in/out across their segment so adjacent visuals
  // crossfade with no dark dip at the boundary.
  const input =
    index === 0
      ? [0, b - cf, b]
      : index === N - 1
        ? [a - cf, a, 1]
        : [a - cf, a, b - cf, b];
  const output =
    index === 0
      ? [1, 1, 0]
      : index === N - 1
        ? [0, 1, 1]
        : [0, 1, 1, 0];

  const opacity = useTransform(scrollYProgress, input, output);

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 grid place-items-center p-10">
      <LabGlyph lab={lab} />
      {/* lab name caption pinned at the bottom of the frame */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-[color:var(--border-subtle)] bg-white/60 px-7 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-[13px] font-semibold text-white"
            style={{ backgroundColor: lab.tint }}
          >
            {lab.n}
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink-primary)]">
            {lab.name}
          </span>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
          Lab {lab.n} / {LABS.length.toString().padStart(2, "0")}
        </span>
      </div>
    </motion.div>
  );
}

/* The constant pinned frame. */
function StickyFrame({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  return (
    <div className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-[28px] border border-[color:var(--border-subtle)] bg-[var(--card)] shadow-strong ring-1 ring-black/5">
      {/* soft brand wash inside the constant frame */}
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 42%, rgba(255,138,0,0.10), transparent 62%)" }} />
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 70%, rgba(46,182,181,0.08), transparent 65%)" }} />
      {LABS.map((lab, i) => (
        <LabVisualLayer key={lab.n} lab={lab} index={i} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}

/* Right-column scrolling step — lights up across its scroll range. */
function LabStep({
  lab,
  index,
  scrollYProgress,
}: {
  lab: Lab;
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const seg = 1 / N;
  const a = index * seg;
  const b = (index + 1) * seg;
  const active = useTransform(scrollYProgress, [a - 0.03, a, b, b + 0.03], [0, 1, 1, 0]);
  const dim = useTransform(active, [0, 1], [0.45, 1]);

  return (
    <div className="relative flex min-h-[62vh] items-center">
      <motion.div style={{ opacity: dim }} className="flex w-full items-start gap-5">
        {/* number badge — fills with the lab tint while active */}
        <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[color:var(--border-subtle)] bg-white">
          <motion.span aria-hidden style={{ opacity: active, backgroundColor: lab.tint }} className="absolute inset-0 rounded-2xl" />
          <span className="absolute inset-0 grid place-items-center text-[14px] font-semibold tracking-wider text-[var(--ink-tertiary)]">{lab.n}</span>
          <motion.span style={{ opacity: active }} className="absolute inset-0 grid place-items-center text-[14px] font-semibold tracking-wider text-white">{lab.n}</motion.span>
        </div>

        <div>
          <h3
            className="font-semibold leading-[1.12] tracking-[-0.025em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.35rem)" }}
          >
            {lab.name}
          </h3>
          <p className="mt-3 max-w-[440px] text-[16px] leading-[1.65] text-[var(--ink-secondary)] md:text-[17px]">
            {lab.desc}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function IAASLabs() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });
  // Smooth the raw scroll progress so the crossfades glide instead of
  // tracking every jitter of the wheel — "extreme smooth" flow.
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.4 });

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
                src="/iaas-classroom.png"
                alt="Skillship classroom in action — students working on robotics, drones, coding, and 3D printing"
                fill
                priority
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

      {/* ── Desktop: sticky constant frame + scrolling 8 labs ──
          mt-24 keeps a clear gap below the hero photo so the pinned frame
          never visually merges into it. */}
      <div ref={scrollRef} className="relative z-10 mx-auto mt-24 hidden max-w-[1280px] px-6 lg:block lg:px-12">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-6">
            <div className="sticky top-28 flex h-[calc(100vh-7rem)] items-center justify-center">
              <StickyFrame scrollYProgress={smooth} />
            </div>
          </div>
          <div className="col-span-6">
            {LABS.map((lab, i) => (
              <LabStep key={lab.n} lab={lab} index={i} scrollYProgress={smooth} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile / tablet: stacked cards, each lab its own glyph ── */}
      <div className="relative z-10 mx-auto max-w-[720px] px-6 pt-12 lg:hidden">
        <div className="space-y-14">
          {LABS.map((lab, i) => (
            <motion.div
              key={lab.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-[color:var(--border-subtle)] bg-[var(--cream-soft)] shadow-soft">
                <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 45%, rgba(255,138,0,0.10), transparent 62%)" }} />
                <div className="absolute inset-0 grid place-items-center p-8">
                  <LabGlyph lab={lab} />
                </div>
              </div>
              <div className="mt-5 flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[13px] font-semibold text-white" style={{ backgroundColor: lab.tint }}>
                  {lab.n}
                </span>
                <div>
                  <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">{lab.name}</h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-[var(--ink-secondary)]">{lab.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
                className="flex flex-col items-start gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-white p-5 shadow-soft"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--cream)] text-[var(--teal-600)]">
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
