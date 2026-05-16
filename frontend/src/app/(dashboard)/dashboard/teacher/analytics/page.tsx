/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/analytics/page.tsx
 * Purpose: Teacher Class Analytics — KPIs + class trend + subject mix +
 *          per-class score table. Real API only.
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
  class_name?: string;
  grade?: string;
  status: string;
  avg_score?: number;
  pass_rate?: number;
  total_attempts?: number;
  created_at: string;
  created_by?: string;
}

interface AcademicClass { id: string; name?: string; class_name?: string; subject?: string; student_count?: number; avg_score?: number }

type Range = "1M" | "3M" | "6M" | "12M";
const MONTHS: Record<Range, number> = { "1M": 1, "3M": 3, "6M": 6, "12M": 12 };

export default function ClassAnalyticsPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [classes, setClasses] = useState<AcademicClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("6M");
  const [classFilter, setClassFilter] = useState("ALL");

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); return; }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [qRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/quizzes/`, { headers }),
        fetch(`${API_BASE}/academics/classes/`, { headers }),
      ]);
      const all = qRes.ok ? asArray<Quiz>(await qRes.json()) : [];
      // Scope to teacher's quizzes if backend tags created_by
      setQuizzes(user?.id ? all.filter((q) => !q.created_by || q.created_by === user.id) : all);
      setClasses(cRes.ok ? asArray<AcademicClass>(await cRes.json()) : []);
    } catch {
      setError("Network error.");
    }
  }, [user?.id]);

  useEffect(() => { document.title = "Class Analytics — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const classNames = useMemo(() => {
    if (!classes) return [];
    return Array.from(new Set(classes.map((c) => c.class_name ?? c.name).filter(Boolean))) as string[];
  }, [classes]);

  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return null;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - MONTHS[range]);
    return quizzes.filter((q) => {
      if (new Date(q.created_at) < cutoff) return false;
      if (classFilter !== "ALL" && (q.class_name ?? q.grade ?? "") !== classFilter) return false;
      return true;
    });
  }, [quizzes, range, classFilter]);

  const kpi = useMemo(() => {
    if (!filteredQuizzes) return { avg: null, attempts: null, pass: null, count: null };
    const scored = filteredQuizzes.filter((q) => typeof q.avg_score === "number");
    const passList = filteredQuizzes.filter((q) => typeof q.pass_rate === "number");
    return {
      avg: scored.length === 0 ? null : Math.round(scored.reduce((a, b) => a + (b.avg_score ?? 0), 0) / scored.length * 10) / 10,
      attempts: filteredQuizzes.reduce((sum, q) => sum + (q.total_attempts ?? 0), 0),
      pass: passList.length === 0 ? null : Math.round(passList.reduce((a, b) => a + (b.pass_rate ?? 0), 0) / passList.length * 10) / 10,
      count: filteredQuizzes.length,
    };
  }, [filteredQuizzes]);

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
      .slice(-MONTHS[range])
      .map(([key, vals]) => {
        const [, m] = key.split("-");
        return { label: new Date(2000, Number(m) - 1, 1).toLocaleString("en-IN", { month: "short" }), value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) };
      });
  }, [filteredQuizzes, range]);

  const subjectMix = useMemo(() => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Class Analytics</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Quiz performance across your classes</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
            <option value="1M">Last 1 Month</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="12M">Last 12 Months</option>
          </select>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
            <option value="ALL">All My Classes</option>
            {classNames.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Avg Class Score" value={kpi.avg === null ? "—" : `${kpi.avg}%`} />
        <Card label="Total Attempts"  value={kpi.attempts === null ? "—" : kpi.attempts.toLocaleString("en-IN")} />
        <Card label="Pass Rate"       value={kpi.pass === null ? "—" : `${kpi.pass}%`} />
        <Card label="Quizzes (range)" value={kpi.count === null ? "—" : kpi.count} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Score Trend</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Average per month (%)</p>
          <div className="mt-5 h-56">
            {trend === null ? <div className="h-full w-full animate-pulse rounded-xl bg-[var(--muted)]" />
              : trend.length < 2 ? <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">Not enough scored quizzes for selected range.</div>
              : <LineChart data={trend} />}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Subject Strength</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Average score per subject</p>
          <div className="mt-5 space-y-2">
            {subjectMix === null ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-4 animate-pulse rounded bg-[var(--muted)]" />)
              : subjectMix.length === 0 ? <p className="py-6 text-center text-xs text-[var(--muted-foreground)]">No scored quizzes yet.</p>
              : subjectMix.map((s) => (
                  <div key={s.subject} className="grid grid-cols-[100px_1fr_44px] items-center gap-3 text-xs">
                    <span className="font-medium text-[var(--muted-foreground)]">{s.subject}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(s.value, 100)}%` }} /></div>
                    <span className="text-right font-semibold text-[var(--foreground)]">{s.value}%</span>
                  </div>
                ))}
          </div>
        </motion.div>
      </div>

      {/* Per-class table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Class Breakdown</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Avg score and student count per class</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Students</th>
                <th className="px-6 py-3">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {classes === null ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                  {Array.from({ length: 4 }).map((__, j) => <td key={j} className="px-6 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>)}
                </tr>
              )) : classes.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-[var(--muted-foreground)]">No classes assigned.</td></tr>
              ) : classes.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                  <td className="px-6 py-3.5 font-medium text-[var(--foreground)]">{c.class_name ?? c.name}</td>
                  <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{c.subject ?? "—"}</td>
                  <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{c.student_count ?? "—"}</td>
                  <td className="px-6 py-3.5">
                    {typeof c.avg_score === "number"
                      ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.avg_score >= 80 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : c.avg_score >= 65 ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"}`}>{Math.round(c.avg_score)}%</span>
                      : <span className="text-xs text-[var(--muted-foreground)]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] px-6 py-3 text-right">
          <Link href="/dashboard/teacher/students" className="text-xs font-semibold text-primary hover:underline">View all students →</Link>
        </div>
      </motion.div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
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
      <defs><linearGradient id="trendFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(5 150 105)" stopOpacity="0.2" /><stop offset="100%" stopColor="rgb(5 150 105)" stopOpacity="0" /></linearGradient></defs>
      {[0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={P} y1={H - P - t * (H - 2 * P)} x2={W - P} y2={H - P - t * (H - 2 * P)} stroke="rgb(148 163 184)" strokeOpacity="0.18" strokeDasharray="3 4" />)}
      <path d={`${path} L ${xs[xs.length - 1]} ${H - P} L ${xs[0]} ${H - P} Z`} fill="url(#trendFade)" />
      <path d={path} fill="none" stroke="rgb(5 150 105)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={ys[i]} r="4" fill="rgb(5 150 105)" />
          <text x={xs[i]} y={H - 8} textAnchor="middle" fontSize="11" fill="rgb(100 116 139)">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}
