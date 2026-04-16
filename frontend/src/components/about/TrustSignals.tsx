"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const signals = [
  {
    title: "Built for Indian schools",
    description:
      "Designed around real timetables, Board patterns (CBSE, ICSE, State), and how Indian classrooms actually operate.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22h18" /><path d="M5 22V10l7-5 7 5v12" /><path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    title: "Designed for real classrooms",
    description:
      "No AI that needs a specialist to run. Teachers adopt it in a single session and keep using it every week.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 11h-6" /><path d="M19 8v6" />
      </svg>
    ),
  },
  {
    title: "Measurable from week one",
    description:
      "Every interaction feeds the analytics layer. Schools see traction early — not at the end of an academic year.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 6-7" />
      </svg>
    ),
  },
  {
    title: "Partner, not a vendor",
    description:
      "A named onboarding lead, live support during school hours, and roadmap input from every partner school.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
];

export function TrustSignals() {
  return (
    <section className="relative overflow-hidden border-y border-[var(--border)] bg-[linear-gradient(180deg,#F0FAF5_0%,#FFFFFF_100%)] py-20 md:py-24">
      <Container>
        <MotionSection className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Why schools trust us
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
            Grounded in how schools actually work.
          </h2>
        </MotionSection>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:mt-14 md:grid-cols-2">
          {signals.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group flex items-start gap-5 rounded-[24px] border border-[var(--border)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_20px_50px_-25px_rgba(5,150,105,0.25)] md:p-7"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:scale-105 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-white">
                {s.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
                  {s.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
