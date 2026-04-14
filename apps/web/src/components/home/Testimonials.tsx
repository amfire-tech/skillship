"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const testimonials = [
  {
    quote:
      "Mind blowing course, instructors explanation was nice and the best part about SkillShip is that they have interactive Animated Content.",
    name: "Jay Prakash",
    role: "Student",
    school: "Skillship Learner",
    city: "Agra",
    featured: true,
    metric: "Interactive content",
  },
  {
    quote:
      "It was an amazing class! Looking forward to working on my own game. Thank you so much for teaching me about python. The best part is that Skillship have Quizzes for better understanding.",
    name: "Shinaya",
    role: "Student",
    school: "Skillship Learner",
    city: "Gurugram",
    metric: "Quiz-based learning",
  },
  {
    quote:
      "Really super, the way our instructor explained was great and the best part is that SkillShip has instant doubt resolution which gaves me a smooth flow in studies.",
    name: "Ansh",
    role: "Student",
    school: "Skillship Learner",
    city: "Mumbai",
    metric: "Instant doubt resolution",
  },
  {
    quote:
      "SkillShip is taking care of my skills with its web development course & best part is that I can easily learn using mobile phone only.",
    name: "Rishi",
    role: "Student",
    school: "Skillship Learner",
    city: "Lucknow",
    metric: "Mobile learning",
  },
];

export function Testimonials() {
  return (
    <section className="py-16 md:py-20">
      <Container>
        <MotionSection className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Student reviews
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
            What learners say
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Real feedback from Skillship students across India
          </p>
        </MotionSection>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_12px_30px_-15px_rgba(5,150,105,0.2)]"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#059669" className="opacity-90">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="flex-1 text-sm leading-relaxed text-[var(--foreground)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <figcaption className="flex items-center gap-2.5 border-t border-[var(--border)] pt-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]">{t.name}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">{t.city}</p>
                </div>
                <span className="ml-auto rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {t.metric}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
