"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

interface MarketplaceHeroProps {
  totalCount: number;
}

const catalogPreview = [
  { tag: "AI", title: "AI Vision Lab", meta: "Class 8-12 · half-day", price: "₹ 1,200" },
  { tag: "Robotics", title: "Sensor Studio", meta: "Class 6-10 · 2h", price: "₹ 950" },
  { tag: "IoT", title: "Smart City Mini", meta: "Class 9-12 · multi-session", price: "₹ 2,400" },
];

export function MarketplaceHero({ totalCount }: MarketplaceHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)] bg-[radial-gradient(ellipse_at_top_left,_rgba(5,150,105,0.08),_transparent_50%),linear-gradient(180deg,#FAFFFE_0%,#F0FAF5_100%)] pb-16 pt-20 md:pb-20 md:pt-24 lg:pt-28">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30"
        style={{ maskImage: "linear-gradient(to bottom, rgba(255,255,255,0.9), transparent 75%)" }}
        aria-hidden="true"
      />

      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
          {/* Copy */}
          <div>
            <MotionSection>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Curated for Indian schools
              </div>
            </MotionSection>

            <MotionSection className="mt-6" delay={1}>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[54px] lg:leading-[1.06]">
                Workshop{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  marketplace
                </span>{" "}
                — book the program that fits.
              </h1>
            </MotionSection>

            <MotionSection className="mt-6 max-w-xl" delay={2}>
              <p className="text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
                Ready-to-deploy AI, robotics, coding, electronics, and IoT workshops.
                School-priced, classroom-tested, and live the moment you confirm.
              </p>
            </MotionSection>

            <MotionSection className="mt-8 flex flex-wrap gap-3" delay={3}>
              <Link href="/request-demo">
                <Button size="lg" className="rounded-full px-7 shadow-[0_16px_40px_-16px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5">
                  Book a session
                </Button>
              </Link>
              <Link href="#catalog">
                <Button variant="secondary" size="lg" className="rounded-full border-primary/20 bg-white/80 px-7 backdrop-blur-sm hover:bg-white">
                  Browse catalog
                </Button>
              </Link>
            </MotionSection>

            <MotionSection className="mt-10 flex flex-wrap items-center gap-3" delay={4}>
              {[
                `${totalCount} live programs`,
                "Class 3 to 12 coverage",
                "School-ready pricing",
              ].map((chip) => (
                <div
                  key={chip}
                  className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] backdrop-blur-sm md:text-sm"
                >
                  {chip}
                </div>
              ))}
            </MotionSection>
          </div>

          {/* Right: catalog preview mock */}
          <MotionSection delay={2}>
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-2xl" />

              <div className="relative rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_30px_70px_-35px_rgba(5,150,105,0.3)] md:p-6">
                {/* Mock header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-xs font-semibold text-[var(--foreground)]">Live catalog</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-[var(--muted)] px-2 py-1 text-[10px] text-[var(--muted-foreground)]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    Search
                  </div>
                </div>

                {/* Mock filter row */}
                <div className="mt-4 flex gap-2 overflow-hidden">
                  {["All", "AI", "Robotics", "Coding"].map((f, i) => (
                    <motion.span
                      key={f}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.06, duration: 0.3 }}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                        i === 0
                          ? "bg-gradient-to-r from-primary to-accent text-white"
                          : "border border-[var(--border)] bg-white text-[var(--muted-foreground)]"
                      }`}
                    >
                      {f}
                    </motion.span>
                  ))}
                </div>

                {/* Mock workshop rows */}
                <div className="mt-4 space-y-2.5">
                  {catalogPreview.map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.45 }}
                      className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3 transition-all hover:border-primary/25 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <path d="M3 9h18" /><path d="M9 21V9" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                            {item.tag}
                          </span>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {item.title}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                          {item.meta}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">{item.price}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[11px] text-[var(--muted-foreground)]">
                  <span>Showing 3 of {totalCount} programs</span>
                  <span className="font-semibold text-primary">View all →</span>
                </div>
              </div>
            </div>
          </MotionSection>
        </div>
      </Container>
    </section>
  );
}
