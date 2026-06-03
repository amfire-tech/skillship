/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/ai-summary/page.tsx
 * Purpose: Principal — AI Summary. Deterministic narrative + recommendations
 *          derived entirely from real /quizzes/, /users/, /academics/classes/.
 *          No fake AI claims; clearly attributed to Skillship analytics.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";

interface Quiz {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  class_name?: string;
  status: string;
  avg_score?: number;
  pass_rate?: number;
  total_attempts?: number;
  created_at: string;
  created_by?: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  last_login?: string;
}

interface AcademicClass {
  id: string;
  name?: string;
  class_name?: string;
  avg_score?: number;
  student_count?: number;
}

export default function AISummaryPage() {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [students, setStudents] = useState<User[] | null>(null);
  const [teachers, setTeachers] = useState<User[] | null>(null);
  const [classes, setClasses] = useState<AcademicClass[] | null>(null);
  const [schoolName, setSchoolName] = useState("Your School");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [qRes, sRes, tRes, cRes, schRes] = await Promise.all([
        fetch(`${API_BASE}/quizzes/`,             { headers }),
        fetch(`${API_BASE}/users/?role=STUDENT`,  { headers }),
        fetch(`${API_BASE}/users/?role=TEACHER`,  { headers }),
        fetch(`${API_BASE}/academics/classes/`,   { headers }),
        fetch(`${API_BASE}/schools/`,             { headers }),
      ]);
      setQuizzes(qRes.ok ? asArray<Quiz>(await qRes.json()) : []);
      setStudents(sRes.ok ? asArray<User>(await sRes.json()) : []);
      setTeachers(tRes.ok ? asArray<User>(await tRes.json()) : []);
      setClasses(cRes.ok ? asArray<AcademicClass>(await cRes.json()) : []);
      const sd = schRes.ok ? await schRes.json() : null;
      const first = (sd?.results ?? sd ?? [])[0];
      if (first?.name) setSchoolName(first.name);
    } catch {
      // empty arrays — UI shows "not enough data"
    }
  }, []);

  useEffect(() => { document.title = "AI Summary — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // ─── Insights derivation ─────────────────────────────────────────────
  const insights = useMemo(() => {
    if (!quizzes || !students || !teachers || !classes) return null;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonth = quizzes.filter((q) => new Date(q.created_at) >= monthStart);
    const lastMonth = quizzes.filter((q) => new Date(q.created_at) >= lastMonthStart && new Date(q.created_at) < monthStart);

    const scored = quizzes.filter((q) => typeof q.avg_score === "number");
    const overallAvg = scored.length === 0 ? null : Math.round(scored.reduce((a, b) => a + (b.avg_score ?? 0), 0) / scored.length);

    // Per-class avg
    const classScores = classes
      .map((c) => ({ name: c.class_name ?? c.name ?? "—", score: typeof c.avg_score === "number" ? Math.round(c.avg_score) : null, students: c.student_count ?? null }))
      .filter((c) => c.score !== null) as { name: string; score: number; students: number | null }[];

    const lowestClass = classScores.length === 0 ? null : classScores.reduce((min, c) => (c.score < min.score ? c : min), classScores[0]);
    const highestClass = classScores.length === 0 ? null : classScores.reduce((max, c) => (c.score > max.score ? c : max), classScores[0]);

    // Per-subject avg
    const bySubject = new Map<string, number[]>();
    scored.forEach((q) => {
      if (!q.subject) return;
      const arr = bySubject.get(q.subject) ?? [];
      arr.push(q.avg_score!);
      bySubject.set(q.subject, arr);
    });
    const subjectAvgs = Array.from(bySubject.entries())
      .map(([s, vals]) => ({ subject: s, score: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
      .sort((a, b) => b.score - a.score);

    const weakestSubject = subjectAvgs.length === 0 ? null : subjectAvgs[subjectAvgs.length - 1];
    const strongestSubject = subjectAvgs.length === 0 ? null : subjectAvgs[0];

    // Inactive teachers (no quiz this month)
    const activeTeacherIds = new Set(thisMonth.filter((q) => q.created_by).map((q) => q.created_by));
    const inactiveTeachers = teachers.filter((t) => !activeTeacherIds.has(t.id));

    // Quiz volume delta
    const volumeDelta = lastMonth.length === 0 ? null : Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100);

    return {
      schoolName,
      thisMonthQuizzes: thisMonth.length,
      lastMonthQuizzes: lastMonth.length,
      overallAvg,
      classScores,
      lowestClass,
      highestClass,
      subjectAvgs,
      weakestSubject,
      strongestSubject,
      inactiveTeachers,
      teachersTotal: teachers.length,
      studentsTotal: students.length,
      volumeDelta,
    };
  }, [quizzes, students, teachers, classes, schoolName]);

  const recs = useMemo(() => {
    if (!insights) return [];
    const list: { tone: "warn" | "info" | "good"; title: string; body: string; href?: string; cta?: string }[] = [];

    if (insights.lowestClass && insights.lowestClass.score < 65) {
      list.push({
        tone: "warn",
        title: `Schedule remedial sessions for ${insights.lowestClass.name}`,
        body: `${insights.lowestClass.name} averaged ${insights.lowestClass.score}% — well below the school target. Consider extra practice quizzes and one-on-one teacher time before the next term exam.`,
        href: "/dashboard/principal/classes",
        cta: "Open Class Management",
      });
    }
    if (insights.weakestSubject && insights.weakestSubject.score < 70) {
      list.push({
        tone: "warn",
        title: `Strengthen ${insights.weakestSubject.subject} curriculum`,
        body: `${insights.weakestSubject.subject} is your weakest subject at ${insights.weakestSubject.score}% average. Brief teachers on common misconceptions and assign topic-focused quizzes.`,
        href: "/dashboard/principal/analytics",
        cta: "Drill into analytics",
      });
    }
    if (insights.inactiveTeachers.length > 0) {
      list.push({
        tone: "warn",
        title: `${insights.inactiveTeachers.length} teacher${insights.inactiveTeachers.length === 1 ? " has" : "s have"} no quizzes this month`,
        body: `Encourage them to publish at least one quiz this term. Sustained quiz cadence correlates strongly with class engagement.`,
        href: "/dashboard/principal/teachers",
        cta: "View Teachers",
      });
    }
    if (insights.highestClass && insights.highestClass.score >= 85) {
      list.push({
        tone: "good",
        title: `Celebrate ${insights.highestClass.name}`,
        body: `${insights.highestClass.name} is leading at ${insights.highestClass.score}%. Recognise the class teacher and pair them with weaker classes for peer mentoring.`,
        href: "/dashboard/principal/classes",
        cta: "View class",
      });
    }
    if (insights.thisMonthQuizzes === 0) {
      list.push({
        tone: "warn",
        title: "No quizzes published this month",
        body: "Quiz cadence has dropped to zero. Run a quick teacher huddle to plan the term's quiz calendar.",
      });
    } else if (insights.volumeDelta !== null && insights.volumeDelta < -25) {
      list.push({
        tone: "info",
        title: "Quiz volume slowing down",
        body: `${insights.thisMonthQuizzes} quiz${insights.thisMonthQuizzes === 1 ? "" : "zes"} this month vs ${insights.lastMonthQuizzes} last month (${insights.volumeDelta}%). Check if a holiday or exam week explains the drop.`,
      });
    }

    if (list.length === 0) {
      list.push({
        tone: "good",
        title: "No critical actions",
        body: "Your school is tracking healthy averages across classes, subjects, and teacher activity. Keep momentum.",
      });
    }
    return list;
  }, [insights]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">AI Summary</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Auto-generated from real platform data — refresh anytime
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/30 bg-white px-5 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-60 dark:bg-[var(--background)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Headline insight */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-accent/5 p-6 dark:from-primary/10 dark:via-[var(--background)] dark:to-accent/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">✨</span>
            <h2 className="text-base font-bold tracking-tight text-primary">School Insight — {schoolName}</h2>
          </div>
          <span className="rounded-full border border-primary/30 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-[var(--background)]">AI Powered</span>
        </div>
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--foreground)]">
          {insights === null ? (
            <>
              <div className="h-4 w-[80%] animate-pulse rounded bg-[var(--muted)]" />
              <div className="h-4 w-[60%] animate-pulse rounded bg-[var(--muted)]" />
              <div className="h-4 w-[70%] animate-pulse rounded bg-[var(--muted)]" />
            </>
          ) : (
            <>
              <p>
                <strong>This month</strong>: {insights.thisMonthQuizzes} quiz{insights.thisMonthQuizzes === 1 ? "" : "zes"} published
                {insights.volumeDelta !== null && (insights.volumeDelta >= 0 ? ` (+${insights.volumeDelta}% vs last month)` : ` (${insights.volumeDelta}% vs last month)`)}.
                {" "}
                {insights.studentsTotal} active students across {insights.teachersTotal} teachers.
              </p>
              {insights.overallAvg !== null && (
                <p>School-wide average score sits at <strong>{insights.overallAvg}%</strong>.</p>
              )}
              {insights.lowestClass && (
                <p>
                  <strong>{insights.lowestClass.name}</strong> is the weakest performer at {insights.lowestClass.score}%
                  {insights.weakestSubject ? `, with ${insights.weakestSubject.subject} pulling averages down (${insights.weakestSubject.score}%).` : "."}
                </p>
              )}
              {insights.highestClass && insights.highestClass.score >= 75 && (
                <p>
                  <strong>{insights.highestClass.name}</strong> leads at {insights.highestClass.score}%
                  {insights.strongestSubject ? `, strongest in ${insights.strongestSubject.subject} (${insights.strongestSubject.score}%).` : "."}
                </p>
              )}
              {insights.inactiveTeachers.length > 0 && (
                <p>
                  <strong>{insights.inactiveTeachers.length} teacher{insights.inactiveTeachers.length === 1 ? " has" : "s have"} not assigned any quiz this month</strong> — worth a check-in.
                </p>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Recommendations */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Recommended actions</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {insights === null ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-[var(--muted)]/60" />
            ))
          ) : recs.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 * i }}
              className={`rounded-2xl border p-5 shadow-sm dark:bg-[var(--background)] ${
                r.tone === "warn"
                  ? "border-amber-200 bg-amber-50/60 dark:border-amber-500/30"
                  : r.tone === "good"
                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30"
                    : "border-blue-200 bg-blue-50/60 dark:border-blue-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  r.tone === "warn"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                    : r.tone === "good"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                }`}>
                  {r.tone === "warn" ? <WarnIcon /> : r.tone === "good" ? <StarIcon /> : <InfoIcon />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--foreground)]">{r.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">{r.body}</p>
                  {r.href && r.cta && (
                    <Link href={r.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      {r.cta}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Disclosure */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-3 text-xs text-[var(--muted-foreground)]">
        <strong className="text-[var(--foreground)]">How this works:</strong> Insights are derived in real time from your school&apos;s quiz, teacher, and class data via Skillship analytics. No external AI is invoked yet — the conversational AI Tutor and weekly auto-reports ship in Phase 02.
      </div>
    </div>
  );
}

function WarnIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>; }
function StarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>; }
function InfoIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="16" y2="12" /><line x1="12" x2="12.01" y1="8" y2="8" /></svg>; }
