"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const changes = [
  {
    before: "Teachers grade quizzes manually for hours",
    after: "Auto-graded quizzes with instant student feedback",
  },
  {
    before: "Principals wait for end-of-term reports",
    after: "Live dashboards with weekly AI summaries",
  },
  {
    before: "Students guess their career path",
    after: "Personalised AI guidance with match scores",
  },
  {
    before: "AI learning is one-off workshop events",
    after: "A continuous, measurable learning journey",
  },
  {
    before: "Parent updates are generic report cards",
    after: "Clear progress with subject-level insights",
  },
];

export function TransformSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--muted)] py-20 md:py-28">
      <Container>
        <MotionSection className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            What changes
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
            The shift schools feel in the first term.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            Not a list of features. The real operational change Skillship brings.
          </p>
        </MotionSection>

        <div className="mx-auto mt-14 max-w-4xl space-y-3 md:mt-16">
          {changes.map((c, i) => (
            <motion.div
              key={c.after}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group grid items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 transition-all hover:border-primary/30 hover:shadow-[0_16px_40px_-20px_rgba(5,150,105,0.2)] md:grid-cols-[1fr_auto_1fr] md:gap-6 md:p-5"
            >
              {/* Before */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] line-through decoration-1 md:text-base">
                  {c.before}
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden h-6 w-6 items-center justify-center text-primary md:flex">
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </motion.svg>
              </div>

              {/* After */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white shadow-[0_8px_20px_-8px_rgba(5,150,105,0.5)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)] md:text-base">
                  {c.after}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
