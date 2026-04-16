"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

/* ── Architecture layers ── */
const layers = [
  {
    name: "Experience Layer",
    kicker: "Student · Teacher · Principal",
    description: "Role-specific interfaces — dashboards, quiz taking, class management, school-wide views.",
    items: ["Student portal", "Teacher console", "Principal dashboard"],
  },
  {
    name: "AI Intelligence Layer",
    kicker: "The Skillship engine",
    description: "Generative AI + analysis models that turn raw student interactions into career guidance, question generation, and weekly summaries.",
    items: ["Career matching", "Quiz generation", "Insight synthesis"],
    highlight: true,
  },
  {
    name: "Learning & Data Layer",
    kicker: "LMS · analytics · workshops",
    description: "The foundation: curriculum content, workshop catalogue, assessment data, and performance history — all connected.",
    items: ["LMS & courses", "Analytics store", "Workshop marketplace"],
  },
];

/* Mini layer card */
function LayerCard({
  layer,
  index,
}: {
  layer: (typeof layers)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative rounded-[24px] border p-6 transition-all md:p-8 ${
        layer.highlight
          ? "border-primary/30 bg-gradient-to-br from-primary-50 via-white to-accent/5 shadow-[0_24px_60px_-30px_rgba(5,150,105,0.35)]"
          : "border-[var(--border)] bg-white hover:border-primary/20"
      }`}
    >
      {layer.highlight && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_8px_20px_-8px_rgba(5,150,105,0.6)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          Core
        </span>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {layer.kicker}
          </p>
          <h3 className="mt-2 text-xl font-bold text-[var(--foreground)] md:text-2xl">
            {layer.name}
          </h3>
        </div>
        <span className="font-mono text-xs font-semibold text-[var(--muted-foreground)]">
          0{index + 1}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
        {layer.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {layer.items.map((item) => (
          <span
            key={item}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              layer.highlight
                ? "border-primary/25 bg-white/70 text-primary"
                : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function SystemView() {
  return (
    <section className="relative overflow-hidden bg-[var(--muted)] py-20 md:py-28">
      <Container>
        <MotionSection className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            The platform
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
            One system. Three connected layers.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            Skillship isn&apos;t a single tool — it&apos;s an intelligence layer that sits
            between how schools teach and how students learn.
          </p>
        </MotionSection>

        {/* Architecture stack */}
        <div className="relative mx-auto mt-14 max-w-4xl md:mt-16">
          {/* Vertical connector glow */}
          <div
            className="absolute left-1/2 top-8 bottom-8 -z-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-primary/30 via-accent/30 to-primary/20 md:block"
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-4">
            {layers.map((layer, i) => (
              <LayerCard key={layer.name} layer={layer} index={i} />
            ))}
          </div>
        </div>

        {/* Connection labels */}
        <MotionSection className="mx-auto mt-10 max-w-3xl" delay={2}>
          <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--muted-foreground)] md:grid-cols-3 md:gap-6 md:p-6">
            {[
              { icon: "🔗", label: "Real-time sync", sub: "Data flows live" },
              { icon: "🔒", label: "Role-based access", sub: "Every user sees what matters" },
              { icon: "📡", label: "API-first", sub: "Fits existing school stacks" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
                  <p className="text-xs">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </MotionSection>
      </Container>
    </section>
  );
}
