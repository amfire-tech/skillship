/*
 * File:    frontend/src/components/home/RoleCards.tsx
 * Purpose: "Built for every role" — 5 stakeholder cards (brief §9). 5-col on
 *          desktop, horizontal-scroll on narrow viewports. Each card has a
 *          role-specific gradient band, a lucide icon in a white circle, and
 *          a single-line tagline. Cards link to /login (the real surface for
 *          that role) rather than a fake "See dashboard" modal — the modal
 *          would need AI-generated dashboard mockups we don't have yet, and
 *          a non-functional control is worse than no control.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck, Layers, LineChart, Users, Sparkles,
  ArrowUpRight, type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Role {
  name: string;
  tagline: string;
  icon: LucideIcon;
  /** Header band gradient — utility class. */
  gradient: string;
}

const ROLES: Role[] = [
  {
    name: "Admin",
    tagline: "Full platform control. School onboarding. AI tuning.",
    icon: ShieldCheck,
    gradient: "bg-[linear-gradient(135deg,#F39C32_0%,#F8B660_100%)]",
  },
  {
    name: "Sub-Admin",
    tagline: "Question banks, content workflows, school-level reports.",
    icon: Layers,
    gradient: "bg-brand-gradient",
  },
  {
    name: "Principal",
    tagline: "School-wide analytics. Benchmarking. PDF and Excel exports.",
    icon: LineChart,
    gradient: "bg-cool-gradient",
  },
  {
    name: "Teacher",
    tagline: "Class management. Quiz assignment. Per-student learning paths.",
    icon: Users,
    gradient: "bg-[linear-gradient(135deg,#2EB6B5_0%,#4FB956_100%)]",
  },
  {
    name: "Student",
    tagline: "Adaptive quizzes. Career Pilot. Badges and certificates.",
    icon: Sparkles,
    gradient: "bg-[linear-gradient(135deg,#4FB956_0%,#F39C32_100%)]",
  },
];

function RoleCard({ role, index }: { role: Role; index: number }) {
  const Icon = role.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: EASE }}
      className="group"
    >
      <Link
        href="/login"
        className="relative flex h-[360px] w-full flex-col overflow-hidden rounded-[20px] border border-[color:var(--border-subtle)] bg-white shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-2 hover:shadow-strong"
      >
        {/* Gradient band — top 40% */}
        <div className={`relative h-[144px] ${role.gradient}`}>
          {/* white icon circle, half-overlapping the band */}
          <div className="absolute -bottom-7 left-6 grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-soft">
            <Icon size={26} strokeWidth={1.7} className="text-[var(--ink-primary)]" />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col px-6 pb-6 pt-12">
          <h3 className="text-[22px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ink-primary)]">
            {role.name}
          </h3>
          <p className="mt-3 text-[14px] leading-[1.55] text-[var(--ink-secondary)]">
            {role.tagline}
          </p>
          <div className="mt-auto flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-[var(--teal-600)] transition-colors group-hover:text-[var(--orange-500)]">
            Sign in
            <ArrowUpRight size={14} strokeWidth={2.2} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function RoleCards() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Header */}
        <div className="mx-auto max-w-[760px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
          >
            Five stakeholders, five experiences
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
          >
            One platform. Built for everyone in the school.
          </motion.h2>
        </div>

        {/* Grid: 5-col desktop, horizontal scroll on small viewports */}
        <div className="role-grid mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {ROLES.map((r, i) => (
            <RoleCard key={r.name} role={r} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
