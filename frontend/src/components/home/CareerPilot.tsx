/*
 * File:    frontend/src/components/home/CareerPilot.tsx
 * Purpose: First "wow" section — sticky cinematic scroll (brief §5).
 *          Left column pins; right column scrolls through 4 steps
 *          (Listens → Maps → Guides → Grows). As scroll progresses, the
 *          left visual crossfades between 4 image states and the step
 *          indicator on the right updates.
 *
 *          Implementation: zero new deps. Uses `position: sticky` for the
 *          pin + Framer Motion's `useScroll` + `useTransform` for the
 *          crossfade — no GSAP needed (CLAUDE.md forbids new packages).
 *
 *          Image slots: /home/career-state-{1..4}.png — drop AI-generated
 *          images in to upgrade. Until then, the CSS scaffold underneath
 *          renders so the section never looks broken.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { PillarNumberBackdrop } from "@/components/home/PillarNumberBackdrop";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Step {
  num: string;
  title: string;
  body: string;
  /** Path to the AI-generated image slot for this state. */
  image: string;
  /** Alt text for the image — also describes the CSS fallback. */
  alt: string;
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "It listens.",
    body:
      "Career Pilot analyses every quiz attempt, every content interaction, every subject signal — passively, continuously.",
    image: "/home/career-state-1.png",
    alt: "A glowing teal orb pulsing in the centre with translucent activity cards drifting toward it.",
  },
  {
    num: "02",
    title: "It maps.",
    body:
      "It clusters strengths across AI, Coding, Robotics, and STEM into a profile no two students share.",
    image: "/home/career-state-2.png",
    alt: "The same orb with thin orange constellation lines connecting it to four strength clusters arranged in a circle.",
  },
  {
    num: "03",
    title: "It guides.",
    body:
      "It generates an ordered learning sequence — what to learn next, why it fits, how long it takes.",
    image: "/home/career-state-3.png",
    alt: "A winding orange path threading five luminous milestone discs through soft warm space.",
  },
  {
    num: "04",
    title: "It grows.",
    body:
      "As the student grows, the path updates. Milestones unlock. The agent never sleeps.",
    image: "/home/career-state-4.png",
    alt: "Multiple unlocked milestones glowing along a teal path that extends into warm light at the horizon.",
  },
];

/* ──────────────── CSS fallback visuals (one per state) ────────────────
 * These render UNDER the <Image>. If the AI-generated PNG is present at the
 * image path, Next.js draws it on top and hides the fallback. If the file
 * is missing, Next will render the broken-image area transparent (we hide
 * the icon via onError below) and the fallback shows through. Either way:
 * the section always has something to look at.
 */

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-[color:var(--border-subtle)] bg-[var(--cream-soft)]">
      {/* Soft inner light */}
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 45%, rgba(243,156,50,0.10), transparent 60%)" }} />
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 60%, rgba(46,182,181,0.10), transparent 65%)" }} />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * Stage 1 — "It listens."
 *   Continuous loops only, so the visual is alive whether the user is
 *   actively on this step or scrolling away from it.
 *   • Pulsing teal orb at centre (the agent's "ear").
 *   • Four sonar rings expanding outward from the orb, staggered.
 *   • Four signal pills (Quiz, Lesson, Notes, Score) drifting in from
 *     the corners toward the orb, fading out as they reach it.
 * ───────────────────────────────────────────────────────────────────── */
function FallbackListens() {
  const SIGNALS = [
    { label: "Quiz",   top: "20%", left: "16%", dx: 110,  dy: 110,  delay: 0    },
    { label: "Lesson", top: "22%", left: "78%", dx: -120, dy: 100,  delay: 1    },
    { label: "Notes",  top: "76%", left: "18%", dx: 110,  dy: -110, delay: 2    },
    { label: "Score",  top: "74%", left: "80%", dx: -110, dy: -100, delay: 3    },
  ];

  return (
    <Stage>
      {/* Sonar rings — expand from centre, fade as they grow. The centering
          translate lives INSIDE the cp-sonar keyframe, so a ring is only
          centred while its animation is running. We use NEGATIVE delays so
          each ring starts already mid-cycle (centred from the first frame);
          a positive delay would leave the un-started rings un-translated —
          offset down-right and intersecting the orb. fill-mode backwards is
          the same safeguard. */}
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className="absolute left-1/2 top-1/2 h-20 w-20 rounded-full border-2 border-[var(--teal-500)]"
          style={{
            animation: "cp-sonar 4s ease-out infinite",
            animationDelay: `${i * -1}s`,
            animationFillMode: "backwards",
            transformOrigin: "center",
          }}
        />
      ))}

      {/* Central orb */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-36 w-36">
          <div className="absolute inset-0 rounded-full bg-[var(--teal-500)] opacity-30 blur-2xl" />
          <div
            className="absolute inset-4 rounded-full bg-[var(--teal-500)] opacity-55 blur-xl"
            style={{ animation: "glow-pulse 3s ease-in-out infinite" }}
          />
          <div
            className="absolute inset-10 rounded-full shadow-cool"
            style={{ backgroundImage: "radial-gradient(circle at 35% 30%, #5CC9C8, #2EB6B5 60%, #1F9594)" }}
          />
          {/* "ear" pictogram inside the orb */}
          <svg viewBox="0 0 24 24" className="absolute inset-[42%] h-[16%] w-[16%]" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h2M20 12h2M12 2v2M12 20v2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>
          </svg>
        </div>
      </div>

      {/* Drifting signal pills — fade in, glide to centre, fade out, loop */}
      {SIGNALS.map((s) => (
        <motion.div
          key={s.label}
          className="absolute rounded-xl border border-[color:var(--border-subtle)] bg-white/95 px-3 py-1.5 shadow-soft backdrop-blur-sm"
          style={{ top: s.top, left: s.left, transform: "translate(-50%, -50%)" }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
          animate={{
            x: [0, s.dx * 0.4, s.dx],
            y: [0, s.dy * 0.4, s.dy],
            opacity: [0, 1, 1, 0],
            scale: [1, 1, 0.4],
          }}
          transition={{
            duration: 4,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 0.8,
            times: [0, 0.2, 0.85, 1],
            ease: "easeInOut",
          }}
        >
          <p className="whitespace-nowrap text-[10.5px] font-semibold text-[var(--ink-secondary)]">
            {s.label}
          </p>
        </motion.div>
      ))}
    </Stage>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * Stage 2 — "It maps."
 *   • Central orb (now the agent's "brain").
 *   • 4 cluster pills (AI · Code · Robotics · STEM) at cardinal points.
 *   • Dashed lines connect orb → each cluster; the dash pattern is
 *     continuously offset-animated so it looks like data is constantly
 *     flowing inward.
 *   • A small particle travels along each line, cluster → orb, forever.
 *   • Cluster pills breathe with a subtle scale-pulse.
 * ───────────────────────────────────────────────────────────────────── */
function FallbackMaps() {
  const CLUSTERS = [
    { l: "AI",       a: -90, color: "#F39C32" },
    { l: "Code",     a:   0, color: "#2EB6B5" },
    { l: "Robotics", a:  90, color: "#F39C32" },
    { l: "STEM",     a: 180, color: "#2EB6B5" },
  ];
  const r = 32;
  const cx = 50, cy = 50;

  return (
    <Stage>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="cp2-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F39C32" stopOpacity="0.7" />
            <stop offset="1" stopColor="#2EB6B5" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {CLUSTERS.map((c, i) => {
          const x = cx + r * Math.cos((c.a * Math.PI) / 180);
          const y = cy + r * Math.sin((c.a * Math.PI) / 180);
          const lineD = `M ${x} ${y} L ${cx} ${cy}`; // cluster → orb (particle travel direction)
          return (
            <g key={c.l}>
              {/* Continuously flowing dashed line — the dasharray is
                 animated via stroke-dashoffset so it appears to stream
                 toward the centre. */}
              <line
                x1={cx} y1={cy} x2={x} y2={y}
                stroke="url(#cp2-line)"
                strokeWidth="0.55"
                strokeLinecap="round"
                strokeDasharray="2 1.5"
                style={{ animation: "cp-flow 1.8s linear infinite" }}
              />
              {/* Travelling signal particle */}
              <circle r="1.3" fill={c.color}>
                <animateMotion
                  dur="2.6s"
                  repeatCount="indefinite"
                  begin={`${i * 0.65}s`}
                  path={lineD}
                />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Pulsing central orb */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-24 w-24">
          <div
            className="absolute inset-0 rounded-full bg-[var(--teal-500)] opacity-40 blur-xl"
            style={{ animation: "glow-pulse 3.4s ease-in-out infinite" }}
          />
          <div
            className="absolute inset-2 rounded-full shadow-cool"
            style={{ backgroundImage: "radial-gradient(circle at 35% 30%, #5CC9C8, #2EB6B5 60%, #1F9594)" }}
          />
        </div>
      </div>

      {/* Cluster pills — gentle breath */}
      {CLUSTERS.map((c, i) => {
        const x = cx + r * Math.cos((c.a * Math.PI) / 180);
        const y = cy + r * Math.sin((c.a * Math.PI) / 180);
        return (
          <motion.div
            key={c.l}
            className="absolute flex items-center gap-1.5 rounded-full border border-[color:var(--border-subtle)] bg-white/95 px-3 py-1.5 shadow-soft backdrop-blur-sm"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{
              duration: 2.8,
              delay: i * 0.7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: c.color, animation: "cp-dot-pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.35}s` }}
            />
            <span className="text-[10.5px] font-semibold text-[var(--ink-primary)]">{c.l}</span>
          </motion.div>
        );
      })}
    </Stage>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * Stage 3 — "It guides."
 *   • Winding orange path drawn with a flowing dash pattern (data
 *     continuously streaming forward).
 *   • Five milestone discs along the path, numbered 1–5.
 *   • A "current step" glow ring cycles through the milestones forever,
 *     so the path always looks like it's being walked.
 *   • Sparkle pings sit on every milestone, twinkling.
 * ───────────────────────────────────────────────────────────────────── */
function FallbackGuides() {
  const MILESTONES = [
    { x: 14, y: 82, n: "1" },
    { x: 32, y: 60, n: "2" },
    { x: 50, y: 42, n: "3" },
    { x: 70, y: 38, n: "4" },
    { x: 86, y: 18, n: "5" },
  ];
  const pathD = "M 14 82 C 30 62, 32 40, 50 42 S 80 60, 86 18";

  return (
    <Stage>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="cp3-path" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#F39C32" />
            <stop offset="1" stopColor="#F8B660" />
          </linearGradient>
        </defs>

        {/* Faint backing path */}
        <path
          d={pathD}
          fill="none"
          stroke="#F39C32"
          strokeOpacity="0.18"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Continuously streaming dashed overlay */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#cp3-path)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray="3 2"
          style={{ animation: "cp-flow 1.6s linear infinite reverse" }}
        />

        {/* Static milestone discs */}
        {MILESTONES.map((m, i) => (
          <g key={m.n}>
            <circle cx={m.x} cy={m.y} r="3.2" fill="#FFFFFF" stroke="#F39C32" strokeWidth="0.7" />
            <text
              x={m.x}
              y={m.y + 1.1}
              textAnchor="middle"
              fontSize="3"
              fontWeight="700"
              fill="#F39C32"
              style={{ fontFamily: "ui-sans-serif, system-ui" }}
            >
              {m.n}
            </text>
            {/* Sparkle twinkle — tiny ring that pulses on each milestone */}
            <circle
              cx={m.x}
              cy={m.y}
              r="3.2"
              fill="none"
              stroke="#F39C32"
              strokeWidth="0.4"
              style={{
                transformOrigin: `${m.x}px ${m.y}px`,
                animation: "cp-twinkle 3s ease-in-out infinite",
                animationDelay: `${i * 0.4}s`,
              }}
            />
          </g>
        ))}

        {/* "Current step" glow ring that cycles through milestones.
           One ring whose cx/cy/r are animated through each milestone's
           coordinates with SMIL `<animate>` — runs forever, no JS. */}
        <circle r="5" fill="none" stroke="#F39C32" strokeWidth="0.8" opacity="0.85">
          <animate
            attributeName="cx"
            dur="6s"
            repeatCount="indefinite"
            values={MILESTONES.map((m) => m.x).join(";")}
            keyTimes="0;0.25;0.5;0.75;1"
            calcMode="discrete"
          />
          <animate
            attributeName="cy"
            dur="6s"
            repeatCount="indefinite"
            values={MILESTONES.map((m) => m.y).join(";")}
            keyTimes="0;0.25;0.5;0.75;1"
            calcMode="discrete"
          />
          <animate
            attributeName="r"
            dur="1.2s"
            repeatCount="indefinite"
            values="3.5;6;3.5"
          />
          <animate
            attributeName="opacity"
            dur="1.2s"
            repeatCount="indefinite"
            values="0.85;0.2;0.85"
          />
        </circle>
      </svg>
    </Stage>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * Stage 4 — "It grows."
 *   • Teal→gold path with steady glow.
 *   • Four lit milestones, each pulsing in soft sequence.
 *   • Two unlit milestones at the path's end — the first one is in a
 *     continuous "unlocking" loop: fills, scales, sparkles, resets.
 *   • Warm horizon gradient breathes in the background.
 *   • Floating warm particles drift upward across the frame forever.
 * ───────────────────────────────────────────────────────────────────── */
function FallbackGrows() {
  const PARTICLES = Array.from({ length: 9 }, (_, i) => ({
    left: `${(i * 11 + 6) % 100}%`,
    delay: `${(i * 0.7) % 5}s`,
    size: 1 + (i % 3),
  }));

  const MILESTONES = [
    { x: 10, y: 86, lit: true,  delay: 0   },
    { x: 28, y: 74, lit: true,  delay: 0.3 },
    { x: 46, y: 52, lit: true,  delay: 0.6 },
    { x: 62, y: 42, lit: true,  delay: 0.9 },
    { x: 80, y: 28, lit: false, delay: 0   }, // the unlocking one
    { x: 94, y: 10, lit: false, delay: 0   },
  ];
  const pathD = "M 10 86 C 30 76, 35 50, 55 45 S 85 30, 94 10";

  return (
    <Stage>
      {/* Horizon glow — breathes */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 80% 15%, rgba(248,182,96,0.55), rgba(248,182,96,0) 55%)",
          animation: "cp-horizon-breathe 5s ease-in-out infinite",
        }}
      />

      {/* Floating warm particles drifting upward */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute bottom-0 rounded-full bg-[var(--orange-400)]"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: 0.5,
            animation: "cp-rise 6s linear infinite",
            animationDelay: p.delay,
          }}
        />
      ))}

      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="cp4-path" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#2EB6B5" />
            <stop offset="100%" stopColor="#F8B660" />
          </linearGradient>
        </defs>

        {/* Path */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#cp4-path)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Milestones */}
        {MILESTONES.map((m, i) => (
          <g key={i}>
            {m.lit ? (
              <>
                {/* outer pulsing glow */}
                <circle
                  cx={m.x}
                  cy={m.y}
                  r="5.5"
                  fill="#F39C32"
                  opacity="0.18"
                  style={{
                    transformOrigin: `${m.x}px ${m.y}px`,
                    animation: "cp-milestone-glow 2.4s ease-in-out infinite",
                    animationDelay: `${m.delay}s`,
                  }}
                />
                <circle cx={m.x} cy={m.y} r="3.4" fill="#F39C32" stroke="#F39C32" strokeWidth="0.7" />
              </>
            ) : i === 4 ? (
              // The "unlocking" milestone — cycles fill from white→orange forever
              <g style={{ transformOrigin: `${m.x}px ${m.y}px` }}>
                <circle
                  cx={m.x}
                  cy={m.y}
                  r="5.5"
                  fill="#F39C32"
                  opacity="0"
                  style={{
                    transformOrigin: `${m.x}px ${m.y}px`,
                    animation: "cp-unlock-halo 3.4s ease-in-out infinite",
                  }}
                />
                <circle
                  cx={m.x}
                  cy={m.y}
                  r="3.4"
                  fill="#FFFFFF"
                  stroke="#F39C32"
                  strokeWidth="0.7"
                  style={{ animation: "cp-unlock-fill 3.4s ease-in-out infinite" }}
                />
              </g>
            ) : (
              <circle cx={m.x} cy={m.y} r="3.4" fill="#FFFFFF" stroke="#2EB6B5" strokeOpacity="0.5" strokeWidth="0.7" />
            )}
          </g>
        ))}
      </svg>
    </Stage>
  );
}

const FALLBACKS = [FallbackListens, FallbackMaps, FallbackGuides, FallbackGrows];

/* ──────────────── Left visual — crossfades to the active stage ──────────────── */

function StickyVisual({ active }: { active: number }) {
  const step = STEPS[active];
  const Fallback = FALLBACKS[active];
  return (
    <div className="relative aspect-square w-full max-w-[440px]">
      {/* Only the ACTIVE stage is mounted — its animated fallback (sonar /
          particles / SMIL paths) is heavy, so rendering just one keeps the
          frame rate high and the scroll fluid. AnimatePresence crossfades the
          outgoing stage out as the new one fades in. */}
      <AnimatePresence>
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.015 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="absolute inset-0"
        >
          <Fallback />
          <Image
            src={step.image}
            alt={step.alt}
            fill
            sizes="(max-width: 1024px) 90vw, 560px"
            className="rounded-[32px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ──────────────── Right side — vertical focus stepper ────────────────
 * All four steps stay on screen as a lit timeline. The ACTIVE step expands
 * its description; the others recede to a dim title. The connector below a
 * completed step fills in, and a thin bar under the active title tracks how
 * far you've scrolled toward the next step. Pure scroll-driven focus — no
 * snap, no empty gaps. */

function FocusStep({
  step,
  index,
  active,
  progress,
}: {
  step: Step;
  index: number;
  active: number;
  progress: MotionValue<number>;
}) {
  const isActive = index === active;
  const isDone = index < active;
  const isLast = index === STEPS.length - 1;

  // Fraction scrolled through THIS step's dwell (0→1) — fills the "time to
  // next" bar under the active title.
  const local = useTransform(
    progress,
    [index / STEPS.length, (index + 1) / STEPS.length],
    [0, 1],
    { clamp: true },
  );

  return (
    <div className="flex gap-5">
      {/* Rail: node + connector down to the next step */}
      <div className="flex flex-col items-center">
        <motion.div
          animate={{ scale: isActive ? 1.1 : 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[color:var(--border-subtle)] bg-white"
        >
          {/* gradient fill for active + completed nodes */}
          <motion.span
            aria-hidden
            animate={{ opacity: isActive || isDone ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-full"
            style={{ backgroundImage: "var(--gradient-cool)" }}
          />
          {isActive && (
            <span aria-hidden className="absolute -inset-1 rounded-full ring-2 ring-[var(--teal-500)]/35" />
          )}
          <span className={`relative text-[12px] font-semibold tracking-wider ${isActive || isDone ? "text-white" : "text-[var(--ink-tertiary)]"}`}>
            {step.num}
          </span>
        </motion.div>

        {!isLast && (
          <div className="relative my-1.5 w-[2px] flex-1 overflow-hidden rounded-full bg-[var(--border)]">
            <motion.div
              aria-hidden
              className="absolute inset-x-0 top-0 rounded-full"
              style={{ backgroundImage: "var(--gradient-cool)" }}
              animate={{ height: isDone ? "100%" : "0%" }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pb-10">
        <motion.h3
          animate={{ opacity: isActive ? 1 : 0.32 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--ink-primary)]"
          style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
        >
          {step.title}
        </motion.h3>

        <AnimatePresence initial={false}>
          {isActive && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="overflow-hidden"
            >
              <p className="mt-3 max-w-[440px] text-[16px] leading-[1.65] text-[var(--ink-secondary)] md:text-[17px]">
                {step.body}
              </p>
              <div className="mt-5 h-[3px] w-32 overflow-hidden rounded-full bg-[var(--border)]">
                <motion.div
                  className="h-full origin-left rounded-full"
                  style={{ scaleX: local, backgroundImage: "var(--gradient-cool)" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ──────────────── Main section ──────────────── */

export function CareerPilot() {
  // The pinned scroll-timeline: this tall element provides the scroll
  // distance; its inner `sticky` child stays pinned full-viewport while the
  // four steps take focus one after another. `active` is derived from scroll
  // progress and drives BOTH the left crossfade and the right focus stepper,
  // so they stay in perfect sync.
  const timelineRef = useRef<HTMLDivElement>(null);
  // Drive everything off the RAW scroll progress (no spring): scroll-linked
  // motion values already update once per frame, so this tracks the wheel
  // 1:1 with zero lag — the fluid feel. A spring here only adds trailing
  // sluggishness.
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start start", "end end"],
  });

  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)));
    setActive(i);
  });

  return (
    <section className="relative bg-white">
      {/* Giant pillar 03 — holds for the whole Career Pilot (Pillar 3 / SaaS)
          section. Sits behind content (z-0); everything else is z-10. */}
      <PillarNumberBackdrop number="03" align="right" />

      {/* Header — marks the entry into Pillar 3 (SaaS). */}
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pt-28 md:pt-36 lg:px-12">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]">
          Pillar 3 · Software as a Service
        </p>
        <h2
          className="mt-4 max-w-[760px] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
          style={{ fontSize: "clamp(2.25rem, 4.6vw, 3.75rem)" }}
        >
          AI Career Pilot.
        </h2>
        <p className="mt-5 max-w-[640px] text-[17px] leading-[1.6] text-[var(--ink-secondary)] md:text-[19px]">
          A personalised guidance agent in every student&apos;s dashboard.
          It reads their work, finds their strengths, and builds the path
          forward.
        </p>
      </div>

      {/* ── Desktop: pinned scroll-timeline ──
          The tall outer div is the scroll runway; its sticky child stays
          pinned for the whole runway while `active` advances 0→3. */}
      <div
        ref={timelineRef}
        className="relative z-10 hidden lg:block"
        style={{ height: `${STEPS.length * 56}vh` }}
      >
        <div className="sticky top-0 flex h-screen items-center">
          <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-12">
            <div className="grid grid-cols-12 items-center gap-10">
              {/* Left — crossfading visual */}
              <div className="col-span-6 flex justify-center">
                <StickyVisual active={active} />
              </div>
              {/* Right — focus stepper */}
              <div className="col-span-6">
                {STEPS.map((step, i) => (
                  <FocusStep key={step.num} step={step} index={i} active={active} progress={scrollYProgress} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile / tablet: stacked, each step gets its own image ── */}
      <div className="relative z-10 mx-auto max-w-[720px] px-6 pb-24 pt-12 lg:hidden">
        <div className="space-y-20">
          {STEPS.map((step, i) => {
            const Fallback = FALLBACKS[i];
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-[28px]">
                  <Fallback />
                  <Image
                    src={step.image}
                    alt={step.alt}
                    fill
                    sizes="90vw"
                    className="rounded-[28px] object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                  />
                </div>
                <div className="mt-6 flex items-start gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold tracking-wider text-white" style={{ backgroundImage: "var(--gradient-cool)" }}>
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[16px] leading-[1.6] text-[var(--ink-secondary)]">
                      {step.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
