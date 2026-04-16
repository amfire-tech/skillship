"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

/* ── Flow stages ── */
const stages = [
  {
    label: "Student",
    sub: "Takes quiz",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" />
      </svg>
    ),
  },
  {
    label: "Quiz Engine",
    sub: "AI-generated MCQs",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 10h6" /><path d="M9 14h4" />
      </svg>
    ),
  },
  {
    label: "AI Layer",
    sub: "Analyzes responses",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
        <path d="M12 22c5 0 8-2.5 8-6v-2c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v2c0 3.5 3 6 8 6Z" />
      </svg>
    ),
    highlight: true,
  },
  {
    label: "Teacher",
    sub: "Gets insights",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: "Principal",
    sub: "Sees school-wide view",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
      </svg>
    ),
  },
];

export function SystemFlow() {
  return (
    <section className="relative overflow-hidden border-y border-[var(--border)] bg-[linear-gradient(180deg,#FFFFFF_0%,#F0FAF5_100%)] py-20 md:py-28">
      <Container>
        <MotionSection className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            How the system flows
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
            One action. Five connected outcomes.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            A single quiz attempt becomes live insight for teachers, data for
            principals, and guidance for students — all in real time.
          </p>
        </MotionSection>

        {/* Desktop horizontal flow */}
        <div className="mt-16 hidden md:block">
          <div className="relative mx-auto max-w-6xl">
            {/* Animated flow line */}
            <svg
              className="absolute left-[8%] right-[8%] top-[52px] h-2 w-[84%]"
              viewBox="0 0 1000 8"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="flow-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D1FAE5" />
                  <stop offset="50%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#0D9488" />
                </linearGradient>
              </defs>
              <motion.line
                x1="0"
                y1="4"
                x2="1000"
                y2="4"
                stroke="url(#flow-line-grad)"
                strokeWidth="2"
                strokeDasharray="8 6"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </svg>

            <div className="grid grid-cols-5 gap-4">
              {stages.map((stage, i) => (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`relative z-10 flex h-[104px] w-[104px] items-center justify-center rounded-[24px] border-2 ${
                      stage.highlight
                        ? "border-primary bg-gradient-to-br from-primary to-accent text-white shadow-[0_20px_50px_-15px_rgba(5,150,105,0.5)]"
                        : "border-[var(--border)] bg-white text-primary shadow-sm"
                    }`}
                  >
                    {/* Pulse ring for AI stage */}
                    {stage.highlight && (
                      <span className="absolute inset-0 rounded-[24px] border-2 border-primary/40 animate-[ping_2s_ease-in-out_infinite]" />
                    )}
                    {stage.icon}
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[var(--foreground)]">
                    {stage.label}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {stage.sub}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile vertical flow */}
        <div className="mt-12 md:hidden">
          <div className="relative space-y-5 pl-8">
            <div className="absolute left-[31px] top-3 bottom-3 w-px bg-gradient-to-b from-primary/20 via-primary/50 to-accent/30" aria-hidden="true" />
            {stages.map((stage, i) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative flex items-center gap-4"
              >
                <div
                  className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 ${
                    stage.highlight
                      ? "border-primary bg-gradient-to-br from-primary to-accent text-white"
                      : "border-[var(--border)] bg-white text-primary"
                  }`}
                  style={{ marginLeft: "-33px" }}
                >
                  {stage.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)]">
                    {stage.label}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {stage.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
