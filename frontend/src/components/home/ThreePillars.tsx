/*
 * File:    frontend/src/components/home/ThreePillars.tsx
 * Purpose: The spine of the AI School pitch. Communicates the single
 *          claim a principal needs to hear: Skillship is not a tool, it's
 *          an ecosystem with three pillars working together —
 *          IAAS (infrastructure), TAAS (training), SAAS (software).
 *
 *          Source: AI School Program catalogue, page 3.
 *
 *          Design intent: three large cards, equal weight, each anchored
 *          to its detail section further down the page. Hover lifts.
 *          A bold "AI School = Infrastructure + Training + Software"
 *          summary line closes the section so the reader carries the
 *          equation in their head.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Building2, GraduationCap, Cpu, ArrowRight,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Pillar {
  id: "iaas" | "taas" | "saas";
  label: string;
  title: string;
  blurb: string;
  bullets: string[];
  badge: string;
  href: string;
  icon: LucideIcon;
  /** Top-band gradient utility class. */
  band: string;
  /** Accent ring colour on hover. */
  accentVar: string;
}

const PILLARS: Pillar[] = [
  {
    id: "iaas",
    label: "Pillar 1 · IAAS",
    title: "Infrastructure as a Service",
    blurb: "World-class labs and equipment installed on your campus — built for hands-on, future-ready learning.",
    bullets: [
      "8 advanced technology labs",
      "Industry-grade hardware & kits",
      "Complete installation & maintenance",
      "Safe, durable, student-friendly",
    ],
    badge: "8 Labs",
    href: "#iaas-labs",
    icon: Building2,
    band: "bg-[linear-gradient(135deg,#4FB956_0%,#2EB6B5_100%)]",
    accentVar: "var(--green-accent)",
  },
  {
    id: "taas",
    label: "Pillar 2 · TAAS",
    title: "Training as a Service",
    blurb: "Comprehensive teacher training and 24×7 support so your educators lead the AI classroom with confidence.",
    bullets: [
      "Offline + Online teacher training",
      "Expert mentorship & 24×7 support",
      "Certifications & continuous upskilling",
      "Lesson plans, templates, resources",
    ],
    badge: "8 Services",
    href: "#taas-training",
    icon: GraduationCap,
    band: "bg-[linear-gradient(135deg,#F39C32_0%,#F8B660_100%)]",
    accentVar: "var(--orange-500)",
  },
  {
    id: "saas",
    label: "Pillar 3 · SAAS",
    title: "Software as a Service",
    blurb: "An AI-powered platform — Code4AI and the AI Career Copilot — that personalises learning at scale.",
    bullets: [
      "Code4AI learning platform",
      "AI Career Copilot for every student",
      "AI quiz generator & adaptive engine",
      "Analytics for management & teachers",
    ],
    badge: "Code4AI + Copilot",
    href: "#saas-software",
    icon: Cpu,
    band: "bg-brand-gradient",
    accentVar: "var(--teal-500)",
  },
];

function PillarCard({ p, index }: { p: Pillar; index: number }) {
  const Icon = p.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: EASE }}
      className="group relative"
    >
      <Link
        href={p.href}
        className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-[color:var(--border-subtle)] bg-white shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-2 hover:shadow-strong"
      >
        {/* Colored band at the top */}
        <div className={`relative h-[112px] ${p.band}`}>
          <div className="absolute inset-0 opacity-25 mix-blend-overlay bg-grid-pattern" aria-hidden />
          <div className="absolute -bottom-7 left-7 grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-soft">
            <Icon size={28} strokeWidth={1.7} className="text-[var(--ink-primary)]" />
          </div>
          <span
            className="absolute right-5 top-5 rounded-full bg-white/95 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-primary)]"
          >
            {p.badge}
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col px-7 pb-7 pt-12">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: p.accentVar }}
          >
            {p.label}
          </p>
          <h3 className="mt-2 text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ink-primary)]">
            {p.title}
          </h3>
          <p className="mt-3 text-[15px] leading-[1.55] text-[var(--ink-secondary)]">
            {p.blurb}
          </p>

          {/* Bullets */}
          <ul className="mt-6 space-y-2.5">
            {p.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[14px] text-[var(--ink-secondary)]">
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: p.accentVar }}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div
            className="mt-auto flex items-center gap-1.5 pt-7 text-[13px] font-semibold transition-transform group-hover:translate-x-1"
            style={{ color: p.accentVar }}
          >
            Explore this pillar
            <ArrowRight size={14} strokeWidth={2.2} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ThreePillars() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      id="pillars"
      ref={ref}
      className="relative overflow-hidden bg-white"
    >
      <div className="mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Header */}
        <div className="mx-auto max-w-[760px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
          >
            One ecosystem · Three pillars
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.6vw, 3.75rem)" }}
          >
            What is an{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              AI School
            </span>
            ?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
            className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.6] text-[var(--ink-secondary)] md:text-[18px]"
          >
            A future-ready ecosystem that integrates infrastructure, teacher
            training, and AI software — creating one seamless environment
            where students learn, teachers lead, and schools transform.
          </motion.p>
        </div>

        {/* Three pillar cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:mt-20 lg:grid-cols-3 lg:gap-8">
          {PILLARS.map((p, i) => (
            <PillarCard key={p.id} p={p} index={i} />
          ))}
        </div>

        {/* The equation — closing line */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
          className="mt-20 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center"
        >
          <span className="text-[15px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-primary)] md:text-[17px]">AI School</span>
          <span className="text-[15px] text-[var(--ink-tertiary)] md:text-[17px]">=</span>
          <span className="text-[15px] font-semibold uppercase tracking-[0.18em] text-[var(--green-accent)] md:text-[17px]">Infrastructure</span>
          <span className="text-[15px] text-[var(--ink-tertiary)] md:text-[17px]">+</span>
          <span className="text-[15px] font-semibold uppercase tracking-[0.18em] text-[var(--orange-500)] md:text-[17px]">Training</span>
          <span className="text-[15px] text-[var(--ink-tertiary)] md:text-[17px]">+</span>
          <span className="text-[15px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-500)] md:text-[17px]">Software</span>
        </motion.div>
      </div>
    </section>
  );
}
