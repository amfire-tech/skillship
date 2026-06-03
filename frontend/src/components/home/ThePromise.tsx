/*
 * File:    frontend/src/components/home/ThePromise.tsx
 * Purpose: The "wait, that's different" moment (skillship_homepage_brief.md §4).
 *          Two-line statement — line 1 faded grey ("Most school platforms
 *          added an AI tab."), line 2 reveals as the punchline with the word
 *          "rebuilt" transitioning to teal-500 600ms after line 2 lands.
 *          No image — typography + motion carry it.
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ThePromise() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  // "rebuilt" gets the orange recolor 600ms AFTER line 2 has fully landed,
  // creating the deliberate punchline beat — orange to match every other
  // headline accent on the site.
  const [accent, setAccent] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setAccent(true), 1100); // ~ line2 reveal (500ms) + 600ms beat
    return () => clearTimeout(t);
  }, [inView]);

  return (
    <section ref={ref} className="bg-white">
      <div className="mx-auto max-w-[960px] px-6 py-32 text-center md:py-40 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 0.45, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="font-normal leading-[1.1] tracking-[-0.02em] text-[var(--ink-tertiary)]"
          style={{ fontSize: "clamp(2rem, 4.2vw, 3.5rem)" }}
        >
          Most school platforms added an AI tab.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
          style={{ fontSize: "clamp(2.25rem, 4.8vw, 4rem)" }}
        >
          We{" "}
          <span
            className="transition-colors duration-[600ms] ease-out-expo"
            style={{ color: accent ? "var(--orange-500)" : "var(--ink-primary)" }}
          >
            rebuilt
          </span>{" "}
          the foundation.
        </motion.p>

        {/* Small teal divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.2, ease: EASE }}
          aria-hidden
          className="mx-auto mt-10 h-px w-16 origin-center bg-[var(--orange-500)]"
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 1.4, ease: EASE }}
          className="mx-auto mt-10 max-w-[640px] text-[17px] leading-[1.65] text-[var(--ink-secondary)] md:text-[19px]"
        >
          Skillship runs real intelligence on every quiz attempt, every content
          view, every dashboard load. It&apos;s not a feature. It&apos;s how the
          platform thinks.
        </motion.p>
      </div>
    </section>
  );
}
