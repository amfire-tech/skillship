/*
 * File:    frontend/src/components/home/HardwareShowcase.tsx
 * Purpose: The "they ship real hardware" moment. Showcases the three flagship
 *          products from the AI School Program catalogue page 2:
 *            - Neobot (educational robotics board, the orange hero product)
 *            - 3D Printer (the IAAS workhorse)
 *            - Skillship Kit (the sensor + electronics case)
 *
 *          Design intent: dark warm-ink surface so the orange/teal product
 *          tiles glow against it — the way a product photo studio shoots on
 *          a charcoal sweep. No photos of unrelated products: we use bold
 *          iconic tiles (matched to the catalogue's product colourways) with
 *          "Used in" lab tags. When the client supplies real product
 *          photography, swap the icon+gradient block for an <Image>.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Bot, Boxes, Cpu, Award, CheckCircle2, Sparkles,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Product {
  name: string;
  tagline: string;
  desc: string;
  icon: LucideIcon;
  usedIn: string[];
  /** Tile gradient — the visual "product photo" until the real one lands. */
  tile: string;
  /** Decorative shape overlaid on the tile. */
  shape: "robot" | "printer" | "kit";
}

const PRODUCTS: Product[] = [
  {
    name: "Neobot",
    tagline: "Award-winning robotics board",
    desc: "An IR-sensor-driven robotics platform with servo control, switches, and an integrated display. The hero of the Robotics Lab.",
    icon: Bot,
    usedIn: ["Robotics Lab", "Electronics & IoT Lab"],
    tile: "bg-[linear-gradient(135deg,#F39C32_0%,#D8861F_100%)]",
    shape: "robot",
  },
  {
    name: "3D Printer",
    tagline: "From idea to prototype",
    desc: "An education-grade 3D printer with a touchscreen interface — designed to make rapid prototyping and design thinking accessible from Grade 6 upward.",
    icon: Boxes,
    usedIn: ["3D Printing & Design Lab"],
    tile: "bg-[linear-gradient(135deg,#2EB6B5_0%,#1F9594_100%)]",
    shape: "printer",
  },
  {
    name: "Skillship Kit",
    tagline: "Sensors. Circuits. Limitless builds.",
    desc: "A portable case packed with sensors, controllers, and modules. The kit travels home with students — where fun meets learning, literally.",
    icon: Cpu,
    usedIn: ["Electronics & IoT Lab", "AI Lab"],
    tile: "bg-[linear-gradient(135deg,#5CC9C8_0%,#2EB6B5_100%)]",
    shape: "kit",
  },
];

// Stylised "product shapes" overlaid on each tile — geometric, not photographic.
// When real product photography lands, replace this with <Image>.
function ProductShape({ shape }: { shape: Product["shape"] }) {
  if (shape === "robot") {
    return (
      <svg viewBox="0 0 200 200" className="h-full w-full opacity-95">
        {/* Neobot board */}
        <rect x="40" y="44" width="120" height="100" rx="12" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
        <rect x="56" y="62" width="88" height="42" rx="6" fill="rgba(15,20,25,0.55)" />
        <circle cx="64" cy="56" r="3" fill="rgba(255,255,255,0.8)" />
        <circle cx="136" cy="56" r="3" fill="rgba(255,255,255,0.8)" />
        {/* pin headers */}
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={56 + i * 9} y={116} width="6" height="12" fill="rgba(15,20,25,0.5)" />
        ))}
        {/* wheels */}
        <circle cx="44"  cy="156" r="14" fill="rgba(15,20,25,0.75)" />
        <circle cx="156" cy="156" r="14" fill="rgba(15,20,25,0.75)" />
        {/* logo dot */}
        <circle cx="100" cy="83" r="6" fill="#F39C32" />
      </svg>
    );
  }
  if (shape === "printer") {
    return (
      <svg viewBox="0 0 200 200" className="h-full w-full opacity-95">
        {/* gantry frame */}
        <rect x="48" y="40" width="104" height="100" rx="4" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
        {/* x-rail */}
        <rect x="48" y="70" width="104" height="6" fill="rgba(255,255,255,0.35)" />
        {/* extruder */}
        <rect x="92" y="62" width="16" height="22" rx="2" fill="rgba(15,20,25,0.7)" />
        <rect x="98" y="84" width="4" height="8" fill="rgba(255,255,255,0.7)" />
        {/* print bed */}
        <rect x="40" y="148" width="120" height="14" rx="3" fill="rgba(255,255,255,0.55)" />
        <rect x="44" y="152" width="112" height="6" fill="rgba(15,20,25,0.4)" />
        {/* print object */}
        <polygon points="100,128 90,148 110,148" fill="rgba(255,255,255,0.9)" />
        {/* base */}
        <rect x="36" y="162" width="128" height="10" rx="2" fill="rgba(15,20,25,0.5)" />
      </svg>
    );
  }
  // kit
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full opacity-95">
      {/* case lid open */}
      <rect x="36" y="58" width="128" height="80" rx="8" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      <rect x="36" y="138" width="128" height="32" rx="6" fill="rgba(15,20,25,0.5)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
      {/* compartments */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={42 + i * 30} y={144} width="22" height="20" rx="2" fill="rgba(255,255,255,0.18)" />
      ))}
      {/* circular sensor */}
      <circle cx="100" cy="98" r="22" fill="rgba(15,20,25,0.45)" />
      <circle cx="100" cy="98" r="12" fill="rgba(255,255,255,0.85)" />
      <circle cx="100" cy="98" r="4"  fill="#F39C32" />
      {/* corner chips */}
      <rect x="52"  y="72" width="20" height="12" rx="2" fill="rgba(255,255,255,0.5)" />
      <rect x="128" y="72" width="20" height="12" rx="2" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

function ProductCard({ p, index }: { p: Product; index: number }) {
  const Icon = p.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: EASE }}
      className="card-pop group relative flex flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[var(--bg-dark-elev)] shadow-strong"
    >
      {/* Product tile — gradient + stylised geometry */}
      <div className={`relative aspect-[4/3] ${p.tile} overflow-hidden`}>
        {/* faint grid */}
        <div className="absolute inset-0 opacity-[0.18] bg-grid-pattern" aria-hidden />
        {/* the stylised product */}
        <div className="absolute inset-0 grid place-items-center p-8">
          <div className="h-full w-full max-w-[260px]">
            <ProductShape shape={p.shape} />
          </div>
        </div>
        {/* award badge */}
        <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
          <Award size={12} strokeWidth={2.2} />
          Award-winning
        </div>
        {/* product icon chip */}
        <div className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
          <Icon size={20} strokeWidth={1.8} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-7">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[var(--orange-400)]">
          {p.tagline}
        </p>
        <h3 className="mt-2 text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--ink-inverse)]">
          {p.name}
        </h3>
        <p className="mt-3 text-[14px] leading-[1.55] text-white/70">
          {p.desc}
        </p>

        {/* Used-in tags */}
        <div className="mt-5 flex flex-wrap gap-2">
          {p.usedIn.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11.5px] font-medium text-white/80"
            >
              <CheckCircle2 size={11} strokeWidth={2.4} className="text-[var(--teal-400)]" />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

export function HardwareShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-[var(--bg-dark)] text-[var(--ink-inverse)]"
    >
      {/* Soft brand glow at top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full opacity-[0.18] blur-3xl"
        style={{ backgroundImage: "var(--gradient-warmth)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full opacity-[0.14] blur-3xl"
        style={{ backgroundImage: "var(--gradient-cool)" }}
      />

      <div className="relative mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Header */}
        <div className="mx-auto max-w-[820px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 backdrop-blur-sm"
          >
            <Sparkles size={12} strokeWidth={2.2} className="text-[var(--orange-400)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
              Ecosystem of award-winning products
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="mt-6 font-semibold leading-[1.05] tracking-[-0.03em]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
          >
            Hardware that ships{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-warmth)" }}
            >
              to your campus.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.6] text-white/70 md:text-[18px]"
          >
            Industry-grade products, designed for Indian classrooms — installed,
            integrated, and maintained by the Skillship team.
          </motion.p>
        </div>

        {/* Product grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.name} p={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
