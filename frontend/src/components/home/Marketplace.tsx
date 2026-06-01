/*
 * File:    frontend/src/components/home/Marketplace.tsx
 * Purpose: Marketplace teaser (skillship_homepage_brief.md §8). Horizontal
 *          scroll row of 6 course cards with native CSS scroll-snap and a
 *          subtle teal scrollbar thumb. Cards link to the real /marketplace
 *          catalog — no fake interactions.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Code2, Cpu, BrainCircuit, Wrench, Globe, GraduationCap,
  ArrowRight, type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Course {
  title: string;
  grade: string;
  duration: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind gradient utility — header band colour. */
  gradient: string;
  /** Highlight the featured course (slightly larger, ring). */
  featured?: boolean;
}

// Per-course pricing is intentionally NOT displayed on any public surface.
// Skillship's commercial story is "₹100 per student / month — everything
// included." Per-course rate would put the wrong number in front of the
// principal who's our actual buyer. The aggregate price lives in the
// PricingAnchor section just above FinalCTA.
const COURSES: Course[] = [
  {
    title: "Beginner's Python for AI",
    grade: "Grade 6–8",
    duration: "12 weeks",
    description:
      "Pure-play Python from first line of code to building a simple AI classifier — pacing built for first-time coders.",
    icon: Code2,
    gradient: "bg-warmth-gradient",
  },
  {
    title: "Advanced Python for AI",
    grade: "Grade 9–10",
    duration: "14 weeks",
    description:
      "Numpy, pandas, scikit-learn. Build real classification and regression projects against open datasets.",
    icon: Cpu,
    gradient: "bg-cool-gradient",
  },
  {
    title: "Complete Artificial Intelligence",
    grade: "Grade 11–12",
    duration: "20 weeks",
    description:
      "Neural networks, transformers, RAG. End the course with a deployable AI project judged by industry mentors.",
    icon: BrainCircuit,
    gradient: "bg-brand-gradient",
    featured: true,
  },
  {
    title: "Robotics with Hardware Kit",
    grade: "Grade 6–10",
    duration: "10 weeks",
    description:
      "Arduino-based kit shipped to the school. Students build sensor-driven robots that compete in school finals.",
    icon: Wrench,
    gradient: "bg-[linear-gradient(135deg,#4FB956_0%,#2EB6B5_100%)]",
  },
  {
    title: "Web Development Fundamentals",
    grade: "Grade 8–12",
    duration: "12 weeks",
    description:
      "HTML, CSS, JavaScript, then React. Ship a personal portfolio site and one full-stack mini-app.",
    icon: Globe,
    gradient: "bg-cool-gradient",
  },
  {
    title: "AI Internship Program",
    grade: "Grade 10–12",
    duration: "8 weeks",
    description:
      "Real industry briefs, mentored sprints, and a placement-grade certificate from amfire's partner companies.",
    icon: GraduationCap,
    gradient: "bg-brand-gradient",
    featured: true,
  },
];

function CourseCard({ course, index }: { course: Course; index: number }) {
  const Icon = course.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: EASE }}
      className={`card-pop group relative flex w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-[color:var(--border-subtle)] bg-white shadow-soft ${
        course.featured ? "ring-1 ring-[var(--orange-500)]/30" : ""
      }`}
      style={{ height: 420 }}
    >
      {/* Gradient header band — top 35% */}
      <div className={`relative flex h-[150px] items-end justify-between p-5 ${course.gradient}`}>
        {course.featured && (
          <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-primary)]">
            Featured
          </span>
        )}
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/95 shadow-soft">
          <Icon size={22} strokeWidth={1.7} className="text-[var(--ink-primary)]" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">
          {course.grade}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-[var(--ink-primary)]">
          {course.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-[14px] leading-[1.5] text-[var(--ink-secondary)]">
          {course.description}
        </p>

        {/* Bottom row pinned via mt-auto */}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--cream)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-primary)]">
            <span className="text-[var(--ink-tertiary)]">{course.duration}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--ink-tertiary)]/40" />
            <span>Included</span>
          </span>
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--cream-soft)] text-[var(--ink-primary)] transition-all duration-300 group-hover:bg-[var(--orange-500)] group-hover:text-white"
          >
            <ArrowRight size={14} strokeWidth={2.2} />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export function Marketplace() {
  return (
    <section className="bg-[var(--cream-soft)]">
      <div className="mx-auto max-w-[1280px] px-6 pt-28 md:pt-36 lg:px-12">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[640px]">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--orange-500)]"
            >
              Marketplace
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
              className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
              style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
            >
              Browse the catalog.<br />Enroll in minutes.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
              className="mt-5 max-w-[540px] text-[17px] leading-[1.6] text-[var(--ink-secondary)]"
            >
              Every Skillship course — AI, coding, robotics, STEM — available to schools and individual
              learners. Aligned to grade levels. Built for India.
            </motion.p>
          </div>

          <Link
            href="/marketplace"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[color:var(--border-subtle)] bg-white px-5 py-2.5 text-[14px] font-semibold text-[var(--ink-primary)] shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-medium md:self-end"
          >
            Explore all courses
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {/* Horizontal scroller — full bleed for premium feel */}
      <div className="marketplace-scroller mt-12 overflow-x-auto pb-24 md:pb-32">
        <div className="mx-auto flex max-w-[1280px] gap-5 px-6 pb-2 lg:px-12">
          {COURSES.map((c, i) => (
            <CourseCard key={c.title} course={c} index={i} />
          ))}
          {/* Right-edge spacer so the last card can fully snap into view */}
          <div aria-hidden className="w-2 shrink-0" />
        </div>
      </div>

      {/* Scoped scrollbar styling — teal thumb on a faint warm track. */}
      <style jsx>{`
        .marketplace-scroller {
          scroll-snap-type: x mandatory;
          scrollbar-width: thin;
          scrollbar-color: var(--teal-500) transparent;
        }
        .marketplace-scroller::-webkit-scrollbar {
          height: 8px;
        }
        .marketplace-scroller::-webkit-scrollbar-track {
          background: transparent;
        }
        .marketplace-scroller::-webkit-scrollbar-thumb {
          background: var(--teal-500);
          border-radius: 9999px;
          opacity: 0.6;
        }
      `}</style>
    </section>
  );
}
