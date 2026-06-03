/*
 * File:    frontend/src/components/home/WhySkillship.tsx
 * Purpose: "Why Skillship" 2x2 grid of differentiators (brief §10).
 *          Each card: cream-soft bg, 28px radius, 40px padding, 56px lucide
 *          icon in an 80px white circle. Hover lifts the card with shadow-medium.
 *          Typography + iconography carry it — no imagery.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageCircle, Sparkles, Clock, Award, type LucideIcon } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Reason {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const REASONS: Reason[] = [
  {
    icon: MessageCircle,
    title: "Live 1:1 Doubt Resolution",
    desc: "Personalised sessions with expert instructors. Real human teaching alongside AI guidance.",
  },
  {
    icon: Sparkles,
    title: "Beginner-Friendly Content",
    desc: "Carefully scaffolded curriculum that makes coding feel like play, not pressure.",
  },
  {
    icon: Clock,
    title: "Learn at Your Own Pace",
    desc: "Self-paced content alongside live classes. Students choose the rhythm that works for them.",
  },
  {
    icon: Award,
    title: "Certificates That Matter",
    desc: "Industry-aligned certifications and internship opportunities for top students.",
  },
];

export function WhySkillship() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="bg-[var(--bg-warm)]">
      <div ref={ref} className="mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Eyebrow + Headline */}
        <div className="mx-auto max-w-[720px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
          >
            Why Skillship
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="mt-4 font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.75rem)" }}
          >
            Built for how kids actually learn.
          </motion.h2>
        </div>

        {/* 2x2 grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {REASONS.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.article
                key={r.title}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease: EASE }}
                className="group relative overflow-hidden rounded-[28px] border border-[color:var(--border-subtle)] bg-[var(--cream-soft)] p-10 shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-medium"
              >
                {/* Icon in white circle */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-soft">
                  <Icon
                    size={32}
                    strokeWidth={1.6}
                    className="text-[var(--teal-600)] transition-colors duration-300 group-hover:text-[var(--orange-500)]"
                  />
                </div>

                <h3
                  className="mt-7 font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ink-primary)]"
                  style={{ fontSize: "clamp(1.4rem, 2vw, 1.75rem)" }}
                >
                  {r.title}
                </h3>

                <p className="mt-3 text-[15.5px] leading-[1.6] text-[var(--ink-secondary)] md:text-[16px]">
                  {r.desc}
                </p>

                {/* decorative corner accent — appears on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
                  style={{ backgroundImage: "var(--gradient-warmth)" }}
                />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
