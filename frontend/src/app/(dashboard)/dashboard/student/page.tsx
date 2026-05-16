/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/page.tsx
 * Purpose: Student My Learning home — hero w/ rank, 4 stats, AI Career Guide,
 *          upcoming quizzes, recent results. Real API only.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";

interface Quiz {
  id: string;
  title: string;
  subject?: string;
  status: string;
  due_date?: string | null;
  duration_minutes?: number;
  difficulty?: string;
}

interface Attempt {
  id: string;
  quiz_id?: string;
  quiz_title?: string;
  score?: number;
  rank?: number;
  attempted_at?: string;
  created_at?: string;
}

interface AttemptSummary {
  completed: number;
  total: number;
  avg_score: number | null;
  prev_avg_score?: number | null;
  prev_completed?: number;
}

interface MeProfile {
  rank?: number;
  rank_in_class?: number;
  class_size?: number;
  class_name?: string;
  roll_number?: string;
  school_name?: string;
  certificates_count?: number;
  career_path?: string;
  career_match_pct?: number;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; }
}
function shortDate(iso?: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); } catch { return iso; }
}
function initials(name: string) { return (name || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join(""); }

export default function StudentMyLearning() {
  const { user, displayName } = useAuth();
  const [upcoming, setUpcoming] = useState<Quiz[] | null>(null);
  const [recent, setRecent] = useState<Attempt[] | null>(null);
  const [summary, setSummary] = useState<AttemptSummary | null>(null);
  const [profile, setProfile] = useState<MeProfile | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [quizzesRes, attemptsRes, summaryRes, meRes] = await Promise.all([
        fetch(`${API_BASE}/quizzes/?status=PUBLISHED`, { headers }),
        fetch(`${API_BASE}/quizzes/attempts/`, { headers }),
        fetch(`${API_BASE}/quizzes/attempts/summary/`, { headers }),
        fetch(`${API_BASE}/auth/me/`, { headers }),
      ]);
      if (quizzesRes.ok)  setUpcoming(asArray<Quiz>(await quizzesRes.json()).slice(0, 4));  else setUpcoming([]);
      if (attemptsRes.ok) {
        const att = asArray<Attempt>(await attemptsRes.json());
        att.sort((a, b) => new Date(b.attempted_at ?? b.created_at ?? "").getTime() - new Date(a.attempted_at ?? a.created_at ?? "").getTime());
        setRecent(att.slice(0, 5));
      } else setRecent([]);
      if (summaryRes.ok)  setSummary(await summaryRes.json());                    else setSummary({ completed: 0, total: 0, avg_score: null });
      if (meRes.ok)       setProfile(await meRes.json());                         else setProfile({});
    } catch {
      setUpcoming([]); setRecent([]);
      setSummary({ completed: 0, total: 0, avg_score: null });
      setProfile({});
    }
  }, []);

  useEffect(() => { document.title = "My Learning — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const completedDelta = useMemo(() => {
    if (!summary || summary.prev_completed == null || summary.prev_completed === 0) return null;
    return Math.round(((summary.completed - summary.prev_completed) / summary.prev_completed) * 100);
  }, [summary]);

  const scoreDelta = useMemo(() => {
    if (!summary || summary.avg_score == null || summary.prev_avg_score == null) return null;
    return Math.round((summary.avg_score - summary.prev_avg_score) * 10) / 10;
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 text-white shadow-[0_30px_60px_-20px_rgba(5,150,105,0.4)] md:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Hello, {displayName ?? "Student"} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1.5 text-sm text-white/85">
              {profile?.class_name ?? "—"}{profile?.roll_number ? ` · Roll No. ${profile.roll_number}` : ""}{profile?.school_name ? ` · ${profile.school_name}` : ""}
            </p>
          </div>
          {profile?.rank_in_class != null && (
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">Current Rank</p>
              <p className="text-3xl font-bold md:text-4xl">{ordinal(profile.rank_in_class)}</p>
              {profile.class_name && <p className="text-xs text-white/85">in {profile.class_name}</p>}
            </div>
          )}
        </div>
      </motion.section>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Quizzes Completed" value={summary?.completed ?? null} icon={<BookIcon />}      tone="blue"   delta={completedDelta} suffix="vs last month" />
        <Stat label="Average Score"     value={summary?.avg_score == null ? "—" : `${summary.avg_score}%`} icon={<StarIcon />} tone="amber"  delta={scoreDelta} suffix="vs last month" />
        <Stat label="Rank in Class"     value={profile?.rank_in_class != null ? `#${profile.rank_in_class}` : "—"} icon={<TargetIcon />} tone="violet" />
        <Stat label="Certificates Earned" value={profile?.certificates_count ?? null} icon={<MedalIcon />} tone="teal" />
      </div>

      {/* AI Career Guide */}
      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
        className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-[var(--background)] dark:to-accent/10"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">✨</span>
            <span aria-hidden="true">🤖</span>
            <h2 className="text-base font-bold tracking-tight text-primary">Your AI Career Guide</h2>
          </div>
          <span className="rounded-full border border-primary/30 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-[var(--background)]">AI Powered</span>
        </div>
        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-[var(--foreground)]">Recommended Career Path</p>
              {profile?.career_match_pct != null && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{profile.career_match_pct}% Match</span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {profile?.career_path
                ? <>Based on your quiz performance, interests, and learning patterns, our AI recommends a career in <strong className="text-primary">{profile.career_path}</strong>. Open the Career Pilot to explore the full roadmap.</>
                : <>Take a few quizzes and complete your profile — the AI Career Pilot will suggest a personalised path based on your strengths.</>}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(profile?.career_path?.split(/\s*\/\s*|\s*,\s*/) ?? []).slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <Link href="/dashboard/student/career" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5">
              Chat with Career AI
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
            <Link href="/dashboard/student/career?tab=roadmap" className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 dark:bg-[var(--background)]">
              View My Roadmap
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Two-col: Upcoming + Recent Results */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Upcoming Quizzes</h2>
            <Link href="/dashboard/student/quizzes" className="text-xs font-semibold text-primary hover:underline">View all →</Link>
          </div>
          <div className="space-y-3 p-4">
            {upcoming === null
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--muted)]/40" />)
              : upcoming.length === 0
                ? <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">No upcoming quizzes — check back soon.</div>
                : upcoming.map((q) => (
                  <div key={q.id} className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                      {initials(q.subject ?? q.title)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{q.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {q.due_date ? fmtDate(q.due_date) : "Open now"}
                        {q.duration_minutes ? ` · ${q.duration_minutes} min` : ""}
                      </p>
                    </div>
                    <Link href={`/dashboard/student/quizzes/${q.id}`} className="inline-flex h-9 items-center gap-1 rounded-full bg-gradient-to-r from-primary to-accent px-4 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5">
                      Attempt Now
                    </Link>
                  </div>
                ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Recent Results</h2>
            <Link href="/dashboard/student/results" className="text-xs font-semibold text-primary hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <th className="px-6 py-3">Quiz Name</th>
                  <th className="px-3 py-3">Score</th>
                  <th className="px-3 py-3">Rank</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent === null
                  ? Array.from({ length: 4 }).map((_, i) => <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">{Array.from({ length: 4 }).map((__, j) => <td key={j} className="px-3 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>)}</tr>)
                  : recent.length === 0
                    ? <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-[var(--muted-foreground)]">No results yet — start with an upcoming quiz.</td></tr>
                    : recent.map((a) => (
                      <tr key={a.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                        <td className="px-6 py-3.5 max-w-[200px]">
                          <Link href={`/dashboard/student/results/${a.id}`} className="block truncate font-medium text-[var(--foreground)] hover:text-primary">{a.quiz_title ?? "—"}</Link>
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-emerald-600">{typeof a.score === "number" ? `${Math.round(a.score)}%` : "—"}</td>
                        <td className="px-3 py-3.5 text-[var(--muted-foreground)]">{a.rank ? ordinal(a.rank) : "—"}</td>
                        <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{shortDate(a.attempted_at ?? a.created_at)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function Stat({ label, value, icon, tone, delta, suffix }: {
  label: string;
  value: number | string | null;
  icon: React.ReactNode;
  tone: "blue" | "teal" | "violet" | "amber";
  delta?: number | null;
  suffix?: string;
}) {
  const tones = {
    blue:   "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    teal:   "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    amber:  "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
        {value === null ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-[var(--muted)]" /> : value}
      </p>
      {typeof delta === "number" && (
        <p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {delta >= 0 ? "↑" : "↓"} {delta >= 0 ? "+" : ""}{delta}% {suffix}
        </p>
      )}
    </motion.div>
  );
}

function BookIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>; }
function StarIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>; }
function TargetIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>; }
function MedalIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6" /><path d="m9 14 -2 7 5 -3 5 3 -2 -7" /></svg>; }
