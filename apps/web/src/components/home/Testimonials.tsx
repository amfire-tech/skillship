"use client";

import { useRef } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const testimonials = [
  {
    quote: "Mind blowing course, instructors explanation was nice and the best part about SkillShip is that they have interactive Animated Content.",
    name: "Jay Prakash",
    city: "Agra",
    metric: "Interactive content",
    rotate: "-1.5deg",
    accent: "from-primary to-accent",
  },
  {
    quote: "It was an amazing class! Looking forward to working on my own game. Thank you so much for teaching me about python. The best part is that Skillship have Quizzes for better understanding.",
    name: "Shinaya",
    city: "Gurugram",
    metric: "Quiz-based learning",
    rotate: "1.2deg",
    accent: "from-teal-500 to-emerald-400",
  },
  {
    quote: "Really super, the way our instructor explained was great and the best part is that SkillShip has instant doubt resolution which gaves me a smooth flow in studies.",
    name: "Ansh",
    city: "Mumbai",
    metric: "Instant doubt resolution",
    rotate: "-0.8deg",
    accent: "from-emerald-500 to-teal-400",
  },
  {
    quote: "SkillShip is taking care of my skills with its web development course & best part is that I can easily learn using mobile phone only.",
    name: "Rishi",
    city: "Lucknow",
    metric: "Mobile learning",
    rotate: "1.8deg",
    accent: "from-primary to-emerald-600",
  },
  /* duplicate set for seamless loop */
  {
    quote: "Mind blowing course, instructors explanation was nice and the best part about SkillShip is that they have interactive Animated Content.",
    name: "Jay Prakash",
    city: "Agra",
    metric: "Interactive content",
    rotate: "-1.5deg",
    accent: "from-primary to-accent",
  },
  {
    quote: "It was an amazing class! Looking forward to working on my own game. Thank you so much for teaching me about python. The best part is that Skillship have Quizzes for better understanding.",
    name: "Shinaya",
    city: "Gurugram",
    metric: "Quiz-based learning",
    rotate: "1.2deg",
    accent: "from-teal-500 to-emerald-400",
  },
  {
    quote: "Really super, the way our instructor explained was great and the best part is that SkillShip has instant doubt resolution which gaves me a smooth flow in studies.",
    name: "Ansh",
    city: "Mumbai",
    metric: "Instant doubt resolution",
    rotate: "-0.8deg",
    accent: "from-emerald-500 to-teal-400",
  },
  {
    quote: "SkillShip is taking care of my skills with its web development course & best part is that I can easily learn using mobile phone only.",
    name: "Rishi",
    city: "Lucknow",
    metric: "Mobile learning",
    rotate: "1.8deg",
    accent: "from-primary to-emerald-600",
  },
];

/* Infinite horizontal marquee using Framer Motion */
function InfiniteMarquee() {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);
  const SPEED = 0.45; // px per frame

  useAnimationFrame(() => {
    if (isPaused.current) return;
    const container = containerRef.current;
    if (!container) return;
    const halfWidth = container.scrollWidth / 2;
    const next = (x.get() - SPEED) % -halfWidth;
    x.set(next);
  });

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={() => { isPaused.current = true; }}
      onMouseLeave={() => { isPaused.current = false; }}
    >
      <motion.div
        ref={containerRef}
        style={{ x }}
        className="flex gap-5 will-change-transform"
      >
        {testimonials.map((t, i) => (
          <motion.figure
            key={`${t.name}-${i}`}
            whileHover={{ scale: 1.02, rotate: "0deg" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ rotate: t.rotate }}
            className="group relative flex w-[320px] shrink-0 flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--border)] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(5,150,105,0.15)] cursor-default"
          >
            {/* Large decorative " */}
            <div className="pointer-events-none absolute -right-2 -top-4 select-none font-serif text-[9rem] font-black leading-none text-primary/6">
              &ldquo;
            </div>

            {/* Top accent stripe */}
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${t.accent}`} />

            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, s) => (
                <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill="#059669">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>

            {/* Quote */}
            <blockquote className="relative z-10 flex-1 text-[13px] leading-[1.65] text-[var(--foreground)]">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            {/* Footer */}
            <figcaption className="mt-5 flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${t.accent}`}>
                {t.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[var(--foreground)]">{t.name}</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">{t.city}</p>
              </div>
              <span className="ml-auto shrink-0 rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {t.metric}
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="overflow-hidden py-16 md:py-20">
      <Container>
        <MotionSection className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Student voices
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
              What learners say
            </h2>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Hover to pause · from students across India
          </p>
        </MotionSection>
      </Container>

      {/* Full-bleed marquee — outside Container intentionally */}
      <div className="mt-10 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <InfiniteMarquee />
      </div>
    </section>
  );
}
