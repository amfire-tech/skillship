"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const benefits = [
  {
    title: "Pre-vetted programs",
    description: "Every workshop is tested in real classrooms before it goes live on the marketplace.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  {
    title: "School-ready pricing",
    description: "Transparent per-session rates. No enterprise quotes, no hidden setup fees.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: "Launch in days",
    description: "Bulk student onboarding, scheduling, and teacher briefs included by default.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="m4.5 16.5 11-11" /><path d="M3 22c6 0 9-3 9-9l9-9-9-1-1-9-9 9c-6 0-9 3-9 9Z" />
      </svg>
    ),
  },
  {
    title: "Live support",
    description: "Dedicated coordinator during delivery, and post-session reports every week.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
      </svg>
    ),
  },
];

export function MarketplaceBenefits() {
  return (
    <section className="py-16 md:py-20">
      <Container>
        <MotionSection className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Why this marketplace
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)] md:text-3xl">
            Built for schools, priced for schools.
          </h2>
        </MotionSection>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group rounded-2xl border border-[var(--border)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_-20px_rgba(5,150,105,0.2)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-white">
                {b.icon}
              </div>
              <h3 className="mt-4 text-base font-bold text-[var(--foreground)]">{b.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {b.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
