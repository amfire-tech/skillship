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

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
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
      {/* Sonar rings — expand from centre, fade as they grow */}
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className="absolute left-1/2 top-1/2 h-20 w-20 rounded-full border-2 border-[var(--teal-500)]"
          style={{
            animation: "cp-sonar 4s ease-out infinite",
            animationDelay: `${i * 1}s`,
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

/* ──────────────── Single sticky visual ──────────────── */

function StickyVisual({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  // Crossfade ranges — each image is fully visible across its quarter of
  // the scroll, with 12% bridges where the next image fades in.
  const opacities = [
    useTransform(scrollYProgress, [0,    0.22, 0.30], [1, 1, 0]),
    useTransform(scrollYProgress, [0.22, 0.30, 0.47, 0.55], [0, 1, 1, 0]),
    useTransform(scrollYProgress, [0.47, 0.55, 0.72, 0.80], [0, 1, 1, 0]),
    useTransform(scrollYProgress, [0.72, 0.80, 1],          [0, 1, 1]),
  ];

  return (
    <div className="relative aspect-square w-full max-w-[420px]">
      {STEPS.map((step, i) => {
        const Fallback = FALLBACKS[i];
        return (
          <motion.div
            key={step.image}
            style={{ opacity: opacities[i] }}
            className="absolute inset-0"
          >
            {/* CSS fallback layer */}
            <Fallback />
            {/* AI-image layer on top (if file is present) */}
            <Image
              src={step.image}
              alt={step.alt}
              fill
              sizes="(max-width: 1024px) 90vw, 560px"
              className="rounded-[32px] object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ──────────────── Step indicator on the right column ──────────────── */

function StepIndicator({
  index,
  step,
  scrollYProgress,
}: {
  index: number;
  step: Step;
  scrollYProgress: MotionValue<number>;
}) {
  // Active range for this step — quarter of total scroll, with 6% bleed on either side.
  const start = index / STEPS.length;
  const end   = (index + 1) / STEPS.length;
  const activeOpacity = useTransform(
    scrollYProgress,
    [start - 0.06, start, end, end + 0.06],
    [0, 1, 1, 0]
  );

  return (
    <div className="relative flex min-h-[80vh] items-center">
      <div className="flex w-full items-start gap-5">
        {/* Step pill — animated by stacking two coloured layers and crossfading
           via opacity. We never animate a CSS-variable string directly because
           WAAPI cannot interpolate var(...) references. */}
        <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[color:var(--border-subtle)] bg-white">
          {/* active gradient fill — fades in when this step is in scroll range */}
          <motion.span
            aria-hidden
            style={{ opacity: activeOpacity, backgroundImage: "var(--gradient-cool)" }}
            className="absolute inset-0 rounded-full"
          />
          {/* inactive number — always rendered underneath */}
          <span className="absolute inset-0 grid place-items-center text-[12px] font-semibold tracking-wider text-[var(--ink-tertiary)]">
            {step.num}
          </span>
          {/* active number — opacity follows the same motion value as the bg */}
          <motion.span
            style={{ opacity: activeOpacity }}
            className="absolute inset-0 grid place-items-center text-[12px] font-semibold tracking-wider text-white"
          >
            {step.num}
          </motion.span>
        </div>

        <div>
          <h3
            className="font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)" }}
          >
            {step.title}
          </h3>
          <p className="mt-3 max-w-[440px] text-[16px] leading-[1.65] text-[var(--ink-secondary)] md:text-[17px]">
            {step.body}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Main section ──────────────── */

export function CareerPilot() {
  const sectionRef = useRef<HTMLDivElement>(null);
  // Sticky scroll bound to the section: progress goes 0→1 as the section
  // moves from "just entered the viewport" to "just left it". With sticky
  // pinning, each ~25% of progress aligns with one step block on the right.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={sectionRef} className="relative bg-white">
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

      {/* ── Desktop: two-column sticky scroll ── */}
      <div className="relative z-10 mx-auto hidden max-w-[1280px] px-6 pb-20 pt-16 lg:block lg:px-12">
        <div className="grid grid-cols-12 gap-10">
          {/* Sticky visual */}
          <div className="col-span-6">
            <div className="sticky top-24 flex h-[calc(100vh-6rem)] items-center">
              <StickyVisual scrollYProgress={scrollYProgress} />
            </div>
          </div>

          {/* Scrolling steps */}
          <div className="col-span-6">
            {STEPS.map((step, i) => (
              <StepIndicator
                key={step.num}
                index={i}
                step={step}
                scrollYProgress={scrollYProgress}
              />
            ))}
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
