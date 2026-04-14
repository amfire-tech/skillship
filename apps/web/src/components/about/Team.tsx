"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const team = [
  {
    name: "Education Leadership",
    role: "Curriculum & school transformation",
    initials: "EL",
    focus: "Pedagogy · Teacher enablement",
  },
  {
    name: "AI Product Leadership",
    role: "Platform, automation & analytics",
    initials: "AP",
    focus: "AI tooling · Insight design",
  },
  {
    name: "Implementation Leadership",
    role: "Partnerships & student outcomes",
    initials: "IL",
    focus: "School rollouts · Program delivery",
  },
];

export function Team() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <MotionSection className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Who&apos;s building this
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
              Educators, operators, and AI engineers.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-[var(--muted-foreground)] md:text-base">
            A team that has built inside classrooms and at scale in product —
            grounded in both realities.
          </p>
        </MotionSection>

        <div className="mt-12 divide-y divide-[var(--border)] rounded-[28px] border border-[var(--border)] bg-white shadow-[0_20px_60px_-40px_rgba(5,150,105,0.2)] md:mt-14">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group flex items-center gap-5 p-6 transition-colors hover:bg-[var(--muted)]/60 md:p-8"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-base font-bold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] md:h-16 md:w-16 md:text-lg">
                {member.initials}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-[var(--foreground)] md:text-xl">
                  {member.name}
                </h3>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                  {member.role}
                </p>
              </div>

              <div className="hidden text-right md:block">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Focus
                </p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{member.focus}</p>
              </div>

              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden text-[var(--muted-foreground)] transition-transform group-hover:translate-x-1 group-hover:text-primary md:block">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
