/*
 * File:    frontend/src/components/home/FinalCTA.tsx
 * Purpose: §12 Final CTA — dark band, two-path call to action.
 *          "I'm a school" → /request-demo. "I'm a student" → /marketplace.
 *          Soft drifting radial glow behind the headline, plus a sparse
 *          twinkle layer of dots that stay still on prefers-reduced-motion.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Pre-computed star field — fixed positions so server / client render the
 *  same DOM and we don't hit hydration mismatches. 24 stars, varied opacity. */
const STARS = Array.from({ length: 24 }, (_, i) => {
  // Deterministic pseudo-random based on index so SSR/CSR agree.
  const r = (s: number) => ((Math.sin(i * 9.21 + s) + 1) / 2);
  return {
    top:     `${(r(1) * 92 + 4).toFixed(2)}%`,
    left:    `${(r(2) * 96 + 2).toFixed(2)}%`,
    size:    1 + Math.floor(r(3) * 2),     // 1 or 2 px
    opacity: 0.25 + r(4) * 0.35,           // 0.25–0.6
    delay:   `${(r(5) * 4).toFixed(2)}s`,
  };
});

export function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--bg-dark)] text-[var(--ink-inverse)]">
      {/* Slowly drifting brand-tinted radial glow at the centre. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-30 blur-3xl animate-final-cta-drift"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(243,156,50,0.55), rgba(46,182,181,0.35) 35%, transparent 70%)",
        }}
      />

      {/* Star field */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[var(--ink-inverse)] final-cta-star"
            style={{
              top: s.top,
              left: s.left,
              width:  s.size,
              height: s.size,
              opacity: s.opacity,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center px-6 py-32 text-center md:py-40 lg:px-12 lg:py-48">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-[11.5px] font-semibold uppercase tracking-[0.24em] text-[var(--orange-400)]"
        >
          Future-ready schools start here · From ₹100 per student / month
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          className="mt-5 font-semibold leading-[1.05] tracking-[-0.035em]"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
        >
          Bring the AI School Program<br />to your campus.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 0.8, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          className="mt-6 max-w-[640px] font-normal leading-[1.4] tracking-[-0.01em] text-white/85"
          style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)" }}
        >
          Labs, training, and AI software — one program, one partner, one
          transformation. Book a visit and we&apos;ll walk you through what an
          AI School could look like for your students.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
          className="mt-12 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"
        >
          <Link
            href="/request-demo"
            className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[15px] font-semibold text-white shadow-warm transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(243,156,50,0.36)]"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            Book a school visit
            <ArrowRight size={15} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#pillars"
            className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-8 py-3.5 text-[15px] font-semibold text-white backdrop-blur-sm transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:bg-white/[0.08]"
          >
            Explore the program
            <ArrowRight size={15} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* Footer contact strip — pulled from catalogue back cover */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
          className="mt-20 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12.5px] text-white/60"
        >
          <span>Office Agra · 41/143 E-5 Tajmahal Road</span>
          <span aria-hidden className="h-1 w-1 rounded-full bg-white/30" />
          <span>Office Ahmedabad · 5 Shiv Arcade, Vastral</span>
          <span aria-hidden className="h-1 w-1 rounded-full bg-white/30" />
          <a href="mailto:info@skillship.in" className="hover:text-white">info@skillship.in</a>
          <span aria-hidden className="h-1 w-1 rounded-full bg-white/30" />
          <a href="tel:+919081408577" className="hover:text-white">+91 9081 408 577</a>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes final-cta-drift {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%      { transform: translate(-48%, -52%) scale(1.05); }
        }
        .animate-final-cta-drift {
          animation: final-cta-drift 22s ease-in-out infinite;
        }
        @keyframes star-twinkle {
          0%, 100% { transform: scale(1);   opacity: var(--star-opacity, 0.4); }
          50%      { transform: scale(1.6); opacity: 1; }
        }
        .final-cta-star {
          animation: star-twinkle 3.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-final-cta-drift,
          .final-cta-star { animation: none; }
        }
      `}</style>
    </section>
  );
}
