/*
 * File:    frontend/src/components/request-demo/RequestDemoHero.tsx
 * Purpose: Hero for /request-demo. Left column = headline + subhead +
 *          stats. Right column = real, interactive BookingCalendar (was
 *          previously a non-functional motion.div mockup).
 *
 *          Date + slot state is owned by the parent <BookingFlow /> so
 *          the form below this hero can see the same selection.
 * Owner:   Pranav (Skillship demo booking flow)
 */

"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";
import { BookingCalendar } from "@/components/request-demo/BookingCalendar";

const heroStats = [
  { value: "100+", label: "Partner schools" },
  { value: "50,000+", label: "Students empowered" },
  { value: "30 min", label: "Typical demo" },
];

interface RequestDemoHeroProps {
  selectedDate: string | null;
  selectedSlot: string | null;
  onSelectDate: (iso: string) => void;
  onSelectSlot: (value: string) => void;
  onContinue: () => void;
}

export function RequestDemoHero({
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  onContinue,
}: RequestDemoHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_rgba(13,148,136,0.08),_transparent_55%)] pb-14 pt-20 md:pb-16 md:pt-24 lg:pt-28">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30"
        style={{ maskImage: "linear-gradient(to bottom, rgba(255,255,255,0.8), transparent 70%)" }}
        aria-hidden="true"
      />

      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          {/* Copy */}
          <div>
            <MotionSection>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Book a walkthrough
              </div>
            </MotionSection>

            <MotionSection className="mt-6" delay={1}>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[56px] lg:leading-[1.05]">
                See Skillship working{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  inside a school like yours
                </span>
                .
              </h1>
            </MotionSection>

            <MotionSection className="mt-6 max-w-xl" delay={2}>
              <p className="text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
                30 minutes. One of our education specialists walks you through
                the platform, answers your questions, and shares what the first
                90 days of rollout actually look like — no slides, no sales pitch.
              </p>
            </MotionSection>

            <MotionSection className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3" delay={3}>
              {heroStats.map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[var(--foreground)]">{stat.value}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{stat.label}</span>
                </div>
              ))}
            </MotionSection>
          </div>

          {/* Right: real BookingCalendar */}
          <MotionSection delay={2}>
            <div className="relative">
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-3xl" />

              <BookingCalendar
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                onSelectDate={onSelectDate}
                onSelectSlot={onSelectSlot}
                onContinue={onContinue}
              />

              {/* Floating social-proof pill — pure decoration */}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 shadow-[0_16px_40px_-20px_rgba(5,150,105,0.35)]"
              >
                <div className="flex -space-x-2">
                  <span className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-primary to-accent" />
                  <span className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-accent to-primary-500" />
                  <span className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-primary-700 to-primary" />
                </div>
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  12 schools booked this week
                </p>
              </motion.div>
            </div>
          </MotionSection>
        </div>
      </Container>
    </section>
  );
}
