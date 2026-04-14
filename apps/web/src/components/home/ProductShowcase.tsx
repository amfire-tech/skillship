"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { MotionSection } from "@/components/ui/MotionWrapper";

/* ──────────────── Mini UI mocks ──────────────── */

/* Career Pilot mock — branching path */
function CareerPilotMock() {
  const paths = [
    { label: "JEE / Engineering", match: 92 },
    { label: "AI & Data Science", match: 87 },
    { label: "Robotics Research", match: 74 },
  ];
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-[0_20px_50px_-25px_rgba(5,150,105,0.25)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
              <path d="M12 22c5 0 8-2.5 8-6v-2H4v2c0 3.5 3 6 8 6Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--foreground)]">Career Pilot</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">Student: Aarav · Class 10</p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Live</span>
      </div>

      <div className="mt-5 space-y-2.5">
        {paths.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5"
          >
            <span className="text-xs font-medium text-[var(--foreground)]">{p.label}</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${p.match}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.15, duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-bold text-primary">{p.match}%</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-gradient-to-br from-primary-50 to-accent/10 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">AI recommendation</p>
        <p className="mt-1 text-xs text-[var(--foreground)]">
          Strong logical reasoning + interest in problem-solving → Engineering path
        </p>
      </div>
    </div>
  );
}

/* Analytics mock — bar chart */
function AnalyticsMock() {
  const bars = [42, 65, 48, 78, 62, 85, 92];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-[0_20px_50px_-25px_rgba(5,150,105,0.25)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--foreground)]">Class 9-A Performance</p>
          <p className="text-[10px] text-[var(--muted-foreground)]">Last 7 days · avg accuracy</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-[var(--foreground)]">82%</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">+12%</span>
        </div>
      </div>

      <div className="mt-6 flex h-28 items-end justify-between gap-2">
        {bars.map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <motion.div
              className="w-full rounded-t-md bg-gradient-to-t from-primary to-accent/80"
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: "easeOut" }}
            />
            <span className="text-[10px] font-medium text-[var(--muted-foreground)]">{days[i]}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-primary">
          <path d="m7 15 4-4 3 3 6-7" /><path d="M3 3v18h18" />
        </svg>
        <p className="text-xs text-[var(--foreground)]">
          <span className="font-semibold">Mathematics</span> up 18% this week
        </p>
      </div>
    </div>
  );
}

/* Quiz mock — question card */
function QuizMock() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-[0_20px_50px_-25px_rgba(5,150,105,0.25)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent-600">AI · Class 8</span>
          <span className="text-[10px] text-[var(--muted-foreground)]">Q 3 of 10</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          00:42
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold leading-relaxed text-[var(--foreground)]">
        Which algorithm is used to train neural networks by adjusting weights based on error?
      </p>

      <div className="mt-4 space-y-2">
        {[
          { label: "Linear Regression", state: "idle" },
          { label: "Backpropagation", state: "correct" },
          { label: "K-Means Clustering", state: "idle" },
          { label: "Depth-First Search", state: "idle" },
        ].map((opt, i) => (
          <motion.div
            key={opt.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition ${
              opt.state === "correct"
                ? "border-primary bg-primary/5"
                : "border-[var(--border)] bg-white"
            }`}
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                opt.state === "correct"
                  ? "border-primary bg-primary text-white"
                  : "border-[var(--border)] text-[var(--muted-foreground)]"
              }`}
            >
              {opt.state === "correct" ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m5 12 5 5L20 7" />
                </svg>
              ) : (
                String.fromCharCode(65 + i)
              )}
            </div>
            <span className={opt.state === "correct" ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}>
              {opt.label}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
        <span>Auto-graded · instant feedback</span>
        <span className="font-semibold text-primary">Next question →</span>
      </div>
    </div>
  );
}

/* ──────────────── Split section ──────────────── */

interface ShowcaseProps {
  eyebrow: string;
  title: string;
  description: string;
  outcome: string;
  visual: React.ReactNode;
  reverse?: boolean;
  bullets: string[];
}

function ShowcaseRow({ eyebrow, title, description, outcome, visual, reverse, bullets }: ShowcaseProps) {
  return (
    <div className={`grid items-center gap-12 md:gap-16 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <MotionSection>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
            {title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            {description}
          </p>

          <ul className="mt-6 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </span>
                <span className="text-sm text-[var(--foreground)] md:text-base">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 12 5 5L20 7" />
            </svg>
            {outcome}
          </div>
        </div>
      </MotionSection>

      <MotionSection delay={1}>
        <div className="relative">
          {/* Decorative glow */}
          <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-primary/10 via-accent/5 to-transparent blur-2xl" />
          {visual}
        </div>
      </MotionSection>
    </div>
  );
}

export function ProductShowcase() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <MotionSection className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            The platform
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
            Three connected systems. One intelligent school.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            Each module works standalone and compounds when combined.
          </p>
        </MotionSection>

        <div className="mt-20 space-y-24 md:space-y-32">
          <ShowcaseRow
            eyebrow="AI Career Pilot"
            title="Every student gets a personalised career path."
            description="Skillship analyses quiz patterns, interest signals, and skill strengths to suggest career directions — with match percentages and reasoning students and parents can trust."
            bullets={[
              "Match scores across 40+ modern career paths",
              "Explainable AI — students see why a path fits",
              "Updates as the student grows through Class 6–12",
            ]}
            outcome="Clearer direction for students, less guesswork for parents"
            visual={<CareerPilotMock />}
          />

          <ShowcaseRow
            eyebrow="Performance Analytics"
            title="Principals see the whole school at a glance."
            description="School-wide dashboards show class trends, subject-level gaps, and cohort progression — with AI summaries that surface what actually needs attention this week."
            reverse
            bullets={[
              "Class, subject, and student-level breakdowns",
              "AI-generated weekly insight summaries",
              "Exportable reports for school boards and parents",
            ]}
            outcome="Faster, data-backed decisions at every level"
            visual={<AnalyticsMock />}
          />

          <ShowcaseRow
            eyebrow="Smart Quizzes"
            title="Teachers create assessments in seconds, not hours."
            description="AI generates MCQs, short answers, and concept checks from any topic. Auto-graded, with per-student feedback and class analytics the moment the quiz closes."
            bullets={[
              "AI question generation across every subject",
              "Instant auto-grading with detailed answer analysis",
              "Bulk class assignment and timing controls",
            ]}
            outcome="Teachers spend 80% less time on assessment logistics"
            visual={<QuizMock />}
          />
        </div>
      </Container>
    </section>
  );
}
