"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FloatingElement, MotionSection } from "@/components/ui/MotionWrapper";
import { siteConfig } from "@/config/site";

/*
 * Square orbital container — equal % in x and y = true circle.
 * 5 nodes at 72° intervals (pentagon) centred at 50%/50%.
 * R = 38% of container side.
 */
const SYSTEM_CENTER = { x: 50, y: 50 };
const SYSTEM_RADIUS = 38;
const NODE_ANGLES = [-90, -18, 54, 126, 198];

function polarToPercent(angle: number) {
  const radians = (angle * Math.PI) / 180;
  const x = SYSTEM_CENTER.x + SYSTEM_RADIUS * Math.cos(radians);
  const y = SYSTEM_CENTER.y + SYSTEM_RADIUS * Math.sin(radians);
  return { x, y };
}
const systemNodes = [
  {
    label: "Students",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    // angle -90° → top-centre
    angle: -90,
    delay: 0,
    float: { duration: 7, y: 10 },
  },
  {
    label: "Smart Quizzes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    // angle -18° → upper-right
    angle: -18,
    delay: 0.8,
    float: { duration: 8, y: 14 },
  },
  {
    label: "Teacher Insights",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    // angle 54° → lower-right
    angle: 54,
    delay: 0.4,
    float: { duration: 9, y: 11 },
  },
  {
    label: "Analytics",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
      </svg>
    ),
    // angle 126° → lower-left
    angle: 126,
    delay: 1.6,
    float: { duration: 7.5, y: 9 },
  },
  {
    label: "AI Analysis",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L6.5 11H12l-1 11 6.5-12H12z" />
      </svg>
    ),
    // angle 198° → upper-left
    angle: 198,
    delay: 1.2,
    float: { duration: 6, y: 12 },
  },
];

/* ── Central brain mock UI ── */
function CenterBrain() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="relative mx-auto flex h-48 w-48 items-center justify-center md:h-64 md:w-64"
    >
      {/* Outer glow rings */}
      <div className="absolute inset-0 rounded-full bg-primary/5 animate-[ping_3s_ease-in-out_infinite]" />
      <div className="absolute inset-3 rounded-full bg-primary/8 animate-[ping_3s_ease-in-out_infinite_0.5s]" />

      {/* Main circle */}
      <div className="relative z-10 flex h-36 w-36 flex-col items-center justify-center rounded-full border-2 border-primary/20 bg-white shadow-[0_0_60px_-15px_rgba(5,150,105,0.3)] md:h-48 md:w-48">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white md:h-16 md:w-16">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
            <path d="M16 14h.01" /><path d="M8 14h.01" />
            <path d="M12 22c5 0 8-2.5 8-6v-2c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v2c0 3.5 3 6 8 6Z" />
          </svg>
        </div>
        <p className="mt-2 text-xs font-bold tracking-wide text-primary md:text-sm">
          AI Engine
        </p>
        <p className="text-[10px] text-[var(--muted-foreground)] md:text-xs">
          Skillship Core
        </p>
      </div>
    </motion.div>
  );
}

/* ── Connection lines (SVG) ── */
function ConnectionLines() {
  const endpoints = NODE_ANGLES.map((angle) => polarToPercent(angle));
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(5,150,105,0.3)" />
          <stop offset="100%" stopColor="rgba(13,148,136,0.15)" />
        </linearGradient>
      </defs>
      {/* Lines from center to each node position — approximate */}
      {endpoints.map((point, i) => (
        <motion.path
          key={i}
          d={`M ${SYSTEM_CENTER.x} ${SYSTEM_CENTER.y} L ${point.x} ${point.y}`}
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.8 + i * 0.2, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}

/* ── Floating node component ── */
function SystemNode({
  label,
  icon,
  angle,
  delay,
  float,
}: (typeof systemNodes)[number]) {
  const position = polarToPercent(angle);
  /*
   * Outer div: pure CSS positioning + centering.
   * FloatingElement: only the y-float animation — no position styles here
   * so framer-motion's transform never clobbers translate(-50%, -50%).
   */
  return (
    <div
      className="absolute"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <FloatingElement duration={float.duration} delay={delay} y={float.y}>
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 + delay, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 rounded-2xl border border-primary/15 bg-white/90 px-4 py-2.5 shadow-glass backdrop-blur-sm transition-shadow hover:shadow-glow"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <span className="text-xs font-semibold text-[var(--foreground)] md:text-sm">
            {label}
          </span>
        </motion.div>
      </FloatingElement>
    </div>
  );
}

/* ── Stat pill ── */
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-primary/10 bg-white/80 px-5 py-3 backdrop-blur-sm">
      <span className="text-xl font-bold text-[var(--foreground)] md:text-2xl">{value}</span>
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
    </div>
  );
}

/* ── Main Hero ── */
export function SystemHero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(5,150,105,0.06),_transparent_60%)] pb-8 pt-20 md:pb-12 md:pt-28 lg:pt-32">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40"
        style={{ maskImage: "linear-gradient(to bottom, rgba(255,255,255,0.8), transparent 80%)" }}
        aria-hidden="true"
      />

      <Container>
        {/* Eyebrow */}
        <MotionSection className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            AI-Powered School Operating System
          </div>
        </MotionSection>

        {/* Headline */}
        <MotionSection className="mx-auto mt-6 max-w-4xl text-center" delay={1}>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[58px] lg:leading-[1.08]">
            The operating system for{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI-ready schools
            </span>
          </h1>
        </MotionSection>

        <MotionSection className="mx-auto mt-5 max-w-2xl text-center" delay={2}>
          <p className="text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            One platform connecting students, teachers, and principals through AI-powered
            quizzes, career guidance, and real-time performance analytics.
          </p>
        </MotionSection>

        {/* CTAs */}
        <MotionSection className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row" delay={3}>
          <Link href={siteConfig.cta.href}>
            <Button size="lg" className="rounded-full px-8 shadow-[0_16px_40px_-16px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5">
              {siteConfig.cta.label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="secondary" size="lg" className="rounded-full border-primary/20 bg-white/80 px-8 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white">
              Explore Platform
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </Link>
        </MotionSection>

        {/* ── SYSTEM VISUAL — square container so % = true circle ── */}
        <div className="relative mx-auto mt-14 w-full max-w-[520px] aspect-square md:mt-16">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <CenterBrain />
          </div>
          {systemNodes.map((node) => (
            <SystemNode key={node.label} {...node} />
          ))}
        </div>

        {/* Trust stats */}
        <MotionSection className="mt-6 text-center" delay={2}>
          <p className="mb-5 text-sm font-medium text-[var(--muted-foreground)]">
            Trusted by 50+ schools across India
          </p>
          <div className="mx-auto flex flex-wrap items-center justify-center gap-4">
            <StatPill value="50+" label="Schools" />
            <StatPill value="10,000+" label="Students" />
            <StatPill value="8,000+" label="Enrolled" />
            <StatPill value="5,000+" label="Live Hours" />
          </div>
        </MotionSection>
      </Container>
    </section>
  );
}
