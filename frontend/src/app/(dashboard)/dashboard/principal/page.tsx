/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/page.tsx
 * Purpose: Principal School Overview — stats, derived School Insight, performance trend,
 *          class comparison, teacher activity. All data fetched from real API.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────
interface Quiz {
  id: string;
  title: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  subject?: string;
  grade?: string;
  created_at: string;
  created_by?: string;
  created_by_name?: string;
  avg_score?: number;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active?: boolean;
  last_login?: string;
  classes_count?: number;
}

interface AcademicClass {
  id: string;
  name?: string;
  class_name?: string;
  avg_score?: number;
}

interface Stats {
  teachers: number | null;
  students: number | null;
  quizzesThisMonth: number | null;
  avgScore: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function relativeTime(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

// ─── Stat Card ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon, tone, delay = 0 }: {
  label: string;
  value: string | number | null;
  icon: React.ReactNode;
  tone: "blue" | "teal" | "violet" | "amber";
  delay?: number;
}) {
  const toneClass: Record<typeof tone, string> = {
    blue:   "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    teal:   "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    amber:  "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
        {value === null
          ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-[var(--muted)]" />
          : value}
      </p>
    </motion.div>
  );
}

// ─── Insight Banner ──────────────────────────────────────────────────────
function SchoolInsight({
  schoolName, quizzesThisMonth, classes, lowestClass, highestClass, inactiveTeachers, refreshing, onRefresh,
}: {
  schoolName: string;
  quizzesThisMonth: number | null;
  classes: AcademicClass[] | null;
  lowestClass: { name: string; score: number } | null;
  highestClass: { name: string; score: number } | null;
  inactiveTeachers: number;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const ready = quizzesThisMonth !== null && classes !== null;

  const text = useMemo(() => {
    if (!ready) return "";
    const parts: string[] = [];
    parts.push(`This month, ${quizzesThisMonth} quiz${quizzesThisMonth === 1 ? "" : "zes"} ${quizzesThisMonth === 1 ? "was" : "were"} published across your classes.`);
    if (lowestClass) parts.push(`${lowestClass.name} is showing the weakest performance — average score ${lowestClass.score}%.`);
    if (highestClass) parts.push(`${highestClass.name} is leading with an average score of ${highestClass.score}%.`);
    if (inactiveTeachers > 0) parts.push(`${inactiveTeachers} teacher${inactiveTeachers === 1 ? " has" : "s have"} not assigned any quiz this month.`);
    if (lowestClass && lowestClass.score < 70) parts.push(`Recommend organising a remedial session for ${lowestClass.name} before the term exam.`);
    if (parts.length === 1) parts.push("All classes are tracking healthy averages — keep momentum.");
    return parts.join(" ");
  }, [ready, quizzesThisMonth, lowestClass, highestClass, inactiveTeachers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
      className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-white to-accent/5 p-5 dark:from-primary/10 dark:via-[var(--background)] dark:to-accent/10"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">✨</span>
          <span aria-hidden="true">📊</span>
          <h2 className="text-base font-bold tracking-tight text-primary">School Insight — {schoolName}</h2>
        </div>
        <span className="rounded-full border border-primary/30 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-[var(--background)]">
          AI Powered
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]">
        {ready ? text : <span className="inline-block h-4 w-[60%] animate-pulse rounded bg-[var(--muted)]" />}
      </p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-60 dark:bg-[var(--background)]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? "animate-spin" : ""}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {refreshing ? "Refreshing…" : "Refresh Summary"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────
export default function PrincipalSchoolOverview() {
  const { user, displayName } = useAuth();
  const [stats, setStats] = useState<Stats>({ teachers: null, students: null, quizzesThisMonth: null, avgScore: null });
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [classes, setClasses] = useState<AcademicClass[] | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [schoolName, setSchoolName] = useState<string>("Your School");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [studentsRes, teachersRes, classesRes, quizzesRes, schoolsRes] = await Promise.all([
        fetch(`${API_BASE}/users/?role=STUDENT`,  { headers }),
        fetch(`${API_BASE}/users/?role=TEACHER`,  { headers }),
        fetch(`${API_BASE}/academics/classes/`,   { headers }),
        fetch(`${API_BASE}/quizzes/`,             { headers }),
        fetch(`${API_BASE}/schools/`,             { headers }),
      ]);

      const studentsData = studentsRes.ok ? await studentsRes.json() : null;
      const teachersData = teachersRes.ok ? await teachersRes.json() : null;
      const classesData  = classesRes.ok  ? await classesRes.json()  : null;
      const quizzesData  = quizzesRes.ok  ? await quizzesRes.json()  : null;
      const schoolsData  = schoolsRes.ok  ? await schoolsRes.json()  : null;

      const teacherList: Teacher[] = asArray<Teacher>(teachersData);
      const classList: AcademicClass[] = asArray<AcademicClass>(classesData);
      const quizList: Quiz[] = asArray<Quiz>(quizzesData);

      // School name (principal sees own school — first row in scoped /schools/ result)
      const firstSchool = (schoolsData?.results ?? schoolsData ?? [])[0];
      if (firstSchool?.name) setSchoolName(firstSchool.name);

      // Quizzes this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonth = quizList.filter((q) => new Date(q.created_at) >= monthStart);

      // Average school score from quizzes that have avg_score
      const scored = quizList.filter((q) => typeof q.avg_score === "number");
      const avg = scored.length > 0
        ? Math.round(scored.reduce((sum, q) => sum + (q.avg_score ?? 0), 0) / scored.length * 10) / 10
        : null;

      setStats({
        teachers: teachersData?.count ?? teacherList.length,
        students: studentsData?.count ?? asArray(studentsData).length,
        quizzesThisMonth: thisMonth.length,
        avgScore: avg,
      });
      setTeachers(teacherList);
      setClasses(classList);
      setQuizzes(quizList);
    } catch {
      // leave nulls — skeletons remain
    }
  }, []);

  useEffect(() => { document.title = "School Overview — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // Derive teachers without any quiz this month
  const inactiveTeacherCount = useMemo(() => {
    if (!teachers || !quizzes) return 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const activeIds = new Set(
      quizzes
        .filter((q) => new Date(q.created_at) >= monthStart && q.created_by)
        .map((q) => q.created_by)
    );
    return teachers.filter((t) => !activeIds.has(t.id)).length;
  }, [teachers, quizzes]);

  // Compute per-class avg from classes payload (if avg_score field exists)
  const classScores = useMemo(() => {
    if (!classes) return null;
    return classes
      .map((c) => ({
        name: c.class_name ?? c.name ?? "—",
        score: typeof c.avg_score === "number" ? Math.round(c.avg_score) : null,
      }))
      .filter((c) => c.score !== null) as { name: string; score: number }[];
  }, [classes]);

  const lowestClass = useMemo(() => {
    if (!classScores || classScores.length === 0) return null;
    return classScores.reduce((min, c) => (c.score < min.score ? c : min), classScores[0]);
  }, [classScores]);

  const highestClass = useMemo(() => {
    if (!classScores || classScores.length === 0) return null;
    return classScores.reduce((max, c) => (c.score > max.score ? c : max), classScores[0]);
  }, [classScores]);

  // Group quizzes by teacher for the activity table
  const teacherActivity = useMemo(() => {
    if (!teachers || !quizzes) return null;
    return teachers.map((t) => {
      const teacherQuizzes = quizzes.filter((q) => q.created_by === t.id);
      return {
        ...t,
        quizzes_created: teacherQuizzes.length,
        last_active: teacherQuizzes.length > 0
          ? teacherQuizzes.map((q) => q.created_at).sort().reverse()[0]
          : t.last_login,
      };
    });
  }, [teachers, quizzes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="sr-only">School Overview — {schoolName}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Welcome back, <span className="font-semibold text-[var(--foreground)]">{displayName ?? user?.first_name ?? "Principal"}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Teachers"      value={stats.teachers}                                       tone="blue"   delay={0.05} icon={<TeacherIcon />} />
        <StatCard label="Total Students"      value={stats.students}                                       tone="teal"   delay={0.10} icon={<StudentIcon />} />
        <StatCard label="Quizzes This Month"  value={stats.quizzesThisMonth}                               tone="violet" delay={0.15} icon={<QuizIcon />} />
        <StatCard label="Average School Score" value={stats.avgScore === null ? "—" : `${stats.avgScore}%`} tone="amber"  delay={0.20} icon={<MedalIcon />} />
      </div>

      {/* AI School Insight */}
      <SchoolInsight
        schoolName={schoolName}
        quizzesThisMonth={stats.quizzesThisMonth}
        classes={classes}
        lowestClass={lowestClass}
        highestClass={highestClass}
        inactiveTeachers={inactiveTeacherCount}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceTrend quizzes={quizzes} />
        <ClassComparison classes={classes} />
      </div>

      {/* Teacher Activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]"
      >
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Teacher Activity</h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Quiz creation and class activity this month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Teacher Name</th>
                <th className="px-6 py-3">Classes</th>
                <th className="px-6 py-3">Quizzes Created</th>
                <th className="px-6 py-3">Last Active</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {teacherActivity === null ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : teacherActivity.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-[var(--muted-foreground)]">No teachers in this school yet.</td></tr>
              ) : (
                teacherActivity.map((t) => {
                  const fullName = `${t.first_name} ${t.last_name}`.trim() || t.email;
                  const inactive = (t.quizzes_created ?? 0) === 0;
                  return (
                    <tr key={t.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                            {initials(fullName)}
                          </div>
                          <span className="font-medium text-[var(--foreground)]">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--muted-foreground)]">{t.classes_count ?? "—"}</td>
                      <td className="px-6 py-4">
                        {inactive ? (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                            0 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
                            <span className="text-xs">None</span>
                          </span>
                        ) : t.quizzes_created}
                      </td>
                      <td className="px-6 py-4 text-[var(--muted-foreground)]">{relativeTime(t.last_active)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          inactive
                            ? "bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        }`}>
                          {inactive ? "Inactive" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] px-6 py-3 text-right">
          <Link href="/dashboard/principal/teachers" className="text-xs font-semibold text-primary hover:underline">
            View all teachers →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Performance Trend ──────────────────────────────────────────────────
function PerformanceTrend({ quizzes }: { quizzes: Quiz[] | null }) {
  // Group quizzes by month, compute avg score per month
  const series = useMemo(() => {
    if (!quizzes) return null;
    const byMonth = new Map<string, number[]>();
    quizzes.forEach((q) => {
      if (typeof q.avg_score !== "number") return;
      const d = new Date(q.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const list = byMonth.get(key) ?? [];
      list.push(q.avg_score);
      byMonth.set(key, list);
    });
    const months = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, scores]) => {
        const [, m] = key.split("-");
        const monthLabel = new Date(2000, Number(m) - 1, 1).toLocaleString("en-IN", { month: "short" });
        return { label: monthLabel, value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) };
      });
    return months;
  }, [quizzes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]"
    >
      <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Student Performance Trend</h3>
      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Monthly average score across all classes (%)</p>
      <div className="mt-5 h-56">
        {series === null ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-[var(--muted)]" />
        ) : series.length < 2 ? (
          <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">
            Not enough scored quizzes yet — chart unlocks once 2+ months of attempts are recorded.
          </div>
        ) : (
          <LineChart data={series} />
        )}
      </div>
    </motion.div>
  );
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 600, H = 220, P = 32;
  const max = Math.max(...data.map((d) => d.value), 100);
  const min = Math.min(...data.map((d) => d.value), 50);
  const xs = data.map((_, i) => P + (i * (W - 2 * P)) / (data.length - 1));
  const ys = data.map((d) => H - P - ((d.value - min) / (max - min || 1)) * (H - 2 * P));
  const path = data.map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${ys[i]}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={P} y1={H - P - t * (H - 2 * P)} x2={W - P} y2={H - P - t * (H - 2 * P)} stroke="rgb(148 163 184)" strokeOpacity="0.18" strokeDasharray="3 4" />
      ))}
      <path d={`${path} L ${xs[xs.length - 1]} ${H - P} L ${xs[0]} ${H - P} Z`} fill="url(#lineFade)" />
      <path d={path} fill="none" stroke="rgb(59 130 246)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={ys[i]} r="4" fill="rgb(59 130 246)" />
          <text x={xs[i]} y={H - 8} textAnchor="middle" fontSize="11" fill="rgb(100 116 139)">{d.label}</text>
        </g>
      ))}
      <text x={P - 6} y={ys[0]} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="rgb(100 116 139)">{max}%</text>
      <text x={P - 6} y={H - P} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="rgb(100 116 139)">{min}%</text>
    </svg>
  );
}

// ─── Class Comparison ───────────────────────────────────────────────────
function ClassComparison({ classes }: { classes: AcademicClass[] | null }) {
  const data = useMemo(() => {
    if (!classes) return null;
    return classes
      .filter((c) => typeof c.avg_score === "number")
      .map((c) => ({ label: c.class_name ?? c.name ?? "—", value: Math.round(c.avg_score!) }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, 8);
  }, [classes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]"
    >
      <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Class Performance Comparison</h3>
      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Average quiz scores by class section</p>
      <div className="mt-5 space-y-2">
        {data === null ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-16 animate-pulse rounded bg-[var(--muted)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[var(--muted)]" />
            </div>
          ))
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-xs text-[var(--muted-foreground)]">
            No class scores yet — run a few quizzes to see comparison.
          </p>
        ) : (
          data.map((d) => (
            <div key={d.label} className="grid grid-cols-[80px_1fr_44px] items-center gap-3 text-xs">
              <span className="font-medium text-[var(--muted-foreground)]">{d.label}</span>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--muted)]">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(d.value, 100)}%` }} />
              </div>
              <span className="text-right font-semibold text-[var(--foreground)]">{d.value}%</span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ─── Icons ──────────────────────────────────────────────────────────────
function TeacherIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function StudentIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function QuizIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
}
function MedalIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6" /><path d="m9 14 -2 7 5 -3 5 3 -2 -7" /></svg>;
}
