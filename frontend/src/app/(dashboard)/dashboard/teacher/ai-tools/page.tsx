/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/ai-tools/page.tsx
 * Purpose: Teacher AI Tools landing — 4 cards for Plan-01 AI features.
 *          Quick prompts wired to real AI endpoints, results route to relevant pages.
 * Owner:   Pranav
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type ToolKey = "generate" | "grade" | "search";

interface Tool {
  key: ToolKey;
  title: string;
  description: string;
  endpoint: string;
  cta: string;
  href?: string;
  icon: React.ReactNode;
  tone: "primary" | "violet" | "blue" | "amber";
}

const TOOLS: Tool[] = [
  {
    key: "generate",
    title: "AI Question Generator",
    description: "Generate MCQ questions instantly from a topic, PDF, or learning objective. Powered by Gemini.",
    endpoint: "/ai/quiz/generate/",
    cta: "Open generator",
    href: "/dashboard/teacher/quizzes/new",
    tone: "primary",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  },
  {
    key: "grade",
    title: "AI Short-Answer Grader",
    description: "Get suggested score + feedback for student short-answer responses. Review before sending.",
    endpoint: "/ai/quiz/grade-short/",
    cta: "Open feedback queue",
    href: "/dashboard/teacher/feedback",
    tone: "violet",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
  },
  {
    key: "search",
    title: "Content Search",
    description: "Natural-language search across school videos, PDFs, and notes — pgvector-backed semantic search.",
    endpoint: "/ai/content/search/",
    cta: "Search content",
    tone: "blue",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
  },
  // Adaptive Quiz Engine removed from the teacher surface (2026-06-13): adaptive
  // attempts give each student a different question set, so scores aren't
  // comparable and can't feed the leaderboard. To be reintroduced on the
  // student dashboard later. Backend engine + /ai/quiz/adaptive-next/ remain.
];

const TONE_BG: Record<Tool["tone"], string> = {
  primary: "bg-primary/10 text-primary",
  violet:  "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  blue:    "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  amber:   "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
};

export default function AIToolsPage() {
  useEffect(() => { document.title = "AI Tools — Skillship"; }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">AI Tools</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Plan-01 AI features available for teachers — all powered by Skillship&apos;s Gemini bridge</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {TOOLS.map((t, i) => (
          <motion.div
            key={t.key}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 * i }}
            className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]"
          >
            <div className="flex items-start gap-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE_BG[t.tone]}`}>{t.icon}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[var(--foreground)]">{t.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">{t.description}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--foreground)]">{t.endpoint}</code>
                </p>
              </div>
            </div>

            <div className="mt-4">
              {t.key === "search" ? (
                <ContentSearchNotice />
              ) : t.href ? (
                <Link href={t.href} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5">
                  {t.cta}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </Link>
              ) : null}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Content search — coming soon ─────────────────────────────────────────
// Semantic content search needs your school's content library to be uploaded
// and indexed first. Until that's set up we show a warm "coming soon" note
// rather than a search box that would error — see the message copy below.
function ContentSearchNotice() {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-semibold text-primary">
        <span aria-hidden="true">🚧</span> Coming soon
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
        Content Search is being prepared for your school. Once your class materials —
        videos, PDFs and notes — are uploaded and indexed, you&apos;ll be able to search
        them here in plain English. We&apos;ll switch this on shortly; if you&apos;d like it
        enabled sooner, just reach out and we&apos;ll prioritise it for you. Thank you for
        your patience! 🙏
      </p>
    </div>
  );
}
