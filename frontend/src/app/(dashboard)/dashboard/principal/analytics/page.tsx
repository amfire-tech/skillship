/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/analytics/page.tsx
 * Purpose: Performance Analytics — KPIs, monthly trend, subject bars,
 *          class×subject heatmap, student leaderboard. Real API only.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────
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
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  class_name?: string;
  grade?: string;
  quizzes_attempted?: number;
  avg_score?: number;
  career_path?: string;
  top_subject?: string;
}

interface AcademicClass {
  id: string;
  name?: string;
  class_name?: string;
}

type Range = "1M" | "3M" | "6M" | "12M";
const RANGE_MONTHS: Record<Range, number> = { "1M": 1, "3M": 3, "6M": 6, "12M": 12 };

const SUBJECT_COLOR: Record<string, string> = {
  Robotics:    "rgb(59 130 246)",
  AI:          "rgb(168 85 247)",
  "Artificial Intelligence": "rgb(168 85 247)",
  Coding:      "rgb(16 185 129)",
  "Coding & Programming": "rgb(16 185 129)",
  Sensors:     "rgb(245 158 11)",
  "Sensors & IoT": "rgb(245 158 11)",
  Electronics: "rgb(239 68 68)",
};

function colorFor(subject: string): string {
  return SUBJECT_COLOR[subject] ?? "rgb(99 102 241)";
}

// ─── Page ───────────────────────────────────────────────────────────────
export default function PerformanceAnalyticsPage() {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [classes, setClasses] = useState<AcademicClass[] | null>(null);
  const [schoolName, setSchoolName] = useState("Your School");
  const [error, setError] = useState<string | null>(null);

  const [range, setRange] = useState<Range>("6M");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); return; }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [qRes, stRes, clRes, schRes] = await Promise.all([
        fetch(`${API_BASE}/quizzes/`, { headers }),
        fetch(`${API_BASE}/users/?role=STUDENT`, { headers }),
        fetch(`${API_BASE}/academics/classes/`, { headers }),
        fetch(`${API_BASE}/schools/`, { headers }),
      ]);
      setQuizzes(qRes.ok ? asArray<Quiz>(await qRes.json()) : []);
      setStudents(stRes.ok ? asArray<Student>(await stRes.json()) : []);
      setClasses(clRes.ok ? asArray<AcademicClass>(await clRes.json()) : []);
      const sd = schRes.ok ? await schRes.json() : null;
      const first = (sd?.results ?? sd ?? [])[0];
      if (first?.name) setSchoolName(first.name);
    } catch {
      setError("Network error.");
    }
  }, []);

  useEffect(() => { document.title = "Performance Analytics — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  // ─── Filters ─────────────────────────────────────────────────────────
  const subjects = useMemo(() => {
    if (!quizzes) return [];
    return Array.from(new Set(quizzes.map((q) => q.subject).filter(Boolean))) as string[];
  }, [quizzes]);

  const classNames = useMemo(() => {
    if (!classes) return [];
    const live = classes.map((c) => c.class_name ?? c.name).filter(Boolean) as string[];
    return Array.from(new Set(live));
  }, [classes]);

  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return null;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - RANGE_MONTHS[range]);
    return quizzes.filter((q) => {
      const d = new Date(q.created_at);
      if (d < cutoff) return false;
      if (classFilter !== "ALL" && (q.class_name ?? q.grade ?? "") !== classFilter) return false;
      if (subjectFilter !== "ALL" && q.subject !== subjectFilter) return false;
      return true;
    });
  }, [quizzes, range, classFilter, subjectFilter]);

  // ─── KPI numbers ─────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    if (!filteredQuizzes) return { avg: null, attempts: null, pass: null, improvement: null };
    const scored = filteredQuizzes.filter((q) => typeof q.avg_score === "number");
    const avg = scored.length === 0 ? null : Math.round(scored.reduce((a, b) => a + (b.avg_score ?? 0), 0) / scored.length * 10) / 10;
    const attempts = filteredQuizzes.reduce((sum, q) => sum + (q.total_attempts ?? 0), 0);
    const passList = filteredQuizzes.filter((q) => typeof q.pass_rate === "number");
    const pass = passList.length === 0 ? null : Math.round(passList.reduce((a, b) => a + (b.pass_rate ?? 0), 0) / passList.length * 10) / 10;
    // improvement = last-month avg vs prior-month avg
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const lastList = scored.filter((q) => new Date(q.created_at) >= lastMonth);
    const prevList = scored.filter((q) => new Date(q.created_at) >= prevMonth && new Date(q.created_at) < lastMonth);
    let improvement: number | null = null;
    if (lastList.length > 0 && prevList.length > 0) {
      const la = lastList.reduce((a, b) => a + (b.avg_score ?? 0), 0) / lastList.length;
      const pa = prevList.reduce((a, b) => a + (b.avg_score ?? 0), 0) / prevList.length;
      improvement = Math.round((la - pa) * 10) / 10;
    }
    return { avg, attempts, pass, improvement };
  }, [filteredQuizzes]);

  // ─── Monthly trend series ────────────────────────────────────────────
  const trend = useMemo(() => {
    if (!filteredQuizzes) return null;
    const byMonth = new Map<string, number[]>();
    filteredQuizzes.forEach((q) => {
      if (typeof q.avg_score !== "number") return;
      const d = new Date(q.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const list = byMonth.get(key) ?? [];
      list.push(q.avg_score);
      byMonth.set(key, list);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-RANGE_MONTHS[range])
      .map(([key, vals]) => {
        const [, m] = key.split("-");
        const monthLabel = new Date(2000, Number(m) - 1, 1).toLocaleString("en-IN", { month: "short" });
        return { label: monthLabel, value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) };
      });
  }, [filteredQuizzes, range]);

  // ─── Subject bars ────────────────────────────────────────────────────
  const subjectAvg = useMemo(() => {
    if (!filteredQuizzes) return null;
    const map = new Map<string, number[]>();
    filteredQuizzes.forEach((q) => {
      if (!q.subject || typeof q.avg_score !== "number") return;
      const list = map.get(q.subject) ?? [];
      list.push(q.avg_score);
      map.set(q.subject, list);
    });
    return Array.from(map.entries())
      .map(([s, vals]) => ({ subject: s, value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredQuizzes]);

  // ─── Heatmap (class × subject) ───────────────────────────────────────
  const heatmap = useMemo(() => {
    if (!filteredQuizzes) return null;
    const rows = new Map<string, Map<string, number[]>>();
    filteredQuizzes.forEach((q) => {
      const cls = q.class_name ?? q.grade;
      if (!cls || !q.subject || typeof q.avg_score !== "number") return;
      if (!rows.has(cls)) rows.set(cls, new Map());
      const sub = rows.get(cls)!;
      const arr = sub.get(q.subject) ?? [];
      arr.push(q.avg_score);
      sub.set(q.subject, arr);
    });
    const allSubjects = Array.from(new Set(Array.from(rows.values()).flatMap((m) => Array.from(m.keys()))));
    const data = Array.from(rows.entries()).map(([cls, subs]) => {
      const cells: Record<string, number | null> = {};
      allSubjects.forEach((s) => {
        const arr = subs.get(s);
        cells[s] = arr ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
      });
      return { cls, cells };
    }).sort((a, b) => a.cls.localeCompare(b.cls));
    return { subjects: allSubjects, rows: data };
  }, [filteredQuizzes]);

  function heatTone(v: number | null): string {
    if (v === null) return "bg-[var(--muted)] text-[var(--muted-foreground)]";
    if (v >= 80) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    if (v >= 70) return "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
    if (v >= 60) return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    return "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  }

  // ─── Leaderboard ─────────────────────────────────────────────────────
  const leaderboard = useMemo(() => {
    if (!students) return null;
    return [...students]
      .filter((s) => typeof s.avg_score === "number")
      .sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0))
      .slice(0, 10);
  }, [students]);

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Performance Analytics</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{schoolName}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
            <option value="1M">Last 1 Month</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="12M">Last 12 Months</option>
          </select>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
            <option value="ALL">All Classes</option>
            {classNames.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Overall Avg Score" value={kpi.avg === null ? "—" : `${kpi.avg}%`}              tone="blue"   icon={<TrendIcon />}     delay={0.05} />
        <KpiCard label="Total Attempts"     value={kpi.attempts === null ? "—" : kpi.attempts.toLocaleString("en-IN")} tone="violet" icon={<TargetIcon />} delay={0.10} />
        <KpiCard label="Pass Rate"          value={kpi.pass === null ? "—" : `${kpi.pass}%`}            tone="teal"   icon={<CheckIcon />}     delay={0.15} />
        <KpiCard label="Improvement vs Last Month" value={kpi.improvement === null ? "—" : `${kpi.improvement >= 0 ? "+" : ""}${kpi.improvement}%`} tone="amber" icon={<UpRightIcon />} delay={0.20} />
      </div>

      {/* Trend + subject mix */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Monthly Average Score Trend</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">School-wide average quiz score over time (%)</p>
          <div className="mt-5 h-56">
            {trend === null ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-[var(--muted)]" />
            ) : trend.length < 2 ? (
              <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">Not enough scored quizzes for selected range.</div>
            ) : (
              <LineChart data={trend} />
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Subject-wise Average Scores</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Comparative performance across all subjects</p>
          <div className="mt-5 h-56">
            {subjectAvg === null ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-[var(--muted)]" />
            ) : subjectAvg.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">No scored quizzes yet.</div>
            ) : (
              <SubjectBars data={subjectAvg} />
            )}
          </div>
        </motion.div>
      </div>

      {/* Heatmap */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Class × Subject Performance Heatmap</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Average scores per class per subject</p>
        </div>
        <div className="overflow-x-auto p-1">
          {heatmap === null ? (
            <div className="h-40 w-full animate-pulse rounded bg-[var(--muted)]" />
          ) : heatmap.subjects.length === 0 || heatmap.rows.length === 0 ? (
            <p className="px-6 py-12 text-center text-xs text-[var(--muted-foreground)]">No class-subject scores available for selected filters.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <th className="px-6 py-3">Class</th>
                  {heatmap.subjects.map((s) => <th key={s} className="px-3 py-3 text-center">{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {heatmap.rows.map(({ cls, cells }) => (
                  <tr key={cls} className="border-b border-[var(--border)]/60 last:border-0">
                    <td className="px-6 py-3 font-medium text-[var(--foreground)]">{cls}</td>
                    {heatmap.subjects.map((s) => (
                      <td key={s} className="px-3 py-3 text-center">
                        <span className={`inline-flex min-w-[52px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${heatTone(cells[s])}`}>
                          {cells[s] === null ? "—" : `${cells[s]}%`}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border)] px-6 py-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-500/25" /> ≥ 80% Excellent</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-200 dark:bg-blue-500/25" /> 70-79% Good</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-200 dark:bg-amber-500/25" /> 60-69% Average</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-200 dark:bg-red-500/25" /> &lt; 60% Needs Attention</span>
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Student Leaderboard</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Top performing students across all classes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Total Quizzes</th>
                <th className="px-6 py-3">Avg Score</th>
                <th className="px-6 py-3">Top Subject</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard === null ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : leaderboard.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-[var(--muted-foreground)]">No scored students yet.</td></tr>
              ) : (
                leaderboard.map((s, i) => {
                  const fullName = `${s.first_name} ${s.last_name}`.trim() || s.email;
                  const rankBg = i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-700 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]";
                  return (
                    <tr key={s.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="px-6 py-3.5"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${rankBg}`}>{i + 1}</span></td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                            {fullName.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
                          </div>
                          <span className="font-medium text-[var(--foreground)]">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.class_name ?? s.grade ?? "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.quizzes_attempted ?? "—"}</td>
                      <td className="px-6 py-3.5 font-semibold text-emerald-600">{Math.round(s.avg_score!)}%</td>
                      <td className="px-6 py-3.5">
                        {s.top_subject ? (
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{s.top_subject}</span>
                        ) : <span className="text-xs text-[var(--muted-foreground)]">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Reusable components ────────────────────────────────────────────────
function KpiCard({ label, value, tone, icon, delay = 0 }: { label: string; value: string; tone: "blue" | "teal" | "violet" | "amber"; icon: React.ReactNode; delay?: number }) {
  const map = {
    blue:   "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    teal:   "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    amber:  "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${map[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">{value}</p>
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
        <linearGradient id="trendFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={P} y1={H - P - t * (H - 2 * P)} x2={W - P} y2={H - P - t * (H - 2 * P)} stroke="rgb(148 163 184)" strokeOpacity="0.18" strokeDasharray="3 4" />
      ))}
      <path d={`${path} L ${xs[xs.length - 1]} ${H - P} L ${xs[0]} ${H - P} Z`} fill="url(#trendFade)" />
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

function SubjectBars({ data }: { data: { subject: string; value: number }[] }) {
  const W = 600, H = 220, P = 30;
  const innerW = W - 2 * P;
  const innerH = H - 2 * P;
  const barW = (innerW / data.length) * 0.6;
  const gap = (innerW / data.length) * 0.4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={P} y1={H - P - t * innerH} x2={W - P} y2={H - P - t * innerH} stroke="rgb(148 163 184)" strokeOpacity="0.18" strokeDasharray="3 4" />
      ))}
      {data.map((d, i) => {
        const x = P + i * (barW + gap) + gap / 2;
        const h = (d.value / 100) * innerH;
        return (
          <g key={d.subject}>
            <rect x={x} y={H - P - h} width={barW} height={h} rx="6" fill={colorFor(d.subject)} />
            <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="rgb(100 116 139)">{d.subject}</text>
            <text x={x + barW / 2} y={H - P - h - 6} textAnchor="middle" fontSize="11" fill="rgb(100 116 139)">{d.value}%</text>
          </g>
        );
      })}
      <text x={P - 6} y={P} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="rgb(100 116 139)">100%</text>
      <text x={P - 6} y={H - P} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="rgb(100 116 139)">0%</text>
    </svg>
  );
}

function TrendIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>; }
function TargetIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>; }
function CheckIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" /></svg>; }
function UpRightIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 17 17 7" /><polyline points="7 7 17 7 17 17" /></svg>; }
