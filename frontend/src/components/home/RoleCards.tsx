/*
 * File:    frontend/src/components/home/RoleCards.tsx
 * Purpose: "Built for every role" — 3 stakeholder cards (Principal, Teacher,
 *          Student). 3-col on desktop, horizontal-scroll on narrow viewports.
 *          Admin / Sub-Admin sign in from the footer, not the marketing page.
 *          Each card has a
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
  LineChart, Users, Sparkles,
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
        className="card-lift relative flex h-[360px] w-full flex-col overflow-hidden rounded-[20px] border border-[color:var(--border-subtle)] bg-white shadow-soft"
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
            Three roles, three tailored experiences
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

        {/* Grid: 3-col desktop, horizontal scroll on small viewports */}
        <div className="role-grid mx-auto mt-16 grid max-w-[1040px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r, i) => (
            <RoleCard key={r.name} role={r} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
