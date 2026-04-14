"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

const testimonials = [
  {
    quote:
      "Our quiz completion rate went from 40% to 92% in three months. The career pilot alone has helped over 200 students find direction.",
    name: "Dr. Priya Sharma",
    role: "Principal",
    school: "Delhi Public School",
    city: "Bangalore",
    featured: true,
    metric: "+52% completion",
  },
  {
    quote:
      "As a Tier-2 school, we needed quality AI education without the infrastructure cost. Skillship made it possible in weeks, not years.",
    name: "Ramesh Kulkarni",
    role: "Principal",
    school: "Vidyanagar High",
    city: "Pune",
    metric: "Launched in 2 weeks",
  },
  {
    quote:
      "The analytics dashboard gave me clear visibility into every classroom. I finally see what works.",
    name: "Anjali Menon",
    role: "Academic Head",
    school: "Heritage School",
    city: "Chennai",
    metric: "School-wide visibility",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <MotionSection className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              What schools say
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
              Real decisions. Real outcomes.
            </h2>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] md:text-base">
            From 500+ partner schools across India
          </p>
        </MotionSection>

        <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative flex flex-col rounded-[24px] border p-7 transition-all hover:-translate-y-1 md:p-8 ${
                t.featured
                  ? "md:col-span-2 md:row-span-1 border-primary/20 bg-gradient-to-br from-primary-50 via-white to-accent/5 shadow-[0_24px_60px_-30px_rgba(5,150,105,0.3)]"
                  : "border-[var(--border)] bg-white hover:border-primary/25 hover:shadow-[0_16px_40px_-20px_rgba(5,150,105,0.15)]"
              }`}
            >
              {/* Decorative quote */}
              <div className={`absolute right-6 top-6 text-6xl font-bold leading-none opacity-10 ${t.featured ? "text-primary" : "text-primary"}`}>
                &ldquo;
              </div>

              {/* Metric pill */}
              <div className="inline-flex self-start items-center gap-1.5 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m7 15 4-4 3 3 6-7" /><path d="M3 3v18h18" />
                </svg>
                {t.metric}
              </div>

              <blockquote
                className={`mt-5 flex-1 leading-relaxed text-[var(--foreground)] ${
                  t.featured ? "text-xl md:text-2xl font-medium" : "text-base"
                }`}
              >
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--border)] pt-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                  {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{t.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t.role} · {t.school}, {t.city}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
