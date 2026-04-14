"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";
import type { WorkshopItem } from "@/types";

interface WorkshopHeroProps {
  featuredWorkshop: WorkshopItem;
  totalCount: number;
}

const categoryChips = ["AI & Machine Learning", "Robotics", "Creative Coding", "Electronics", "IoT Labs"];

export function WorkshopHero({ featuredWorkshop, totalCount }: WorkshopHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(5,150,105,0.06),_transparent_55%)] pb-16 pt-20 md:pb-24 md:pt-28 lg:pt-32">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30"
        style={{ maskImage: "linear-gradient(to bottom, rgba(255,255,255,0.8), transparent 70%)" }}
        aria-hidden="true"
      />

      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          {/* ── Left: Copy ── */}
          <div>
            <MotionSection>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                {totalCount} curated workshop programs
              </div>
            </MotionSection>

            <MotionSection className="mt-6" delay={1}>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[56px] lg:leading-[1.05]">
                Classroom-ready{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI & robotics
                </span>{" "}
                workshops.
              </h1>
            </MotionSection>

            <MotionSection className="mt-6 max-w-xl" delay={2}>
              <p className="text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
                Structured programs across AI, robotics, and coding — designed around
                real school timetables and measurable student outcomes, not generic
                one-off sessions.
              </p>
            </MotionSection>

            <MotionSection className="mt-8 flex flex-wrap gap-3" delay={3}>
              <Link href="/request-demo">
                <Button size="lg" className="rounded-full px-7 shadow-[0_16px_40px_-16px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5">
                  Request Demo
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                  </svg>
                </Button>
              </Link>
              <Link href="#catalog">
                <Button variant="secondary" size="lg" className="rounded-full border-primary/20 bg-white/80 px-7 backdrop-blur-sm hover:bg-white">
                  Browse catalog
                </Button>
              </Link>
            </MotionSection>

            {/* Category chips */}
            <MotionSection className="mt-10" delay={4}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Categories we cover
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {categoryChips.map((chip, i) => (
                  <motion.span
                    key={chip}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.06, duration: 0.4 }}
                    className="rounded-full border border-[var(--border)] bg-white px-3.5 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    {chip}
                  </motion.span>
                ))}
              </div>
            </MotionSection>

            {/* Stats strip */}
            <MotionSection className="mt-10 grid gap-3 sm:grid-cols-3" delay={5}>
              {[
                { value: String(totalCount), label: "Workshop formats" },
                { value: "50+", label: "Schools nationwide" },
                { value: "1-12", label: "Class coverage" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-xl font-bold text-[var(--foreground)] md:text-2xl">{s.value}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{s.label}</p>
                </div>
              ))}
            </MotionSection>
          </div>

          {/* ── Right: Featured card with floating badges ── */}
          <MotionSection delay={2}>
            <div className="relative">
              {/* Soft glow */}
              <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-2xl" />

              {/* Main featured card */}
              <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white p-4 shadow-[0_30px_70px_-35px_rgba(5,150,105,0.35)] md:p-5">
                <div className="relative overflow-hidden rounded-[20px] bg-[var(--muted)]">
                  <Image
                    src={featuredWorkshop.image}
                    alt={featuredWorkshop.imageAlt}
                    width={900}
                    height={620}
                    className="h-full w-full object-cover"
                    priority
                  />
                  {/* Floating badge top-left */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur-sm"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Featured
                  </motion.div>
                </div>

                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Most booked this month
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--foreground)] md:text-2xl">
                      {featuredWorkshop.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  {featuredWorkshop.overview}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-[var(--muted)] to-white px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                      Duration
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-[var(--foreground)]">
                      {featuredWorkshop.duration}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-[var(--muted)] to-white px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                      Class range
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-[var(--foreground)]">
                      {featuredWorkshop.classRange}
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating outcome pill */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-4 -right-3 hidden items-center gap-2 rounded-2xl border border-primary/15 bg-white px-4 py-3 shadow-[0_16px_40px_-15px_rgba(5,150,105,0.35)] md:flex"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    Outcome
                  </p>
                  <p className="text-xs font-bold text-[var(--foreground)]">Hands-on, measurable</p>
                </div>
              </motion.div>
            </div>
          </MotionSection>
        </div>
      </Container>
    </section>
  );
}
