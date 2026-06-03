/*
 * File:    frontend/src/components/home/SkillsShowcase.tsx
 * Purpose: "Skills your students walk away with" — a horizontal scroll row of
 *          the real-world skills a Skillship workshop builds (coding, problem
 *          solving, communication, drone tech, creativity, and more). Same
 *          premium card + scroll-snap treatment as before; cards now describe
 *          a SKILL rather than a saleable course.
 *
 *          The scroller carries generous top/bottom padding so the card
 *          hover-lift never clips against the overflow box.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import { motion } from "framer-motion";
import {
  Code2, Puzzle, Cpu, Plane, Palette, MessageSquare, Brain, Users,
  BrainCircuit, type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Skill {
  name: string;
  /** Short bucket shown on the header band (Technical / Creative / Human …). */
  category: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind gradient utility — header band colour. */
  gradient: string;
}

const SKILLS: Skill[] = [
  {
    name: "Coding & Programming",
    category: "Technical",
    description: "From the first line of code to real apps — structured, logical thinking that lasts a lifetime.",
    icon: Code2,
    gradient: "bg-warmth-gradient",
  },
  {
    name: "Problem Solving",
    category: "Mindset",
    description: "Break big, messy challenges into clear steps and engineer solutions that actually work.",
    icon: Puzzle,
    gradient: "bg-cool-gradient",
  },
  {
    name: "Robotics & Engineering",
    category: "Technical",
    description: "Design, build and program real robots with industry-grade kits shipped to the school.",
    icon: Cpu,
    gradient: "bg-brand-gradient",
  },
  {
    name: "Drone Technology",
    category: "Technical",
    description: "Fly and program drones — the tech behind modern aviation, mapping and delivery.",
    icon: Plane,
    gradient: "bg-[linear-gradient(135deg,#4FB956_0%,#2EB6B5_100%)]",
  },
  {
    name: "Creativity & Design",
    category: "Creative",
    description: "Imagine, prototype and 3D-print original ideas — turning imagination into real objects.",
    icon: Palette,
    gradient: "bg-cool-gradient",
  },
  {
    name: "Communication",
    category: "Human",
    description: "Present projects with confidence and explain complex ideas clearly to any audience.",
    icon: MessageSquare,
    gradient: "bg-warmth-gradient",
  },
  {
    name: "Critical Thinking",
    category: "Mindset",
    description: "Question, analyse and reason from evidence — the foundation of an AI-ready mind.",
    icon: Brain,
    gradient: "bg-brand-gradient",
  },
  {
    name: "Collaboration",
    category: "Human",
    description: "Build in teams and ship together — exactly how real engineering crews create.",
    icon: Users,
    gradient: "bg-[linear-gradient(135deg,#2EB6B5_0%,#4FB956_100%)]",
  },
  {
    name: "AI Literacy",
    category: "Future",
    description: "Understand how AI really works — and use it responsibly to build, not just consume.",
    icon: BrainCircuit,
    gradient: "bg-cool-gradient",
  },
];

function SkillCard({ skill, index }: { skill: Skill; index: number }) {
  const Icon = skill.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: EASE }}
      whileHover={{ y: -10, scale: 1.03, transition: { type: "spring", stiffness: 320, damping: 20 } }}
      className="card-pop card-lift group relative flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-[color:var(--border-subtle)] bg-white shadow-soft"
      style={{ height: 332 }}
    >
      {/* Gradient header band */}
      <div className={`relative flex h-[128px] items-start justify-between p-5 ${skill.gradient}`}>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/95 shadow-soft transition-transform duration-300 group-hover:scale-110">
          <Icon size={22} strokeWidth={1.7} className="text-[var(--ink-primary)]" />
        </span>
        <span className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
          {skill.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-[var(--ink-primary)]">
          {skill.name}
        </h3>
        <p className="mt-3 text-[14px] leading-[1.55] text-[var(--ink-secondary)]">
          {skill.description}
        </p>
      </div>
    </motion.article>
  );
}

export function SkillsShowcase() {
  return (
    <section className="bg-[var(--cream-soft)]">
      <div className="mx-auto max-w-[1280px] px-6 pt-28 md:pt-36 lg:px-12">
        {/* Header */}
        <div className="max-w-[680px]">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--orange-500)]"
          >
            Future-ready skills
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
          >
            More than courses.<br />Skills that shape who they become.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
            className="mt-5 max-w-[560px] text-[17px] leading-[1.6] text-[var(--ink-secondary)]"
          >
            Every Skillship workshop builds the technical <em>and</em> human skills that define a
            future-ready student — coding, problem-solving, creativity, communication, and many more.
          </motion.p>
        </div>
      </div>

      {/* Horizontal scroller — generous pt/pb so the hover-lift never clips */}
      <div className="skills-scroller mt-12 overflow-x-auto px-0 pb-24 pt-8 md:pb-32">
        <div className="mx-auto flex max-w-[1280px] gap-5 px-6 lg:px-12">
          {SKILLS.map((s, i) => (
            <SkillCard key={s.name} skill={s} index={i} />
          ))}
          {/* Right-edge spacer so the last card can fully snap into view */}
          <div aria-hidden className="w-2 shrink-0" />
        </div>
      </div>

      {/* Scoped scrollbar styling — teal thumb on a faint warm track. */}
      <style jsx>{`
        .skills-scroller {
          scroll-snap-type: x mandatory;
          scrollbar-width: thin;
          scrollbar-color: var(--teal-500) transparent;
        }
        .skills-scroller::-webkit-scrollbar {
          height: 8px;
        }
        .skills-scroller::-webkit-scrollbar-track {
          background: transparent;
        }
        .skills-scroller::-webkit-scrollbar-thumb {
          background: var(--teal-500);
          border-radius: 9999px;
        }
      `}</style>
    </section>
  );
}
