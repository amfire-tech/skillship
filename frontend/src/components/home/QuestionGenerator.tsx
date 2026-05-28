/*
 * File:    frontend/src/components/home/QuestionGenerator.tsx
 * Purpose: Third "wow" — looping demonstration of teachers uploading a PDF
 *          and the AI generating MCQs (brief §7). Two-column on desktop:
 *          looping HTML/SVG demo on the left, explanation on the right.
 *
 *          Animation model: a phase state machine ticks 0 → 4 → 0 …
 *          Every subcomponent reads the current phase and animates between
 *          simple {in,out} states — no keyframe-with-times arrays. We
 *          avoid the `times` path entirely because Framer Motion 12's WAAPI
 *          engine validates the compiled offsets aggressively under
 *          `repeat: Infinity` and rejects some keyframe shapes that look
 *          valid on paper. Phases are explicit, debuggable, and faster.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ──────────────── Phase state machine ──────────────── */

/** 0 idle • 1 PDF drops • 2 processing • 3 MCQs appear • 4 toast */
type Phase = 0 | 1 | 2 | 3 | 4;
/** Time (ms) each phase holds before advancing. Total = 7000ms cycle. */
const PHASE_MS: Record<Phase, number> = { 0: 600, 1: 1000, 2: 1100, 3: 2400, 4: 1900 };

function usePhaseLoop(active: boolean): Phase {
  const [phase, setPhase] = useState<Phase>(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    function tick(p: Phase) {
      if (cancelled) return;
      setPhase(p);
      timer = setTimeout(() => tick(((p + 1) % 5) as Phase), PHASE_MS[p]);
    }
    tick(0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [active]);

  return phase;
}

/* ──────────────── Subcomponents driven by phase ──────────────── */

function PdfDoc({ phase }: { phase: Phase }) {
  // Visible from phase 1 onward, exits during phase 0 (reset).
  const shown = phase >= 1;
  return (
    <motion.div
      animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : -18 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative h-[180px] w-[140px] shrink-0 rounded-2xl border border-[color:var(--border-subtle)] bg-white p-3 shadow-medium"
    >
      <div className="flex items-center gap-1.5">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-[var(--orange-500)] text-[8px] font-bold text-white">
          PDF
        </span>
        <span className="truncate text-[10px] font-semibold text-[var(--ink-secondary)]">
          ch5-thermo.pdf
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {[100, 88, 95, 70, 92, 84, 60].map((w, i) => (
          <div key={i} className="h-1 rounded-full bg-[var(--cream)]" style={{ width: `${w}%` }} />
        ))}
      </div>

      {/* Scanning bar — runs only during phase 2 (processing). Plain CSS
         animation: mounts when phase === 2, unmounts after, so the sweep
         restarts each loop. */}
      {phase === 2 && (
        <div
          className="qg-scan-sweep absolute inset-x-3 top-0 h-1 rounded-full"
          style={{
            backgroundImage: "linear-gradient(90deg, transparent, #2EB6B5 50%, transparent)",
            boxShadow: "0 0 12px rgba(46,182,181,0.7)",
            animation: "qg-scan-sweep 1s linear forwards",
          }}
        />
      )}
    </motion.div>
  );
}

function ProcessingDots({ phase }: { phase: Phase }) {
  const shown = phase === 2;
  return (
    <motion.div
      animate={{ opacity: shown ? 1 : 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex items-center gap-1.5"
    >
      {/* Plain spans with CSS animation — scalar/array swap on the y
         keyframe was the WAAPI choke point, so we bypass FM here entirely. */}
      {[0, 0.15, 0.3].map((d) => (
        <span
          key={d}
          className="qg-dot-bounce h-1.5 w-1.5 rounded-full bg-[var(--orange-500)]"
          style={{
            animation: shown ? `qg-dot-bounce 0.9s ${d}s ease-in-out infinite` : "none",
            opacity: shown ? undefined : 0,
          }}
        />
      ))}
      <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
        AI
      </span>
    </motion.div>
  );
}

function McqCard({
  phase, slot, difficulty, question,
}: { phase: Phase; slot: 0 | 1 | 2; difficulty: "Easy" | "Medium" | "Hard"; question: string }) {
  // MCQs appear during phase 3, with per-slot stagger. Exit at phase 0 (reset).
  const shown = phase >= 3 && phase !== 0;
  // Pill colours work in both modes: light-mode foreground is the deep
  // brand shade for AA on light bg; `dark:` variant lifts to a lighter
  // sibling so the same pill stays readable on the dark translucent bg.
  const pill =
    difficulty === "Easy"
      ? "bg-[var(--green-accent)]/15 text-[#2D8C36] dark:text-[#7BD685]"
      : difficulty === "Medium"
      ? "bg-[var(--orange-500)]/15 text-[var(--orange-600)] dark:text-[#F8B660]"
      : "bg-[#E94F37]/15 text-[#B43A28] dark:text-[#F08877]";

  return (
    <motion.div
      animate={{ opacity: shown ? 1 : 0, x: shown ? 0 : 16 }}
      transition={{ duration: 0.55, ease: EASE, delay: shown ? slot * 0.22 : 0 }}
      className="rounded-xl border border-[color:var(--border-subtle)] bg-white p-3 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${pill}`}>
          {difficulty}
        </span>
        <span className="text-[8.5px] font-semibold text-[var(--ink-tertiary)]">MCQ</span>
      </div>
      <p className="mt-2 line-clamp-2 text-[10.5px] font-semibold leading-snug text-[var(--ink-primary)]">
        {question}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {["A", "B", "C", "D"].map((k) => (
          <div key={k} className="flex items-center gap-1 rounded-md bg-[var(--cream-soft)] px-1.5 py-1">
            <span className="grid h-3 w-3 place-items-center rounded-full bg-white text-[7px] font-bold text-[var(--ink-tertiary)]">{k}</span>
            <span className="h-0.5 w-full rounded-full bg-[var(--cream)]" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ImportedToast({ phase }: { phase: Phase }) {
  const shown = phase === 4;
  return (
    <motion.div
      animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 12 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-full px-3 py-2 text-[10.5px] font-semibold text-white shadow-cool"
      style={{ backgroundImage: "var(--gradient-cool)" }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12 5 5L20 7" />
      </svg>
      Imported to question bank
    </motion.div>
  );
}

/* ──────────────── Full demo panel ──────────────── */

function DemoPanel() {
  const ref = useRef<HTMLDivElement>(null);
  // Pause animation if section is offscreen (perf + battery).
  const inView = useInView(ref, { amount: 0.2 });
  const phase = usePhaseLoop(inView);

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-[color:var(--border-subtle)] bg-[var(--cream-soft)] shadow-medium"
    >
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(243,156,50,0.10), transparent 60%)" }} />
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 75% 60%, rgba(46,182,181,0.10), transparent 60%)" }} />

      <div className="relative flex h-full items-stretch gap-4 p-6">
        {/* Left: PDF + processing */}
        <div className="flex flex-col items-center justify-center gap-3">
          <PdfDoc phase={phase} />
          <ProcessingDots phase={phase} />
        </div>

        {/* Centre arrow — pure CSS nudge. The previous infinite-repeat
           keyframe-array on motion.svg was triggering FM12's WAAPI offset
           validation at mount, so we use plain CSS keyframes here. */}
        <div className="flex flex-col items-center justify-center text-[var(--ink-tertiary)]">
          <svg
            className="qg-arrow-nudge"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: "qg-arrow-nudge 1.4s ease-in-out infinite" }}
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>

        {/* Right: MCQ cards stack */}
        <div className="flex flex-1 flex-col justify-center gap-2.5">
          <McqCard phase={phase} slot={0} difficulty="Easy"   question="What does the first law of thermodynamics state?" />
          <McqCard phase={phase} slot={1} difficulty="Medium" question="In an isothermal process, internal energy change is…" />
          <McqCard phase={phase} slot={2} difficulty="Hard"   question="Calculate the entropy change for a reversible cycle…" />
        </div>
      </div>

      <ImportedToast phase={phase} />
    </div>
  );
}

/* ──────────────── Exported section ──────────────── */

export function QuestionGenerator() {
  return (
    <section className="bg-[var(--bg-warm)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-14 px-6 py-28 md:py-36 lg:grid-cols-12 lg:gap-10 lg:px-12">
        {/* Left: demo */}
        <div className="lg:col-span-7">
          <DemoPanel />
        </div>

        {/* Right: copy */}
        <div className="lg:col-span-5">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
          >
            For teachers
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
          >
            Upload a PDF.<br />Get a quiz.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
            className="mt-6 text-[17px] leading-[1.65] text-[var(--ink-secondary)]"
          >
            Skillship reads any PDF you upload — textbooks, notes, worksheets —
            and generates MCQs, True/False, and short-answer questions across
            Easy, Medium, and Hard difficulty.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
            className="mt-4 text-[17px] leading-[1.65] text-[var(--ink-secondary)]"
          >
            One click. Imported straight to your question bank.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
            className="mt-4 text-[17px] font-semibold leading-[1.5] text-[var(--ink-primary)]"
          >
            Hours saved. Every week.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
