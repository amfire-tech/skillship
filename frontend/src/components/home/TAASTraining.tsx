/*
 * File:    frontend/src/components/home/TAASTraining.tsx
 * Purpose: Pillar 2 — Training as a Service. A principal's biggest fear with
 *          STEM/AI labs is "my teachers can't teach this." This section is
 *          the answer: 8 training services that turn an existing faculty
 *          into AI-ready educators, with a real photo of a training session
 *          as the visual anchor. Lifted from catalogue page 5.
 *
 *          Visual choice: 4-column grid of compact cards (vs IAAS's 4-col
 *          richer cards) so the two pillars don't feel like the same layout
 *          twice in a row. Photo block sits ALONGSIDE the grid on desktop
 *          for variety, not above it.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Presentation, MonitorPlay, MessageSquare, LifeBuoy,
  TrendingUp, Award, Users, FileText, ArrowRight,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Service {
  n: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

const SERVICES: Service[] = [
  { n: "01", title: "Offline Teacher Training",   desc: "Hands-on, immersive training conducted on your campus by our expert trainers.",            icon: Presentation },
  { n: "02", title: "Online Teacher Training",    desc: "Live interactive virtual sessions accessible from anywhere with flexible schedules.",       icon: MonitorPlay },
  { n: "03", title: "Expert Guidance & Mentorship", desc: "One-on-one and group guidance from Skillship's subject experts and trained professionals.",  icon: MessageSquare },
  { n: "04", title: "24×7 Support & Assistance",  desc: "Round-the-clock help for queries, challenges, and training needs.",                          icon: LifeBuoy },
  { n: "05", title: "Regular Upskilling Sessions", desc: "Stay updated with the latest tools, techniques, and teaching methodologies.",                 icon: TrendingUp },
  { n: "06", title: "Certifications & Recognition", desc: "Industry-recognized certificates that validate skills and boost professional growth.",       icon: Award },
  { n: "07", title: "Community of Educators",     desc: "Connect, collaborate, and grow with a vibrant community of like-minded educators.",         icon: Users },
  { n: "08", title: "Resources & Training Materials", desc: "Curated resources, lesson plans, templates, and tools to enhance every class.",             icon: FileText },
];

function ServiceCard({ s, index }: { s: Service; index: number }) {
  const Icon = s.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: EASE }}
      className="group relative flex h-full flex-col rounded-2xl border border-[color:var(--border-subtle)] bg-white p-6 shadow-soft transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-medium"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--cream-soft)] text-[var(--orange-500)] transition-colors duration-300 group-hover:bg-[var(--orange-500)] group-hover:text-white">
          <Icon size={20} strokeWidth={1.8} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
          {s.n}
        </span>
      </div>
      <h3 className="mt-5 text-[15.5px] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--ink-primary)]">
        {s.title}
      </h3>
      <p className="mt-2 text-[13.5px] leading-[1.55] text-[var(--ink-secondary)]">
        {s.desc}
      </p>
    </motion.article>
  );
}

export function TAASTraining() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="taas-training" ref={ref} className="bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Header */}
        <div className="grid grid-cols-1 items-end gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE }}
              className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--orange-500)]"
            >
              Pillar 2 · Training as a Service
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
              className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
              style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
            >
              We train{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-warmth)" }}
              >
                your teachers.
              </span>
              <br />We don&apos;t drop and disappear.
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
            className="text-[16px] leading-[1.6] text-[var(--ink-secondary)] md:col-span-5 md:text-[17px]"
          >
            8 comprehensive training services that empower educators with the
            skills, confidence, and continuous support they need to lead
            tomorrow&apos;s classroom.
          </motion.p>
        </div>

        {/* Two-column layout: photo on left, service grid on right */}
        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Photo column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="lg:col-span-5"
          >
            <div className="sticky top-28 overflow-hidden rounded-[28px] border border-[color:var(--border-subtle)] shadow-medium">
              <div className="relative aspect-[4/5] w-full">
                {/* TODO: replace with real Skillship teacher-training photo. */}
                <Image
                  src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&auto=format&fit=crop&q=80"
                  alt="Skillship teacher training session in progress"
                  fill
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-2/3"
                  style={{ backgroundImage: "linear-gradient(to top, rgba(15,20,25,0.85), transparent 70%)" }}
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-7 text-white md:p-9">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">
                    Empowering educators
                  </p>
                  <p className="text-[20px] font-semibold leading-[1.2] tracking-[-0.015em] md:text-[24px]">
                    One platform. Limitless growth.
                  </p>
                  <p className="mt-1 text-[13.5px] leading-[1.5] opacity-85">
                    Training today. Transforming tomorrow.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold">
                    Backed by Skillship&apos;s commitment to quality
                    <ArrowRight size={14} strokeWidth={2.2} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Service grid column */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7 lg:gap-5">
            {SERVICES.map((s, i) => (
              <ServiceCard key={s.n} s={s} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
