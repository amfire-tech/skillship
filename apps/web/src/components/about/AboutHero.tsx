"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";
import { siteConfig } from "@/config/site";

export function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_rgba(5,150,105,0.08),_transparent_55%),radial-gradient(ellipse_at_top_right,_rgba(13,148,136,0.06),_transparent_50%)] pb-16 pt-20 md:pb-24 md:pt-28 lg:pt-32">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30"
        style={{ maskImage: "linear-gradient(to bottom, rgba(255,255,255,0.9), transparent 70%)" }}
        aria-hidden="true"
      />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <MotionSection>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-primary" />
                About Skillship
              </div>
            </MotionSection>

            <MotionSection className="mt-6" delay={1}>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[56px] lg:leading-[1.05]">
                Building the{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  intelligence layer
                </span>{" "}
                for modern schools.
              </h1>
            </MotionSection>

            <MotionSection className="mt-6 max-w-xl" delay={2}>
              <p className="text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
                Skillship connects every student interaction into one live system —
                so schools can finally see learning as it actually happens, not just
                at the end of the term.
              </p>
            </MotionSection>

            <MotionSection className="mt-8 flex flex-wrap gap-3" delay={3}>
              <Link href={siteConfig.cta.href}>
                <Button size="lg" className="rounded-full px-7 shadow-[0_16px_40px_-16px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5">
                  {siteConfig.cta.label}
                </Button>
              </Link>
              <Link href="#story">
                <Button variant="secondary" size="lg" className="rounded-full border-primary/20 bg-white/80 px-7 backdrop-blur-sm hover:bg-white">
                  Read our story
                </Button>
              </Link>
            </MotionSection>
          </div>

          {/* Right: Compact stats stack */}
          <MotionSection delay={2}>
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-primary/15 to-accent/10 blur-2xl" />
              <div className="space-y-3 rounded-[28px] border border-primary/10 bg-white/90 p-5 shadow-[0_24px_60px_-30px_rgba(5,150,105,0.25)] backdrop-blur md:p-6">
                {[
                  { value: "500+", label: "schools trust Skillship", delay: 0 },
                  { value: "1,00,000+", label: "students reached", delay: 0.15 },
                  { value: "98%", label: "partner satisfaction", delay: 0.3 },
                ].map((s) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + s.delay, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-baseline gap-4 rounded-2xl bg-gradient-to-br from-[var(--muted)] to-white px-5 py-4 transition-colors hover:from-primary-50"
                  >
                    <span className="text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
                      {s.value}
                    </span>
                    <span className="text-sm text-[var(--muted-foreground)]">{s.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </MotionSection>
        </div>
      </Container>
    </section>
  );
}
