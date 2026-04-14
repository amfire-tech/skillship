"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const heroStats = [
  { value: "500+", label: "Partner schools" },
  { value: "1L+", label: "Students onboarded" },
  { value: "30 min", label: "Typical demo" },
];

export function RequestDemoHero() {
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

            <MotionSection className="mt-8 flex flex-wrap gap-3" delay={3}>
              <Link
                href="#demo-form"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--foreground)]/90"
              >
                Book my demo
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:border-primary/30"
              >
                Talk to our team
              </Link>
            </MotionSection>

            <MotionSection className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3" delay={4}>
              {heroStats.map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[var(--foreground)]">{stat.value}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{stat.label}</span>
                </div>
              ))}
            </MotionSection>
          </div>

          {/* Right: demo booking preview mock */}
          <MotionSection delay={2}>
            <div className="relative">
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-3xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(5,150,105,0.35)]">
                {/* Window chrome */}
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    skillship.in/demo
                  </p>
                </div>

                {/* Calendar preview */}
                <div className="mt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Pick a slot
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
                    This week · Asia/Kolkata
                  </p>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[
                      { day: "Mon", date: "14", slots: 3 },
                      { day: "Tue", date: "15", slots: 4, active: true },
                      { day: "Wed", date: "16", slots: 2 },
                      { day: "Thu", date: "17", slots: 5 },
                    ].map((d, i) => (
                      <motion.div
                        key={d.day}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                        className={`rounded-xl border p-2.5 text-center transition ${
                          d.active
                            ? "border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10"
                            : "border-[var(--border)] bg-white"
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                          {d.day}
                        </p>
                        <p className={`mt-0.5 text-lg font-bold ${d.active ? "text-primary" : "text-[var(--foreground)]"}`}>
                          {d.date}
                        </p>
                        <p className="mt-0.5 text-[9px] text-[var(--muted-foreground)]">
                          {d.slots} slots
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-2">
                    {[
                      { time: "10:30 AM", len: "30 min", active: false },
                      { time: "11:30 AM", len: "30 min", active: true },
                      { time: "03:00 PM", len: "30 min", active: false },
                    ].map((slot, i) => (
                      <motion.div
                        key={slot.time}
                        initial={{ opacity: 0, x: 12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
                        className={`flex items-center justify-between rounded-xl border p-3 ${
                          slot.active
                            ? "border-primary/50 bg-primary/5"
                            : "border-[var(--border)] bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${slot.active ? "bg-gradient-to-br from-primary to-accent text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--foreground)]">{slot.time}</p>
                            <p className="text-[11px] text-[var(--muted-foreground)]">{slot.len} · Video call</p>
                          </div>
                        </div>
                        {slot.active && (
                          <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                            Selected
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.95 }}
                    className="mt-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <p className="text-xs font-medium text-[var(--foreground)]">
                        Confirmed within 1 business hour
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Free</span>
                  </motion.div>
                </div>
              </div>

              {/* Floating pill */}
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
