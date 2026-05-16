/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/ai-tools/page.tsx
 * Purpose: Teacher AI Tools landing — 4 cards for Plan-01 AI features.
 *          Quick prompts wired to real AI endpoints, results route to relevant pages.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

type ToolKey = "generate" | "grade" | "search" | "adaptive";

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
    endpoint: "/quizzes/generate/",
    cta: "Open generator",
    href: "/dashboard/teacher/quizzes/new",
    tone: "primary",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  },
  {
    key: "grade",
    title: "AI Short-Answer Grader",
    description: "Get suggested score + feedback for student short-answer responses. Review before sending.",
    endpoint: "/quizzes/grade-short/",
    cta: "Open feedback queue",
    href: "/dashboard/teacher/feedback",
    tone: "violet",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
  },
  {
    key: "search",
    title: "Content Search",
    description: "Natural-language search across school videos, PDFs, and notes — pgvector-backed semantic search.",
    endpoint: "/content/search/",
    cta: "Search content",
    tone: "blue",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
  },
  {
    key: "adaptive",
    title: "Adaptive Quiz Engine",
    description: "Auto-difficulty next question for each student based on their attempt history. Wires into student quiz player.",
    endpoint: "/quizzes/adaptive-next/",
    cta: "Read more",
    tone: "amber",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9" /><path d="m17 8-4 4 4 4" /></svg>,
  },
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
                <ContentSearchInline />
              ) : t.key === "adaptive" ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Adaptive engine runs server-side during a student&apos;s active attempt. No teacher action needed — wire your quiz with adaptive mode in the wizard&apos;s Settings step.
                </p>
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

      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-3 text-xs text-[var(--muted-foreground)]">
        <strong className="text-[var(--foreground)]">Note:</strong> Conversational AI Tutor, weekly auto-reports, and risk alerts are <strong>Plan 02</strong> features and not exposed yet.
      </div>
    </div>
  );
}

// ─── Inline content search ──────────────────────────────────────────────
interface SearchHit {
  id: string;
  title: string;
  snippet?: string;
  content_type?: string;
  subject?: string;
  url?: string;
  score?: number;
}

function ContentSearchInline() {
  const toast = useToast();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<SearchHit[] | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 3) { toast("Enter a longer query.", "error"); return; }
    setBusy(true);
    setHits(null);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setBusy(false); return; }
    try {
      const res = await fetch(`${API_BASE}/content/search/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim(), top_k: 5 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? `Search failed (${res.status})`, "error");
        setHits([]);
        return;
      }
      const data = await res.json();
      const results = (data?.results ?? data ?? []) as SearchHit[];
      setHits(results);
      if (results.length === 0) toast("No matches.", "info");
    } catch {
      toast("Network error", "error");
      setHits([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. photosynthesis stages" className="h-9 flex-1 rounded-full border border-[var(--border)] bg-white px-4 text-xs outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]" />
        <button type="submit" disabled={busy || q.trim().length < 3} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 text-xs font-semibold text-white disabled:opacity-60">
          {busy ? "Searching…" : "Search"}
        </button>
      </form>
      {hits && hits.length > 0 && (
        <ul className="space-y-1.5 rounded-xl border border-[var(--border)] bg-white p-2 dark:bg-[var(--background)]">
          {hits.slice(0, 5).map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => h.url ? window.open(h.url, "_blank") : router.push(`/dashboard/teacher/quizzes`)}
                className="block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--muted)]/50"
              >
                <p className="text-xs font-semibold text-[var(--foreground)]">{h.title}</p>
                {h.snippet && <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--muted-foreground)]">{h.snippet}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
