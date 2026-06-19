/*
 * File:    frontend/src/components/home/ImpactGallery.tsx
 * Purpose: The "together we are building future-ready minds" gallery from
 *          catalogue page 8 — a mosaic of real classroom photographs that
 *          shows Skillship is in the field, not just on a slide deck.
 *
 *          Layout: a 4-col x 3-row mosaic with mixed cell sizes for visual
 *          rhythm. Mobile collapses to a single column with the hero photo
 *          first. Each photo has a soft-zoom hover state.
 *
 *          Photos are the client's real Skillship classroom / event
 *          photography, served from /public/impact. The grid auto-adapts if
 *          more src/caption pairs are added.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Photo {
  src: string;
  alt: string;
  /** Tailwind grid placement on lg viewports. */
  span: string;
  caption?: string;
}

// Real Skillship photos from the field. Captions name the lab / moment so a
// principal reads the offerings while looking at the action shots.
const PHOTOS: Photo[] = [
  {
    // Students presenting a smart-road / toll-gate Arduino build
    src: "/impact/robotics-iot-lab.jpg",
    alt: "Students presenting a smart-road IoT project they built — Skillship Robotics & IoT Lab",
    span: "lg:col-span-2 lg:row-span-2",
    caption: "Robotics & IoT Lab",
  },
  {
    // Students with an Arduino + ultrasonic-sensor build in the computer lab
    src: "/impact/coding-ai-lab.jpg",
    alt: "Students with their Arduino sensor project in the Skillship coding lab",
    span: "lg:col-span-2 lg:row-span-1",
    caption: "Coding & AI Lab",
  },
  {
    // Skillship Drone & Space / AI & Robotics program banners with a telescope
    src: "/impact/drone-space-programs.jpg",
    alt: "Skillship Drone & Space and AI & Robotics program setup at a school",
    span: "lg:col-span-1 lg:row-span-1",
    caption: "Drone & Space",
  },
  {
    // Whole-cohort photo holding AI completion certificates
    src: "/impact/ai-certification-cohort.jpg",
    alt: "A full cohort of students holding their AI program certificates",
    span: "lg:col-span-1 lg:row-span-1",
    caption: "AI Certified",
  },
  {
    // Students and mentor celebrating with their certificates
    src: "/impact/young-innovators.jpg",
    alt: "Students and their mentor celebrating with completion certificates",
    span: "lg:col-span-2 lg:row-span-1",
    caption: "Young Innovators",
  },
];

function GalleryPhoto({ p, index }: { p: Photo; index: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.96, y: 14 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: EASE }}
      className={`group relative overflow-hidden rounded-3xl border border-[color:var(--border-subtle)] shadow-soft ${p.span}`}
    >
      <div className="relative h-full min-h-[180px] w-full">
        <Image
          src={p.src}
          alt={p.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
        />
        {p.caption ? (
          <>
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/2"
              style={{ backgroundImage: "linear-gradient(to top, rgba(15,20,25,0.75), transparent)" }}
            />
            <figcaption className="absolute inset-x-0 bottom-0 p-4 md:p-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-primary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--orange-500)]" />
                {p.caption}
              </span>
            </figcaption>
          </>
        ) : null}
      </div>
    </motion.figure>
  );
}

export function ImpactGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="cv-auto bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Header */}
        <div className="grid grid-cols-1 items-end gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE }}
              className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
            >
              Our impact, in the field
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
              className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
              style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
            >
              Together, we are{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                building future-ready minds.
              </span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
            className="text-[16px] leading-[1.6] text-[var(--ink-secondary)] md:col-span-5 md:text-[17px]"
          >
            Empowering students. Strengthening schools. Shaping tomorrow.
            From classrooms to communities, we&apos;re creating a future where
            every student has the skills, confidence, and technology to lead.
          </motion.p>
        </div>

        {/* The mosaic */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-3 lg:gap-5 lg:[&>*]:min-h-[200px]">
          {PHOTOS.map((p, i) => (
            <GalleryPhoto key={p.src} p={p} index={i} />
          ))}
        </div>

        {/* Closing line */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          className="mt-16 flex flex-col items-center text-center"
        >
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.24em] text-[var(--teal-600)]">
            A movement towards a smarter tomorrow
          </p>
          <p className="mt-5 max-w-[640px] text-[20px] leading-[1.35] tracking-[-0.015em] text-[var(--ink-primary)] md:text-[24px]">
            Let&apos;s continue to inspire. Let&apos;s continue to innovate.
            <span
              className="ml-1 bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-warmth)" }}
            >
              Let&apos;s build the future together.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
