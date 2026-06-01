/*
 * File:    frontend/src/components/home/BenefitsForAll.tsx
 * Purpose: Three-audience benefits panel — Schools / Students / Parents.
 *          This is the section a principal forwards to their management
 *          committee and PTA. Lifted from catalogue page 7.
 *
 *          Design intent: three large equal-weight columns, each tinted
 *          with a brand colour band (teal / green / orange). Four benefits
 *          per audience, each with a lucide icon. Hover lifts the column
 *          subtly. The headline carries the catalogue's "Smarter schools.
 *          Stronger futures." line so anyone holding both the printed
 *          catalogue and the website sees instant continuity.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  TrendingUp, GraduationCap, Award, IndianRupee,
  Code2, Wrench, Lightbulb, Bot,
  Rocket, BarChart3, BookOpen, Target,
  Building2, User, Users,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Benefit {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface Audience {
  key: "schools" | "students" | "parents";
  label: string;
  headIcon: LucideIcon;
  tag: string;
  /** Top band gradient utility class. */
  band: string;
  /** Accent CSS var for icon tints + bullets. */
  accent: string;
  benefits: Benefit[];
}

const AUDIENCES: Audience[] = [
  {
    key: "schools",
    label: "Benefits for Schools",
    headIcon: Building2,
    tag: "For the institution",
    band: "bg-[linear-gradient(135deg,#2EB6B5_0%,#1F9594_100%)]",
    accent: "var(--teal-500)",
    benefits: [
      { icon: TrendingUp,    title: "Future-Ready Institution",         desc: "Attract more admissions and stand out as an innovator in education." },
      { icon: GraduationCap, title: "Enhanced Academic Outcomes",       desc: "AI-powered tools personalise learning and improve performance." },
      { icon: Award,         title: "Strong Brand Positioning",         desc: "Build a strong reputation as a forward-thinking, future-ready school." },
      { icon: IndianRupee,   title: "New Programs & Revenue",           desc: "Offer future-focused programs and certifications that create real value." },
    ],
  },
  {
    key: "students",
    label: "Benefits for Students",
    headIcon: User,
    tag: "For the learner",
    band: "bg-[linear-gradient(135deg,#7BD685_0%,#4FB956_100%)]",
    accent: "var(--green-accent)",
    benefits: [
      { icon: Code2,     title: "Future-Ready Skills",             desc: "Develop in-demand skills in AI, coding, robotics, and emerging tech." },
      { icon: Wrench,    title: "Hands-on, Real-World Learning",   desc: "Learn through practical projects, labs, and real-life problem-solving." },
      { icon: Lightbulb, title: "Confidence & Creativity",         desc: "Encourages curiosity, critical thinking, and an innovative mindset." },
      { icon: Bot,       title: "AI-Powered Support",              desc: "24×7 guidance, doubt resolution, and personalised learning support." },
    ],
  },
  {
    key: "parents",
    label: "Benefits for Parents",
    headIcon: Users,
    tag: "For the family",
    band: "bg-[linear-gradient(135deg,#F8B660_0%,#F39C32_100%)]",
    accent: "var(--orange-500)",
    benefits: [
      { icon: Rocket,    title: "Early Exposure to Future Tech",  desc: "Prepares your child for careers and opportunities that don't exist yet." },
      { icon: BarChart3, title: "Transparent Progress",            desc: "Track academic progress, skills, and performance with real-time updates." },
      { icon: BookOpen,  title: "Balanced Learning",               desc: "Focus on practical understanding, creativity, and life skills beyond rote learning." },
      { icon: Target,    title: "Confidence & Career Clarity",     desc: "Helps children discover their strengths, interests, and career paths early." },
    ],
  },
];

function AudienceColumn({ a, index }: { a: Audience; index: number }) {
  const HeadIcon = a.headIcon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: EASE }}
      className="card-pop group relative flex flex-col overflow-hidden rounded-[28px] border border-[color:var(--border-subtle)] bg-white shadow-soft"
    >
      {/* Header band */}
      <div className={`relative px-7 py-9 ${a.band}`}>
        <div className="absolute inset-0 opacity-25 mix-blend-overlay bg-grid-pattern" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
            <HeadIcon size={22} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/80">
              {a.tag}
            </p>
            <p className="text-[17px] font-semibold text-white">
              {a.label}
            </p>
          </div>
        </div>
      </div>

      {/* Benefit list */}
      <ul className="flex flex-1 flex-col gap-1 px-2 py-3">
        {a.benefits.map((b) => {
          const Icon = b.icon;
          return (
            <li
              key={b.title}
              className="flex items-start gap-3 rounded-2xl px-5 py-4 transition-colors hover:bg-[var(--cream-soft)]"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style={{ background: "var(--cream)", color: a.accent }}
              >
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p
                  className="text-[14.5px] font-semibold leading-[1.25] text-[var(--ink-primary)]"
                >
                  {b.title}
                </p>
                <p className="mt-1 text-[13px] leading-[1.5] text-[var(--ink-secondary)]">
                  {b.desc}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </motion.article>
  );
}

export function BenefitsForAll() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="bg-[var(--bg-warm)]">
      <div className="mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Header */}
        <div className="mx-auto max-w-[760px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
          >
            Benefits of an AI School
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
          >
            Smarter schools.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              Stronger futures.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
            className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.6] text-[var(--ink-secondary)] md:text-[18px]"
          >
            Transforming education for schools, students, and parents through
            AI-powered learning — one ecosystem, three impacts.
          </motion.p>
        </div>

        {/* Three audience columns */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {AUDIENCES.map((a, i) => (
            <AudienceColumn key={a.key} a={a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
