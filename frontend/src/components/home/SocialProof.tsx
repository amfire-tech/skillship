/*
 * File:    frontend/src/components/home/SocialProof.tsx
 * Purpose: §11 Social Proof — reframed as Skillship's India footprint. A
 *          stylised India map on the left carries avatar "presence" pins at
 *          the cities where Skillship operates (some with a 5★ chip); the
 *          right column is an auto-scrolling stack of school/student reviews
 *          with star ratings and the store (Play / App Store) they came from.
 *
 *          The India map is the official, legally-correct India SVG supplied
 *          by the team (media/india2023High.svg), recoloured for the theme
 *          with borders left exactly as-is and served from
 *          /public/india-map.svg. Pins overlay it via percentage coordinates.
 * Owner:   Pranav (homepage rebuild — India footprint)
 */

"use client";

import { motion } from "framer-motion";
import { Star, User } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

type Seed = "warm" | "cool" | "brand" | "fresh";

const SEED_GRADIENT: Record<Seed, string> = {
  warm:  "bg-warmth-gradient",
  cool:  "bg-cool-gradient",
  brand: "bg-brand-gradient",
  fresh: "bg-[linear-gradient(135deg,#4FB956_0%,#2EB6B5_100%)]",
};

/* Presence pins — left/top are % within the square map box, tuned to the
   real India outline (viewBox 1024×1024). */
interface Pin {
  city: string;
  left: number;
  top: number;
  seed: Seed;
  rating?: boolean;
}

const PINS: Pin[] = [
  { city: "Srinagar",  left: 23, top: 10, seed: "cool",  },
  { city: "Amritsar",  left: 24, top: 19, seed: "warm",  rating: true },
  { city: "Delhi",     left: 32, top: 29, seed: "brand", },
  { city: "Jaipur",    left: 27, top: 35, seed: "fresh", rating: true },
  { city: "Lucknow",   left: 44, top: 35, seed: "brand", },
  { city: "Patna",     left: 59, top: 39, seed: "fresh", },
  { city: "Guwahati",  left: 82, top: 38, seed: "cool",  },
  { city: "Bhopal",    left: 32, top: 47, seed: "warm",  },
  { city: "Ahmedabad", left: 16, top: 48, seed: "warm",  },
  { city: "Kolkata",   left: 70, top: 50, seed: "fresh", rating: true },
  { city: "Mumbai",    left: 17, top: 62, seed: "brand", },
  { city: "Bengaluru", left: 33, top: 83, seed: "fresh", },
  { city: "Chennai",   left: 42, top: 82, seed: "warm",  },
];

function MapPin({ pin, index }: { pin: Pin; index: number }) {
  return (
    <div
      className="absolute z-10"
      style={{ left: `${pin.left}%`, top: `${pin.top}%`, transform: "translate(-50%, -100%)" }}
    >
      <div
        className="relative flex items-center gap-1 rounded-full bg-white px-1 py-1 shadow-[0_8px_20px_rgba(15,20,25,0.18)] ring-1 ring-black/5 animate-float-slow"
        style={{ animationDelay: `${(index % 5) * 0.6}s`, animationDuration: `${6 + (index % 4)}s` }}
        title={`Skillship · ${pin.city}`}
      >
        <span className={`grid h-9 w-9 place-items-center rounded-full text-white ${SEED_GRADIENT[pin.seed]}`}>
          <User size={16} strokeWidth={2} />
        </span>
        {pin.rating && (
          <span className="flex items-center gap-0.5 pr-1.5 text-[12px] font-bold text-[var(--ink-primary)]">
            5 <Star size={11} className="fill-[var(--orange-500)] text-[var(--orange-500)]" />
          </span>
        )}
        {/* downward pointer */}
        <span className="absolute -bottom-[5px] left-[18px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-white shadow-[2px_2px_3px_rgba(15,20,25,0.10)]" />
      </div>
    </div>
  );
}

function IndiaMap() {
  // Aspect matches the source viewBox (849.87 × 964) so the rendered map fills
  // the box edge-to-edge and the % pin coordinates line up with the geography.
  return (
    <div className="relative mx-auto aspect-[850/964] w-full max-w-[520px]">
      {/* Legal, official India map (recoloured for the theme; borders untouched).
         eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/india-map.svg"
        alt="Map of India showing the cities where Skillship is present"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      {PINS.map((p, i) => (
        <MapPin key={p.city} pin={p} index={i} />
      ))}
    </div>
  );
}

/* ── Store badges ── */
function PlayBadge() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-label="Google Play">
      <path fill="#00A0FF" d="M3.6 2.3 13 11.7 3.6 21.1c-.36-.2-.6-.6-.6-1.1V3.4c0-.5.24-.9.6-1.1z" />
      <path fill="#00E676" d="M3.6 2.3c.2-.12.45-.16.7-.1L16 8.7l-3 3z" />
      <path fill="#FF3A44" d="M3.6 21.1 13 11.7l3 3-11.7 6.5c-.25.06-.5.02-.7-.1z" />
      <path fill="#FFCE00" d="M16 8.7l4.3 2.4c.7.4.7 1.4 0 1.8L16 15.3 12.9 11.7z" />
    </svg>
  );
}
function AppleBadge() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-[#0A84FF]">
      <svg viewBox="0 0 24 24" width="12" height="12" aria-label="App Store">
        <path
          fill="#fff"
          d="M16.36 1.43c0 1.06-.43 2.07-1.13 2.83-.74.82-1.94 1.46-2.9 1.38-.11-.98.4-1.99 1.05-2.69.72-.82 2-1.45 2.97-1.5l.01-.02zM20 17.05c-.55 1.27-.82 1.83-1.52 2.95-.98 1.55-2.36 3.48-4.07 3.5-1.52.01-1.91-.99-3.98-.98-2.07.01-2.5 1-4.02.98-1.71-.02-3.02-1.77-4-3.32C-.32 16.5-.86 11.32 1.43 8.66c1.14-1.33 2.91-2.16 4.53-2.16 1.65 0 2.69 1 4.06 1 1.32 0 2.13-1 4.04-1 1.44 0 2.96.78 4.05 2.13-3.56 1.95-2.98 7.03.89 8.42z"
        />
      </svg>
    </span>
  );
}

interface Review {
  quote: string;
  name: string;
  city: string;
  seed: Seed;
  store: "play" | "apple";
}

const REVIEWS: Review[] = [
  {
    quote:
      "Skillship is taking care of my skills with its web development course. The best part is that I can easily learn using mobile only — anytime, anywhere.",
    name: "Rishi", city: "Lucknow", seed: "warm", store: "play",
  },
  {
    quote:
      "Great app for the labs! The MCQs are well-designed, cover all key topics, and come with clear explanations. Clean UI and helpful performance tracking.",
    name: "Preet Kapoor", city: "Amritsar", seed: "cool", store: "play",
  },
  {
    quote:
      "Amazing class! Looking forward to building my own game. Thank you for teaching me Python — the quizzes really help with understanding.",
    name: "Shinaya", city: "Gurugram", seed: "fresh", store: "apple",
  },
  {
    quote:
      "The way it urges me to attempt questions daily to maintain streaks is brilliant. I keep practising regardless, and it has genuinely improved my scores.",
    name: "Ria", city: "Pune", seed: "brand", store: "apple",
  },
  {
    quote:
      "Mind-blowing course. The instructor's explanation was clear, and the interactive animated content makes concepts easy to understand.",
    name: "Jay Prakash", city: "Agra", seed: "brand", store: "play",
  },
  {
    quote:
      "Really super — the instructor explained everything so well. The instant doubt resolution gives me a smooth flow in my studies.",
    name: "Ansh", city: "Mumbai", seed: "fresh", store: "apple",
  },
];

function Stars() {
  return (
    <div className="flex items-center gap-1" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={17} className="fill-[var(--orange-500)] text-[var(--orange-500)]" />
      ))}
    </div>
  );
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <article className="rounded-3xl border border-[color:var(--border-subtle)] bg-[var(--card)] p-6 shadow-soft">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-full text-[15px] font-semibold text-white ${SEED_GRADIENT[r.seed]}`}>
            {r.name.charAt(0)}
          </span>
          <div>
            <p className="text-[15px] font-semibold leading-tight text-[var(--ink-primary)]">{r.name}</p>
            <p className="text-[12px] text-[var(--ink-tertiary)]">{r.city}</p>
          </div>
        </div>
        {r.store === "play" ? <PlayBadge /> : <AppleBadge />}
      </header>
      <p className="mt-4 text-[14.5px] leading-[1.6] text-[var(--ink-secondary)]">{r.quote}</p>
      <div className="mt-4">
        <Stars />
      </div>
    </article>
  );
}

export function SocialProof() {
  const loop = [...REVIEWS, ...REVIEWS];

  return (
    <section className="bg-[var(--bg-warm)]">
      <div className="mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Header */}
        <div className="mx-auto max-w-[760px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
          >
            Skillship across India
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
          >
            Trusted by schools{" "}
            <span className="bg-clip-text text-transparent">across the country.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
            className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.6] text-[var(--ink-secondary)] md:text-[17px]"
          >
            From Srinagar to Chennai — explore where Skillship is live, and hear
            what students and schools say about it.
          </motion.p>
        </div>

        {/* Map + reviews */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* India map */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="lg:col-span-7"
          >
            <IndiaMap />
          </motion.div>

          {/* Auto-scrolling reviews */}
          <div className="lg:col-span-5">
            <div className="review-viewport relative h-[460px] overflow-hidden md:h-[560px]">
              <div className="review-track flex flex-col gap-5">
                {loop.map((r, i) => (
                  <ReviewCard key={`${r.name}-${i}`} r={r} />
                ))}
              </div>
              {/* fade edges */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-16"
                style={{ backgroundImage: "linear-gradient(to bottom, var(--bg-warm), transparent)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
                style={{ backgroundImage: "linear-gradient(to top, var(--bg-warm), transparent)" }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .review-track {
          animation: review-scroll 32s linear infinite;
        }
        .review-viewport:hover .review-track {
          animation-play-state: paused;
        }
        @keyframes review-scroll {
          from { transform: translateY(0); }
          to   { transform: translateY(calc(-50% - 0.625rem)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .review-track { animation: none; }
        }
      `}</style>
    </section>
  );
}
