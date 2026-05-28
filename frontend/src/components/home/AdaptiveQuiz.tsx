/*
 * File:    frontend/src/components/home/AdaptiveQuiz.tsx
 * Purpose: Second "wow" — dark section, animated SVG difficulty curve
 *          (brief §6). Pure SVG + Framer Motion, no images.
 *
 *          The line and the moving dot are tied to the section's scroll
 *          progress: as you scroll past, the curve draws left-to-right and
 *          the glowing orange dot tracks the head of the line. Four
 *          tooltips appear at Q2/4/6/8 keyed to scroll position.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

// Curve sampled across 10 question slots. y in [0..40] where 4 = Easy top,
// 36 = Hard bottom (SVG y grows downward, so smaller y = harder difficulty).
// Path traces the brief's narrative: starts medium, climbs after a correct
// answer, dips after a wrong one, climbs again to max difficulty.
const POINTS: Array<{ q: number; y: number; tip?: { text: string; flavor: "up" | "down" } }> = [
  { q: 1, y: 24 },
  { q: 2, y: 18, tip: { text: "Correct → harder",  flavor: "up"   } },
  { q: 3, y: 14 },
  { q: 4, y: 22, tip: { text: "Wrong → softer",    flavor: "down" } },
  { q: 5, y: 18 },
  { q: 6, y: 12, tip: { text: "Correct → harder",  flavor: "up"   } },
  { q: 7, y: 8  },
  { q: 8, y: 5,  tip: { text: "Max difficulty",    flavor: "up"   } },
  { q: 9, y: 6  },
  { q: 10, y: 5 },
];

// Map a question index 1..10 to its (x, y) in the 100×40 SVG viewBox.
function xFor(q: number) { return 8 + ((q - 1) / 9) * 84; }

// Build the SVG path string from POINTS using a smooth Catmull-Rom approx.
function buildPath() {
  const pts = POINTS.map((p) => ({ x: xFor(p.q), y: p.y }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const PATH_D = buildPath();

/* ──────────────── tooltip card ──────────────── */

function Tooltip({
  x, y, text, flavor, show,
}: {
  x: number; y: number; text: string; flavor: "up" | "down"; show: MotionValue<number>;
}) {
  // Tooltip floats above the dot for "up" and below for "down".
  const dy = flavor === "up" ? -9 : 7;
  return (
    <motion.g style={{ opacity: show }}>
      <foreignObject x={x - 14} y={y + dy - 3.5} width="28" height="7">
        {/* HTML inside SVG via foreignObject so we get real text rendering */}
        <div
          // @ts-expect-error xmlns required for foreignObject HTML children
          xmlns="http://www.w3.org/1999/xhtml"
          className="flex h-full w-full items-center justify-center rounded-[2px] bg-[var(--cream-soft)] px-1 text-[2.2px] font-semibold leading-none text-[var(--ink-primary)] shadow-soft"
        >
          {flavor === "up" ? "✓ " : "✗ "}{text}
        </div>
      </foreignObject>
      {/* connector dot at the data point */}
      <circle cx={x} cy={y} r="0.9" fill="#FFFFFF" stroke={flavor === "up" ? "#F39C32" : "#2EB6B5"} strokeWidth="0.35" />
    </motion.g>
  );
}

/* ──────────────── main section ──────────────── */

export function AdaptiveQuiz() {
  const ref = useRef<HTMLDivElement>(null);
  // Map scroll-into-view → 0..1 progress for the chart drawing.
  // We use 0 at section entering bottom of viewport, 1 at section centered.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 30%"],
  });

  // pathLength accepts a MotionValue directly — draws as you scroll.
  const pathLength = useTransform(scrollYProgress, [0, 0.85], [0, 1]);

  // Dot position — sample the path at progress.
  // Easier approach: linearly interpolate along the POINTS list by progress.
  const dotProgress = useTransform(scrollYProgress, [0, 0.9], [0, 1]);
  const dotX = useTransform(dotProgress, (p) => {
    const seg = Math.min(POINTS.length - 1, p * (POINTS.length - 1));
    const i = Math.floor(seg);
    const t = seg - i;
    const a = POINTS[i] ?? POINTS[0];
    const b = POINTS[Math.min(POINTS.length - 1, i + 1)] ?? a;
    return xFor(a.q) + (xFor(b.q) - xFor(a.q)) * t;
  });
  const dotY = useTransform(dotProgress, (p) => {
    const seg = Math.min(POINTS.length - 1, p * (POINTS.length - 1));
    const i = Math.floor(seg);
    const t = seg - i;
    const a = POINTS[i] ?? POINTS[0];
    const b = POINTS[Math.min(POINTS.length - 1, i + 1)] ?? a;
    return a.y + (b.y - a.y) * t;
  });

  // Tooltip visibility windows — each shows briefly as the dot crosses its Q.
  // Hooks must be called unconditionally, so each tip is its own useTransform.
  const tip2 = useTransform(scrollYProgress, [1/9 - 0.08, 1/9 - 0.02, 1/9 + 0.18, 1/9 + 0.26], [0, 1, 1, 0]);
  const tip4 = useTransform(scrollYProgress, [3/9 - 0.08, 3/9 - 0.02, 3/9 + 0.18, 3/9 + 0.26], [0, 1, 1, 0]);
  const tip6 = useTransform(scrollYProgress, [5/9 - 0.08, 5/9 - 0.02, 5/9 + 0.18, 5/9 + 0.26], [0, 1, 1, 0]);
  const tip8 = useTransform(scrollYProgress, [7/9 - 0.08, 7/9 - 0.02, 7/9 + 0.18, 7/9 + 0.26], [0, 1, 1, 0]);
  const tipVisByQ: Record<number, MotionValue<number>> = { 2: tip2, 4: tip4, 6: tip6, 8: tip8 };

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-[var(--bg-dark)]"
    >
      {/* warm noise — very faint, makes the dark feel rich */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]">
        <filter id="adq-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.85  0 0 0 0 0.55  0 0 0 0.6 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#adq-noise)" />
      </svg>

      {/* ambient warm glow */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-72 w-2/3 rounded-full opacity-30 blur-3xl"
           style={{ backgroundImage: "radial-gradient(ellipse at center, rgba(243,156,50,0.55), transparent 65%)" }}
      />

      <div className="mx-auto max-w-[1100px] px-6 py-32 text-center md:py-40 lg:px-12">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--orange-500)]"
        >
          Adaptive Quiz Engine
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          className="mx-auto mt-5 max-w-[760px] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--ink-inverse)]"
          style={{ fontSize: "clamp(2.25rem, 4.6vw, 3.75rem)" }}
        >
          The quiz that meets every student where they are.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 0.7, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          className="mx-auto mt-5 max-w-[620px] text-[16.5px] leading-[1.6] text-[var(--ink-inverse)] md:text-[18px]"
        >
          Difficulty adjusts in real time based on past performance.
        </motion.p>

        {/* Chart */}
        <div className="mx-auto mt-16 w-full max-w-[820px]">
          <svg
            // viewBox extended left by 8 units so the y-axis labels
            // ("Hard"/"Med"/"Easy"), which render with textAnchor="end"
            // at x=3, have room to draw their full glyphs without
            // being clipped at the SVG's left edge.
            viewBox="-8 0 108 44"
            preserveAspectRatio="xMidYMid meet"
            className="h-auto w-full"
            aria-label="Adaptive difficulty curve across ten quiz questions"
          >
            <defs>
              <linearGradient id="adq-grad" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0"   stopColor="#F39C32" />
                <stop offset="1"   stopColor="#2EB6B5" />
              </linearGradient>
              <radialGradient id="adq-dot" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0"   stopColor="#FFFFFF" />
                <stop offset="0.6" stopColor="#F39C32" />
                <stop offset="1"   stopColor="#F39C32" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* axis baseline + faint gridlines */}
            {[8, 16, 24, 32].map((y) => (
              <line key={y} x1="6" x2="94" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.15" />
            ))}
            <line x1="6" x2="94" y1="38" y2="38" stroke="rgba(255,255,255,0.18)" strokeWidth="0.2" />

            {/* y-axis labels — Easy / Medium / Hard */}
            <text x="3" y="9"  fontSize="2"   fontWeight="600" fill="rgba(255,255,255,0.45)" textAnchor="end">Hard</text>
            <text x="3" y="22" fontSize="2"   fontWeight="600" fill="rgba(255,255,255,0.45)" textAnchor="end">Med</text>
            <text x="3" y="35" fontSize="2"   fontWeight="600" fill="rgba(255,255,255,0.45)" textAnchor="end">Easy</text>

            {/* x-axis ticks 1..10 */}
            {POINTS.map((p) => (
              <g key={p.q}>
                <line x1={xFor(p.q)} x2={xFor(p.q)} y1="37.5" y2="38.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.15" />
                <text x={xFor(p.q)} y="41" fontSize="1.8" fill="rgba(255,255,255,0.5)" textAnchor="middle">{p.q}</text>
              </g>
            ))}

            {/* The line — drawn as scroll progresses */}
            <motion.path
              d={PATH_D}
              fill="none"
              stroke="url(#adq-grad)"
              strokeWidth="0.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pathLength, filter: "drop-shadow(0 0 0.6px rgba(243,156,50,0.5))" }}
            />

            {/* Glowing leading dot */}
            <motion.circle cx={dotX} cy={dotY} r="2.4" fill="url(#adq-dot)" />
            <motion.circle cx={dotX} cy={dotY} r="0.9" fill="#F39C32" />

            {/* tooltips at Q2/4/6/8 */}
            {POINTS.filter((p) => p.tip).map((p) => (
              <Tooltip
                key={p.q}
                x={xFor(p.q)}
                y={p.y}
                text={p.tip!.text}
                flavor={p.tip!.flavor}
                show={tipVisByQ[p.q]}
              />
            ))}
          </svg>
        </div>

        {/* Three closing lines */}
        <div className="mx-auto mt-16 grid max-w-[860px] gap-6 md:grid-cols-3">
          {[
            "Strong students stay challenged.",
            "Struggling students stay supported.",
            "Everyone gets calibrated growth.",
          ].map((line, i) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 0.85, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.15, ease: EASE }}
              className="text-[15px] font-medium leading-[1.5] text-[var(--ink-inverse)] md:text-[16px]"
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
