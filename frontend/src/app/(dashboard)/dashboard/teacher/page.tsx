/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/page.tsx
 * Purpose: Teacher home — My Classes overview with AI Quiz Generator.
 *          Stats + classes list + recent quizzes — all real API.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface AcademicClass {
  id: string;
  name?: string;
  class_name?: string;
  subject?: string;
  student_count?: number;
  last_quiz_at?: string;
}

interface Quiz {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  class_name?: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  avg_score?: number;
  total_attempts?: number;
  created_at: string;
  created_by?: string;
}

interface Stats {
  classes: number | null;
  students: number | null;
  quizzesThisMonth: number | null;
  avgScore: number | null;
  prevMonthAvg: number | null;
  prevMonthCount: number | null;
}

const STATUS_PILL: Record<string, string> = {
  DRAFT:     "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  REVIEW:    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  PUBLISHED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  ARCHIVED:  "bg-slate-100 text-slate-500",
  Pending:   "bg-amber-50 text-amber-700",
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); } catch { return iso; }
}

function classInitials(name: string) {
  // "Class 8A" → "8A"; falls back to first 2 chars
  const m = name.match(/(\d+[A-Z]?)/);
  if (m) return m[1];
  return name.replace(/\s+/g, "").slice(0, 3).toUpperCase();
}

export default function TeacherHomePage() {
  const router = useRouter();
  const toast = useToast();
  const { user, displayName } = useAuth();

  const [classes, setClasses] = useState<AcademicClass[] | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [stats, setStats] = useState<Stats>({ classes: null, students: null, quizzesThisMonth: null, avgScore: null, prevMonthAvg: null, prevMonthCount: null });

  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [clRes, qRes] = await Promise.all([
        fetch(`${API_BASE}/academics/classes/`, { headers }),
        fetch(`${API_BASE}/quizzes/`, { headers }),
      ]);
      const clData = clRes.ok ? await clRes.json() : null;
      const qData  = qRes.ok  ? await qRes.json()  : null;

      const classList = asArray<AcademicClass>(clData);
      const quizList  = asArray<Quiz>(qData);

      // Filter to current teacher's quizzes if backend returns created_by
      const myQuizzes = user?.id
        ? quizList.filter((q) => !q.created_by || q.created_by === user.id)
        : quizList;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonth = myQuizzes.filter((q) => new Date(q.created_at) >= monthStart);
      const lastMonth = myQuizzes.filter((q) => new Date(q.created_at) >= lastMonthStart && new Date(q.created_at) < monthStart);

      const scored = myQuizzes.filter((q) => typeof q.avg_score === "number");
      const avg = scored.length === 0 ? null : Math.round(scored.reduce((a, b) => a + (b.avg_score ?? 0), 0) / scored.length * 10) / 10;

      const prevScored = lastMonth.filter((q) => typeof q.avg_score === "number");
      const prevAvg = prevScored.length === 0 ? null : Math.round(prevScored.reduce((a, b) => a + (b.avg_score ?? 0), 0) / prevScored.length * 10) / 10;

      // Aggregate students from classes
      const studentTotal = classList.reduce((sum, c) => sum + (c.student_count ?? 0), 0);

      setClasses(classList);
      setQuizzes(myQuizzes);
      setStats({
        classes: classList.length,
        students: studentTotal,
        quizzesThisMonth: thisMonth.length,
        avgScore: avg,
        prevMonthAvg: prevAvg,
        prevMonthCount: lastMonth.length,
      });
    } catch {
      // skeletons remain
    }
  }, [user?.id]);

  useEffect(() => { document.title = "My Classes — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const monthDelta = useMemo(() => {
    if (stats.quizzesThisMonth === null || stats.prevMonthCount === null || stats.prevMonthCount === 0) return null;
    return Math.round(((stats.quizzesThisMonth - stats.prevMonthCount) / stats.prevMonthCount) * 100);
  }, [stats.quizzesThisMonth, stats.prevMonthCount]);

  const scoreDelta = useMemo(() => {
    if (stats.avgScore === null || stats.prevMonthAvg === null) return null;
    return Math.round((stats.avgScore - stats.prevMonthAvg) * 10) / 10;
  }, [stats.avgScore, stats.prevMonthAvg]);

  const recent = useMemo(() => (quizzes ?? []).slice(0, 5), [quizzes]);

  async function generateWithAI() {
    const prompt = aiPrompt.trim();
    if (prompt.length < 10) { toast("Describe the quiz in more detail.", "error"); return; }
    setGenerating(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setGenerating(false); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/generate/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? `Generation failed (${res.status})`, "error");
        return;
      }
      const data = await res.json();
      const items = (data?.questions ?? data ?? [])
        .map((q: { text?: string; question_text?: string; question?: string; options?: string[]; choices?: string[]; correct_answer_index?: number; correct_index?: number; difficulty?: string }) => ({
          text: q.text ?? q.question_text ?? q.question ?? "",
          subject: data?.subject,
          difficulty: (q.difficulty ?? data?.difficulty ?? "MEDIUM").toString().toUpperCase(),
          options: q.options ?? q.choices ?? [],
          correct_answer_index: q.correct_answer_index ?? q.correct_index ?? 0,
        }))
        .filter((q: { text: string; options: string[] }) => q.text && q.options.length >= 2);

      if (items.length === 0) { toast("Generator returned no usable questions.", "error"); return; }
      sessionStorage.setItem("skillship-quiz-draft-questions", JSON.stringify(items));
      toast(`${items.length} question${items.length === 1 ? "" : "s"} generated — opening wizard`, "success");
      router.push("/dashboard/teacher/quizzes/new");
    } catch {
      toast("Network error", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--muted-foreground)]">
          Welcome back, <span className="font-semibold text-[var(--foreground)]">{displayName ?? "Teacher"}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Classes"          value={stats.classes}          tone="blue"   icon={<BookIcon />} />
        <StatCard label="Students I Teach"    value={stats.students}         tone="teal"   icon={<UsersIcon />} />
        <StatCard label="Quizzes This Month"  value={stats.quizzesThisMonth} tone="violet" icon={<QuizIcon />} delta={monthDelta} deltaSuffix="vs last month" />
        <StatCard label="Average Class Score" value={stats.avgScore === null ? "—" : `${stats.avgScore}%`} tone="amber" icon={<MedalIcon />} delta={scoreDelta} deltaSuffix="vs last month" />
      </div>

      {/* AI Quiz Generator banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
        className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-[var(--background)] dark:to-accent/10"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">✨</span>
            <span aria-hidden="true">🤖</span>
            <h2 className="text-base font-bold tracking-tight text-primary">AI Quiz Generator</h2>
          </div>
          <span className="rounded-full border border-primary/30 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-[var(--background)]">AI Powered</span>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm text-[var(--foreground)]">Describe the quiz you want and our AI will generate quality MCQ questions instantly.</p>
          <textarea
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Create 10 MCQ questions for Class 8 on Robotics Sensors, medium difficulty"
            className="w-full rounded-xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]/60"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted-foreground)]">Tip: Specify class, subject, number of questions &amp; difficulty level for best results.</p>
            <button
              type="button"
              onClick={generateWithAI}
              disabled={generating || aiPrompt.trim().length < 10}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {generating ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Generating…
                </>
              ) : <>✨ Generate with AI</>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Two-col: My Classes + Recent Quizzes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Classes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">My Classes</h2>
            <Link href="/dashboard/teacher/quizzes/new" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Create Quiz
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="p-4">
            {classes === null ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--muted)]/40 p-4">
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[var(--muted)]" />
                    <div className="flex-1 space-y-2"><div className="h-4 w-2/3 animate-pulse rounded bg-[var(--muted)]" /><div className="h-3 w-1/2 animate-pulse rounded bg-[var(--muted)]" /></div>
                  </div>
                ))}
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookIcon /></div>
                <p className="text-sm font-medium text-[var(--foreground)]">No classes assigned yet</p>
                <p className="text-xs text-[var(--muted-foreground)]">Ask your principal to assign you a class.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {classes.slice(0, 4).map((c) => {
                  const name = c.class_name ?? c.name ?? "—";
                  return (
                    <li key={c.id} className="flex items-center gap-3 rounded-xl bg-[var(--muted)]/30 p-4 transition-colors hover:bg-[var(--muted)]/60">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                        {classInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{name}{c.subject ? ` · ${c.subject}` : ""}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {c.student_count != null ? `${c.student_count} students` : "—"}
                          {c.last_quiz_at ? ` · Last quiz: ${fmtDate(c.last_quiz_at)}` : ""}
                        </p>
                      </div>
                      <Link href="/dashboard/teacher/quizzes" className="inline-flex h-8 items-center gap-1 rounded-full border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--muted-foreground)] hover:border-primary/30 hover:text-primary dark:bg-[var(--background)]">
                        View
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>

        {/* Recent Quizzes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Recent Quizzes</h2>
            <Link href="/dashboard/teacher/quizzes" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <th className="px-6 py-3">Quiz</th>
                  <th className="px-3 py-3">Class</th>
                  <th className="px-3 py-3">Attempts</th>
                  <th className="px-3 py-3">Avg</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {quizzes === null ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-3 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>
                      ))}
                    </tr>
                  ))
                ) : recent.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-[var(--muted-foreground)]">No quizzes yet — generate one above or use the wizard.</td></tr>
                ) : (
                  recent.map((q) => (
                    <tr key={q.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="px-6 py-3.5 max-w-[200px]">
                        <Link href={`/dashboard/teacher/quizzes/${q.id}`} className="block truncate font-medium text-[var(--foreground)] hover:text-primary">{q.title}</Link>
                      </td>
                      <td className="px-3 py-3.5 text-[var(--muted-foreground)]">{q.class_name ?? q.grade ?? "—"}</td>
                      <td className="px-3 py-3.5 text-[var(--muted-foreground)]">{q.total_attempts ?? "—"}</td>
                      <td className="px-3 py-3.5 text-[var(--muted-foreground)]">{typeof q.avg_score === "number" ? `${Math.round(q.avg_score)}%` : "—"}</td>
                      <td className="px-6 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[q.status] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                          {q.status === "REVIEW" ? "Pending" : q.status.charAt(0) + q.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, tone, delta, deltaSuffix }: {
  label: string;
  value: string | number | null;
  icon: React.ReactNode;
  tone: "blue" | "teal" | "violet" | "amber";
  delta?: number | null;
  deltaSuffix?: string;
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
          {delta >= 0 ? <UpIcon /> : <DownIcon />}
          {delta >= 0 ? "+" : ""}{delta}% {deltaSuffix}
        </p>
      )}
    </motion.div>
  );
}

function BookIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>; }
function UsersIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function QuizIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>; }
function MedalIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6" /><path d="m9 14 -2 7 5 -3 5 3 -2 -7" /></svg>; }
function UpIcon()    { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 17 17 7" /><polyline points="7 7 17 7 17 17" /></svg>; }
function DownIcon()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 7 17 17" /><polyline points="17 7 17 17 7 17" /></svg>; }
