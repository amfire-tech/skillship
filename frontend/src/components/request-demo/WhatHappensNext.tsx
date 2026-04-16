"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const steps = [
  {
    number: "01",
    duration: "Day 0",
    title: "You submit the form",
    description:
      "Share your school context — we route your request to a specialist who works with schools like yours.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    number: "02",
    duration: "Within 1 business day",
    title: "Discovery call",
    description:
      "A 30-min walkthrough tailored to your board, size and goals — live product tour, Q&A, honest trade-offs.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10a5 5 0 0 0-5-5H4a0 0 0 0 0 0 0v14a0 0 0 0 0 0 0h6a5 5 0 0 0 5-5z" />
        <path d="m23 7-7 5 7 5V7z" />
      </svg>
    ),
  },
  {
    number: "03",
    duration: "Week 1",
    title: "Pilot setup",
    description:
      "We configure your school workspace, onboard your SubAdmin and co-design the pilot scope — one grade or school-wide.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    number: "04",
    duration: "Week 2 onwards",
    title: "Students go live",
    description:
      "Teachers generate quizzes, students start learning, and analytics flow to your dashboard — all in real time.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
        <path d="M12 3v12" />
        <path d="M5 21h14" />
      </svg>
    ),
  },
];

export function WhatHappensNext() {
  return (
    <section className="relative overflow-hidden bg-[var(--muted)]/40 py-20 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <MotionSection>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              What happens next
            </p>
          </MotionSection>
          <MotionSection className="mt-3" delay={1}>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
              From form to first lesson in{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                under two weeks
              </span>
              .
            </h2>
          </MotionSection>
          <MotionSection className="mt-4" delay={2}>
            <p className="text-base text-[var(--muted-foreground)]">
              No long procurement cycles. No months of back-and-forth. A clear,
              predictable path from your first click to live classrooms.
            </p>
          </MotionSection>
        </div>

        {/* Timeline */}
        <div className="relative mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {/* Connecting line (desktop) */}
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-primary shadow-[0_10px_30px_-15px_rgba(5,150,105,0.35)] transition-all hover:-translate-y-1 hover:border-primary/30">
                {step.icon}
                <span className="absolute -right-2 -top-2 rounded-full bg-gradient-to-br from-primary to-accent px-2 py-0.5 text-[10px] font-bold text-white">
                  {step.number}
                </span>
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {step.duration}
                </p>
                <h3 className="mt-1.5 text-lg font-bold tracking-tight text-[var(--foreground)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
