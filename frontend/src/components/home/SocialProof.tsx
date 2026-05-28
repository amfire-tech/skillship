/*
 * File:    frontend/src/components/home/SocialProof.tsx
 * Purpose: §11 Social Proof — real Skillship testimonials, plus a "Trusted
 *          by schools across India" city marquee.
 *
 *          Senior choice: the brief asks for real partner-school logos in
 *          a marquee. We don't have them yet. Putting placeholder/fake
 *          logos would be misleading, so the marquee carries a row of
 *          Indian city names (real geography) until real logos arrive.
 *          Swap mechanism documented inline.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Testimonial {
  quote: string;
  name: string;
  city: string;
  /** Stable colour seed for the avatar gradient. */
  seed: "warm" | "cool" | "brand" | "fresh";
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Skillship is taking care of my skills with its web development course. The best part is that I can easily learn using mobile only, which helps in my studies anytime, anywhere.",
    name: "Rishi",
    city: "Lucknow",
    seed: "warm",
  },
  {
    quote:
      "Amazing class! Looking forward to working on my own game. Thank you so much for teaching me Python. The best part is the quizzes for better understanding.",
    name: "Shinaya",
    city: "Gurugram",
    seed: "cool",
  },
  {
    quote:
      "Mind-blowing course. The instructor's explanation was nice, and the best part about Skillship is the interactive animated content — easy understanding of concepts.",
    name: "Jay Prakash",
    city: "Agra",
    seed: "brand",
  },
  {
    quote:
      "Really super, the way our instructor explained was great. The best part is Skillship's instant doubt resolution — gives me a smooth flow in studies.",
    name: "Ansh",
    city: "Mumbai",
    seed: "fresh",
  },
];

const SEED_GRADIENT: Record<Testimonial["seed"], string> = {
  warm:  "bg-warmth-gradient",
  cool:  "bg-cool-gradient",
  brand: "bg-brand-gradient",
  fresh: "bg-[linear-gradient(135deg,#4FB956_0%,#2EB6B5_100%)]",
};

// Indian cities representing Skillship's footprint. Real geography only —
// replace this array with real partner-school logos when assets land.
const CITIES = [
  "Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata",
  "Hyderabad", "Pune", "Lucknow", "Agra", "Jaipur",
  "Ahmedabad", "Gurugram", "Noida", "Indore", "Chandigarh",
];

function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: EASE }}
      className="relative flex w-[360px] shrink-0 snap-start flex-col rounded-3xl border border-[color:var(--border-subtle)] bg-white p-7 shadow-soft md:w-[380px]"
      style={{ minHeight: 280 }}
    >
      <Quote
        aria-hidden
        size={22}
        strokeWidth={1.6}
        className="text-[var(--orange-500)]/70"
      />
      <p className="mt-4 line-clamp-5 text-[15.5px] font-normal leading-[1.5] text-[var(--ink-primary)]">
        &ldquo;{t.quote}&rdquo;
      </p>

      <div className="mt-auto flex items-center gap-3 pt-6">
        {/* Avatar — stylised initial in a brand-tinted circle until real
           photos are added. Easy to swap for <Image src=...> later. */}
        <div
          aria-hidden
          className={`grid h-11 w-11 place-items-center rounded-full text-[15px] font-semibold text-white shadow-soft ${SEED_GRADIENT[t.seed]}`}
        >
          {t.name.charAt(0)}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[var(--ink-primary)]">
            {t.name}
          </p>
          <p className="text-[12px] text-[var(--ink-tertiary)]">
            {t.city}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export function SocialProof() {
  // Repeat city list twice for a seamless marquee loop.
  const marquee = [...CITIES, ...CITIES];

  return (
    <section className="bg-[var(--bg-warm)]">
      <div className="mx-auto max-w-[1280px] px-6 pt-28 md:pt-36 lg:px-12">
        <div className="mx-auto max-w-[720px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
          >
            What students say
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
          >
            Loved by students across India.
          </motion.h2>
        </div>
      </div>

      {/* Horizontal scroller — full-bleed for premium feel */}
      <div className="testimonial-scroller mt-14 overflow-x-auto pb-10">
        <div className="mx-auto flex max-w-[1280px] gap-5 px-6 pb-2 lg:px-12">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} />
          ))}
          <div aria-hidden className="w-2 shrink-0" />
        </div>
      </div>

      {/* Divider + city marquee */}
      <div className="mx-auto max-w-[1280px] px-6 pb-24 md:pb-32 lg:px-12">
        <div className="border-t border-[color:var(--border-subtle)] pt-10">
          <p className="text-center text-[12px] font-medium tracking-[0.04em] text-[var(--ink-tertiary)]">
            Trusted by schools across India
          </p>

          {/* Marquee — pure CSS, infinite scroll. Width 200% with -50%
             translate keyframe creates a seamless loop because the list
             is duplicated. */}
          <div className="city-marquee relative mt-6 overflow-hidden">
            <div className="city-marquee__track flex w-max gap-10">
              {marquee.map((city, i) => (
                <span
                  key={`${city}-${i}`}
                  className="shrink-0 text-[15px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
                >
                  {city}
                </span>
              ))}
            </div>
            {/* Fade edges so the marquee dissolves into the page */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-16"
              style={{ backgroundImage: "linear-gradient(to right, var(--bg-warm), transparent)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-16"
              style={{ backgroundImage: "linear-gradient(to left, var(--bg-warm), transparent)" }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .testimonial-scroller {
          scroll-snap-type: x mandatory;
          scrollbar-width: thin;
          scrollbar-color: var(--teal-500) transparent;
        }
        .testimonial-scroller::-webkit-scrollbar { height: 8px; }
        .testimonial-scroller::-webkit-scrollbar-thumb {
          background: var(--teal-500);
          border-radius: 9999px;
        }

        .city-marquee__track {
          animation: city-scroll 30s linear infinite;
        }
        @keyframes city-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .city-marquee__track { animation: none; }
        }
      `}</style>
    </section>
  );
}
