/*
 * File:    frontend/src/components/home/IAASLabs.tsx
 * Purpose: Pillar 1 — Infrastructure as a Service. The 8 advanced labs that
 *          Skillship installs on a partner school's campus. Lifted from the
 *          AI School Program catalogue, page 4.
 *
 *          Design intent: this is the section that makes a principal go
 *          "wait, they ship actual labs?". Lead with a real photo of
 *          students working in a lab, then an 8-card grid of every lab,
 *          each with a numbered badge, an icon, a short description, and
 *          a brand-tinted hover. A 6-item "IAAS advantage" strip closes
 *          the section as proof.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Brain, Bot, Plane, Rocket, Code2, PlaneTakeoff, Cpu, Boxes,
  Wrench, ShieldCheck, BookOpen, TrendingUp, Headphones, CheckCircle2,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Lab {
  n: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  /** Tailwind gradient class for the icon tile. */
  tile: string;
  /** Brand-token color for the number badge text. */
  numColor: string;
}

// 8 labs, taken from catalogue page 4 (left to right).
const LABS: Lab[] = [
  {
    n: "01",
    name: "AI Lab",
    desc: "Explore artificial intelligence, machine learning, and smart systems through practical applications.",
    icon: Brain,
    tile: "bg-[linear-gradient(135deg,#5CC9C8_0%,#2EB6B5_100%)]",
    numColor: "var(--teal-500)",
  },
  {
    n: "02",
    name: "Robotics Lab",
    desc: "Design, build and program robots using sensors, motors, and controllers to solve real-life challenges.",
    icon: Bot,
    tile: "bg-[linear-gradient(135deg,#F8B660_0%,#F39C32_100%)]",
    numColor: "var(--orange-500)",
  },
  {
    n: "03",
    name: "Drone Technology Lab",
    desc: "Learn drone design, assembly, and flight operations with applications in surveillance, mapping, and agriculture.",
    icon: Plane,
    tile: "bg-[linear-gradient(135deg,#7BD685_0%,#4FB956_100%)]",
    numColor: "var(--green-accent)",
  },
  {
    n: "04",
    name: "Spacetech Lab",
    desc: "Dive into space science, satellites, rocketry, and next-generation space innovations.",
    icon: Rocket,
    tile: "bg-[linear-gradient(135deg,#5CC9C8_0%,#1F9594_100%)]",
    numColor: "var(--teal-600)",
  },
  {
    n: "05",
    name: "Coding & Computational Thinking",
    desc: "Develop programming skills, logical thinking, and structured problem-solving approaches.",
    icon: Code2,
    tile: "bg-[linear-gradient(135deg,#F39C32_0%,#D8861F_100%)]",
    numColor: "var(--orange-600)",
  },
  {
    n: "06",
    name: "Aeromodelling Lab",
    desc: "Design and build aircraft models while understanding aerodynamics and engineering concepts.",
    icon: PlaneTakeoff,
    tile: "bg-[linear-gradient(135deg,#F8B660_0%,#2EB6B5_100%)]",
    numColor: "var(--orange-500)",
  },
  {
    n: "07",
    name: "Electronics & IoT Lab",
    desc: "Create smart systems using sensors, circuits, and IoT to connect the physical and digital world.",
    icon: Cpu,
    tile: "bg-[linear-gradient(135deg,#F8B660_0%,#F39C32_100%)]",
    numColor: "var(--orange-500)",
  },
  {
    n: "08",
    name: "3D Printing & Design Lab",
    desc: "Turn ideas into physical prototypes using advanced 3D design and printing technologies.",
    icon: Boxes,
    tile: "bg-[linear-gradient(135deg,#2EB6B5_0%,#4FB956_100%)]",
    numColor: "var(--teal-500)",
  },
];

interface Advantage {
  icon: LucideIcon;
  title: string;
  blurb: string;
}

const ADVANTAGES: Advantage[] = [
  { icon: Wrench,        title: "Complete setup",       blurb: "End-to-end installation on your campus." },
  { icon: CheckCircle2,  title: "Industry-grade kit",   blurb: "High-quality hardware aligned with real-world standards." },
  { icon: BookOpen,      title: "Curriculum-integrated", blurb: "Plug-and-play labs mapped to your syllabus." },
  { icon: ShieldCheck,   title: "Safe & durable",       blurb: "Built for safety and student-friendly use." },
  { icon: TrendingUp,    title: "Scalable & future-ready", blurb: "Designed to adapt as tech and student needs evolve." },
  { icon: Headphones,    title: "End-to-end support",   blurb: "From planning to training and ongoing technical help." },
];

function LabCard({ lab, index }: { lab: Lab; index: number }) {
  const Icon = lab.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay: index * 0.06, ease: EASE }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[color:var(--border-subtle)] bg-white p-7 shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-1.5 hover:shadow-medium"
    >
      {/* Subtle corner glow on hover — picks up the lab's accent. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: lab.numColor }}
      />

      <div className="flex items-start justify-between">
        <div className={`grid h-14 w-14 place-items-center rounded-2xl text-white shadow-soft ${lab.tile}`}>
          <Icon size={26} strokeWidth={1.7} />
        </div>
        <span
          className="text-[42px] font-semibold leading-none opacity-15 transition-opacity group-hover:opacity-40"
          style={{ color: lab.numColor }}
        >
          {lab.n}
        </span>
      </div>

      <h3 className="mt-6 text-[18px] font-semibold leading-[1.25] tracking-[-0.015em] text-[var(--ink-primary)]">
        {lab.name}
      </h3>
      <p className="mt-2.5 text-[14px] leading-[1.55] text-[var(--ink-secondary)]">
        {lab.desc}
      </p>
    </motion.article>
  );
}

export function IAASLabs() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="iaas-labs" ref={ref} className="bg-[var(--cream-soft)]">
      <div className="mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Header */}
        <div className="grid grid-cols-1 items-end gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE }}
              className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--green-accent)]"
            >
              Pillar 1 · Infrastructure as a Service
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
              className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
              style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
            >
              One infrastructure.{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg,#4FB956 0%,#2EB6B5 100%)" }}
              >
                Eight powerful labs.
              </span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
            className="text-[16px] leading-[1.6] text-[var(--ink-secondary)] md:col-span-5 md:text-[17px]"
          >
            Skillship brings together 8 advanced, industry-relevant labs under
            one unified infrastructure — transforming traditional classrooms
            into innovation-driven learning environments.
          </motion.p>
        </div>

        {/* Hero photo — a real Skillship classroom in action. Indian
           students in uniform, multiple STEM activities happening side
           by side (robotics, drones, coding, 3D printing). Lives at
           /public/iaas-classroom.png. */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
          className="relative mt-12 overflow-hidden rounded-[28px] border border-[color:var(--border-subtle)] shadow-medium"
        >
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/iaas-classroom.png"
              alt="Skillship classroom in action — students working on robotics, drones, coding, and 3D printing"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1280px"
              className="object-cover"
            />
            {/* Bottom gradient for caption legibility */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/2"
              style={{ backgroundImage: "linear-gradient(to top, rgba(15,20,25,0.75), transparent)" }}
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-6 text-white md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">
                One classroom · Many activities · Real outcomes
              </p>
              <p className="text-[18px] font-semibold leading-[1.25] tracking-[-0.015em] md:text-[22px]">
                Where students learn by building.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 8 lab cards */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LABS.map((lab, i) => (
            <LabCard key={lab.n} lab={lab} index={i} />
          ))}
        </div>

        {/* The IAAS advantage strip */}
        <div className="mt-20">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-center text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
          >
            The Skillship IAAS advantage
          </motion.p>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 lg:gap-6">
            {ADVANTAGES.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
                  className="flex flex-col items-start gap-3 rounded-2xl border border-[color:var(--border-subtle)] bg-white p-5 shadow-soft"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--cream)] text-[var(--teal-600)]">
                    <Icon size={20} strokeWidth={1.7} />
                  </span>
                  <p className="text-[13.5px] font-semibold leading-[1.3] text-[var(--ink-primary)]">
                    {a.title}
                  </p>
                  <p className="text-[12.5px] leading-[1.5] text-[var(--ink-secondary)]">
                    {a.blurb}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
