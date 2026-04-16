"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const tracks = [
  {
    label: "AI & ML",
    classRange: "Class 6-12",
    description: "From introduction to neural networks to small real-world ML projects students can explain.",
    outcomes: [
      { skill: "Concept fluency", level: 85 },
      { skill: "Hands-on practice", level: 90 },
      { skill: "Career relevance", level: 95 },
    ],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
        <path d="M12 22c5 0 8-2.5 8-6v-2H4v2c0 3.5 3 6 8 6Z" />
      </svg>
    ),
  },
  {
    label: "Robotics",
    classRange: "Class 4-12",
    description: "Sensors, actuators, and build-focused sessions that turn theory into working prototypes.",
    outcomes: [
      { skill: "Build confidence", level: 92 },
      { skill: "Problem solving", level: 88 },
      { skill: "Teamwork", level: 80 },
    ],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="7" width="14" height="12" rx="2" /><path d="M9 3v4" /><path d="M15 3v4" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" />
      </svg>
    ),
  },
  {
    label: "Creative Coding",
    classRange: "Class 3-10",
    description: "Block-based to Python pathways. Every session ends with a shareable student project.",
    outcomes: [
      { skill: "Logical thinking", level: 90 },
      { skill: "Creativity", level: 95 },
      { skill: "Digital literacy", level: 88 },
    ],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7 8-4 4 4 4" /><path d="m17 8 4 4-4 4" /><path d="m14 4-4 16" />
      </svg>
    ),
  },
];

export function WorkshopCategoryShowcase() {
  return (
    <section className="border-y border-[var(--border)] bg-[linear-gradient(180deg,#FFFFFF_0%,#F0FAF5_100%)] py-20 md:py-24">
      <Container>
        <MotionSection className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Workshop tracks
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
            What students actually walk away with.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            Every track maps to concrete outcomes — not just attendance.
          </p>
        </MotionSection>

        <div className="mt-12 grid gap-5 md:mt-14 md:grid-cols-3">
          {tracks.map((track, i) => (
            <motion.article
              key={track.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col rounded-[24px] border border-[var(--border)] bg-white p-6 transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_50px_-25px_rgba(5,150,105,0.25)] md:p-7"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)]">
                  {track.icon}
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {track.classRange}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold text-[var(--foreground)]">
                {track.label}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {track.description}
              </p>

              <div className="mt-6 space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  Student outcomes
                </p>
                {track.outcomes.map((out, j) => (
                  <div key={out.skill}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--foreground)]">{out.skill}</span>
                      <span className="font-bold text-primary">{out.level}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${out.level}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.1 + j * 0.1, duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}
