"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const problems = [
  "Learning data sits in silos — spreadsheets, notebooks, disconnected apps.",
  "Teachers spend hours on grading that could be automated in seconds.",
  "Students leave Class 12 without a clear view of their strengths or options.",
  "Schools know AI matters, but can't operationalise it beyond a workshop.",
];

export function StorySection() {
  return (
    <section id="story" className="relative overflow-hidden py-20 md:py-28">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* Left: headline + why */}
          <div>
            <MotionSection>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Our story
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl lg:text-[42px] lg:leading-[1.12]">
                Indian schools are ready for AI. <br className="hidden md:block" />
                The tools weren&apos;t.
              </h2>
            </MotionSection>

            <MotionSection className="mt-6" delay={1}>
              <p className="text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
                We started Skillship after spending time inside real classrooms across
                India. We saw dedicated teachers, curious students, and principals trying
                hard to make AI part of their programs — using tools built for a
                different kind of school, in a different decade.
              </p>
            </MotionSection>

            <MotionSection className="mt-5" delay={2}>
              <p className="text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
                The gap wasn&apos;t interest. It was infrastructure. So we built the layer
                that sits quietly underneath — turning every quiz attempt, career
                conversation, and workshop hour into signal schools can act on.
              </p>
            </MotionSection>

            <MotionSection className="mt-8" delay={3}>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s-6-4.35-6-10a4 4 0 0 1 7-2.65A4 4 0 0 1 20 11c0 5.65-8 10-8 10Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Why we exist
                  </p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Make AI learning measurable for every Indian school.
                  </p>
                </div>
              </div>
            </MotionSection>
          </div>

          {/* Right: problem list with visual spine */}
          <MotionSection delay={2}>
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-primary/8 via-accent/5 to-transparent blur-2xl" />

              <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(5,150,105,0.25)] md:p-8">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  The problem we saw
                </div>

                <div className="relative mt-6 space-y-5 pl-7">
                  {/* Vertical line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-red-200 via-[var(--border)] to-transparent" aria-hidden="true" />

                  {problems.map((p, i) => (
                    <motion.div
                      key={p}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.12 }}
                      className="relative flex items-start gap-3"
                    >
                      <span
                        className="absolute flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[var(--muted)] text-[10px] font-bold text-[var(--muted-foreground)]"
                        style={{ left: "-29px", top: "-1px" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm leading-relaxed text-[var(--foreground)] md:text-base">
                        {p}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Skillship&apos;s answer
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)] md:text-base">
                    A single connected system — quizzes, analytics, and AI career
                    guidance — that fits real school timetables and surfaces the
                    signals leaders actually need.
                  </p>
                </div>
              </div>
            </div>
          </MotionSection>
        </div>
      </Container>
    </section>
  );
}
