"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const quickPaths = [
  {
    title: "Partnership inquiry",
    description: "Bring Skillship to your school or district",
    href: "#contact-form",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "Product demo",
    description: "Walk through the platform live",
    href: "/request-demo",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    title: "Support & help",
    description: "For existing partner schools",
    href: "#contact-form",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" x2="12.01" y1="17" y2="17" />
      </svg>
    ),
  },
];

export function ContactHero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(5,150,105,0.07),_transparent_55%)] pb-16 pt-20 md:pb-20 md:pt-24 lg:pt-28">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30"
        style={{ maskImage: "linear-gradient(to bottom, rgba(255,255,255,0.85), transparent 75%)" }}
        aria-hidden="true"
      />

      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-14">
          {/* Copy */}
          <div>
            <MotionSection>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Contact Skillship
              </div>
            </MotionSection>

            <MotionSection className="mt-6" delay={1}>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[56px] lg:leading-[1.05]">
                Let&apos;s figure out{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  the right next step
                </span>{" "}
                for your school.
              </h1>
            </MotionSection>

            <MotionSection className="mt-6 max-w-xl" delay={2}>
              <p className="text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
                Whether you&apos;re exploring AI programs, planning a workshop, or
                comparing platforms — tell us where your school is, and we&apos;ll
                come back with something useful, not a sales pitch.
              </p>
            </MotionSection>
          </div>

          {/* Right: quick paths */}
          <MotionSection delay={2}>
            <div className="space-y-3">
              {quickPaths.map((path, i) => (
                <motion.div
                  key={path.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                >
                  <Link
                    href={path.href}
                    className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white/90 p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_-20px_rgba(5,150,105,0.25)]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-white">
                      {path.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--foreground)]">{path.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {path.description}
                      </p>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] transition-transform group-hover:translate-x-1 group-hover:text-primary">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </motion.div>
              ))}
            </div>
          </MotionSection>
        </div>
      </Container>
    </section>
  );
}
