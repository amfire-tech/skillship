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

import Image from "next/image";
import { motion, useInView, type Variants } from "framer-motion";
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
  /** Real product photo (public/products). */
  image: string;
  /** Backdrop behind the photo while it loads / matches the shot's own bg. */
  imageBg: string;
}

const PRODUCTS: Product[] = [
  {
    name: "Neobot",
    tagline: "Award-winning robotics board",
    desc: "An IR-sensor-driven robotics platform with servo control, switches, and an integrated display. The hero of the Robotics Lab.",
    icon: Bot,
    usedIn: ["Robotics Lab", "Electronics & IoT Lab"],
    image: "/products/neobot.png",
    imageBg: "#ffffff",
  },
  {
    name: "3D Printer",
    tagline: "From idea to prototype",
    desc: "An education-grade 3D printer with a touchscreen interface — designed to make rapid prototyping and design thinking accessible from Grade 6 upward.",
    icon: Boxes,
    usedIn: ["3D Printing & Design Lab"],
    image: "/products/3d-printer.png?v=2",
    imageBg: "#f1f2f2",
  },
  {
    name: "Skillship Kit",
    tagline: "Sensors. Circuits. Limitless builds.",
    desc: "A portable case packed with sensors, controllers, and modules. The kit travels home with students — where fun meets learning, literally.",
    icon: Cpu,
    usedIn: ["Electronics & IoT Lab", "AI Lab"],
    image: "/products/skillship-kit.png?v=2",
    imageBg: "#f1f2f2",
  },
];

// Card entrance (scroll-reveal) + a springy lift/pop on hover. Variants keep the
// two transitions independent — slow reveal, snappy hover.
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: EASE },
  }),
  hover: {
    y: -12,
    scale: 1.02,
    transition: { duration: 0.6, ease: EASE },
  },
};

function ProductCard({ p, index }: { p: Product; index: number }) {
  const Icon = p.icon;
  return (
    <motion.article
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      whileHover="hover"
      viewport={{ once: true, amount: 0.2 }}
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[var(--bg-dark-elev)] shadow-strong transition-[box-shadow,border-color] duration-300 hover:border-white/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),0_24px_50px_-12px_rgba(0,0,0,0.6)]"
    >
      {/* Product tile — real product photo, full-bleed */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ backgroundColor: p.imageBg }}
      >
        <Image
          src={p.image}
          alt={`${p.name} — Skillship product`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:scale-[1.06]"
        />
        {/* award badge */}
        <div className="absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
          <Award size={12} strokeWidth={2.2} />
          Award-winning
        </div>
        {/* product icon chip */}
        <div className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-sm ring-1 ring-white/20">
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
