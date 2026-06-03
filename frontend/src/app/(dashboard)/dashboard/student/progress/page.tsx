/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/progress/page.tsx
 * Purpose: Student personal progress — KPI strip, monthly score trend,
 *          subject strength bars, recent attempts table.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

interface Attempt {
  id: string;
  quiz_title?: string;
  quiz_subject?: string;
  score?: number;
  attempted_at?: string;
  created_at?: string;
}

export default function ProgressAnalyticsPage() {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"3M" | "6M" | "12M">("6M");

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setAttempts([]); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/attempts/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setError(`Failed (${res.status})`); setAttempts([]); return; }
      setAttempts(asArray<Attempt>(await res.json()));
    } catch {
      setError("Network error.");
      setAttempts([]);
    }
  }, []);

  useEffect(() => { document.title = "Progress Analytics — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const months = range === "3M" ? 3 : range === "6M" ? 6 : 12;

  const filtered = useMemo(() => {
    if (!attempts) return null;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return attempts.filter((a) => new Date(a.attempted_at ?? a.created_at ?? "") >= cutoff);
  }, [attempts, months]);

  const kpi = useMemo(() => {
    if (!filtered) return { count: null as number | null, avg: null as number | null, best: null as number | null, streak: null as number | null };
    const scored = filtered.filter((a) => typeof a.score === "number");
    const avg = scored.length === 0 ? null : Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length * 10) / 10;
    const best = scored.length === 0 ? null : Math.round(Math.max(...scored.map((a) => a.score ?? 0)));
    // Streak = consecutive days with at least one attempt
    const dates = new Set(scored.map((a) => new Date(a.attempted_at ?? a.created_at ?? "").toDateString()));
    let streak = 0;
    const cur = new Date();
    while (dates.has(cur.toDateString())) { streak++; cur.setDate(cur.getDate() - 1); }
    return { count: filtered.length, avg, best, streak };
  }, [filtered]);

  const trend = useMemo(() => {
    if (!filtered) return null;
    const byMonth = new Map<string, number[]>();
    filtered.forEach((a) => {
      if (typeof a.score !== "number") return;
      const d = new Date(a.attempted_at ?? a.created_at ?? "");
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const arr = byMonth.get(key) ?? [];
      arr.push(a.score);
      byMonth.set(key, arr);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-months)
      .map(([key, vals]) => ({
        label: new Date(2000, Number(key.split("-")[1]) - 1, 1).toLocaleString("en-IN", { month: "short" }),
        value: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
      }));
  }, [filtered, months]);

  const subjects = useMemo(() => {
    if (!filtered) return null;
    const m = new Map<string, number[]>();
    filtered.forEach((a) => {
      if (typeof a.score !== "number" || !a.quiz_subject) return;
      const arr = m.get(a.quiz_subject) ?? [];
      arr.push(a.score);
      m.set(a.quiz_subject, arr);
    });
    return Array.from(m.entries())
      .map(([s, vals]) => ({ subject: s, value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Progress Analytics</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Personal score trend &amp; subject strengths</p>
        </div>
        <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-1">
          {(["3M", "6M", "12M"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)} className={`rounded-xl px-4 py-2 text-xs font-medium transition-all ${range === r ? "bg-white shadow-sm text-[var(--foreground)] dark:bg-[var(--background)]" : "text-[var(--muted-foreground)]"}`}>
              {r === "3M" ? "Last 3 Months" : r === "6M" ? "Last 6 Months" : "Last 12 Months"}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Quizzes Attempted" value={kpi.count} />
        <Card label="Average Score"     value={kpi.avg === null ? null : `${kpi.avg}%`} />
        <Card label="Personal Best"     value={kpi.best === null ? null : `${kpi.best}%`} tone="emerald" />
        <Card label="Daily Streak"      value={kpi.streak === null ? null : `${kpi.streak} day${kpi.streak === 1 ? "" : "s"}`} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Score Trend</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Monthly average (%)</p>
          <div className="mt-5 h-56">
            {trend === null ? <div className="h-full w-full animate-pulse rounded-xl bg-[var(--muted)]" />
              : trend.length < 2 ? <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">Take more quizzes to see your trend.</div>
              : <LineChart data={trend} />}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Subject Strength</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Where you score highest</p>
          <div className="mt-5 space-y-3">
            {subjects === null ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-4 animate-pulse rounded bg-[var(--muted)]" />)
              : subjects.length === 0 ? <p className="py-6 text-center text-xs text-[var(--muted-foreground)]">No scored quizzes in this range.</p>
              : subjects.map((s) => (
                <div key={s.subject} className="grid grid-cols-[110px_1fr_44px] items-center gap-3 text-xs">
                  <span className="font-medium text-[var(--muted-foreground)]">{s.subject}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(s.value, 100)}%` }} /></div>
                  <span className="text-right font-semibold text-[var(--foreground)]">{s.value}%</span>
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Recent Attempts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Quiz</th>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered === null ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">{Array.from({ length: 4 }).map((__, j) => <td key={j} className="px-6 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8">
                  <EmptyState
                    title="No attempts in this range"
                    description="Try widening the time range or take a quiz from your assignments."
                    action={{ label: "Browse quizzes", href: "/dashboard/student/quizzes" }}
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>}
                  />
                </td></tr>
              ) : filtered.slice(0, 8).map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                  <td className="px-6 py-3.5"><Link href={`/dashboard/student/results/${a.id}`} className="font-medium text-[var(--foreground)] hover:text-primary">{a.quiz_title ?? "—"}</Link></td>
                  <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{a.quiz_subject ?? "—"}</td>
                  <td className="px-6 py-3.5 font-semibold text-emerald-600">{typeof a.score === "number" ? `${Math.round(a.score)}%` : "—"}</td>
                  <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{a.attempted_at ? new Date(a.attempted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function Card({ label, value, tone }: { label: string; value: number | string | null; tone?: "emerald" | "amber" }) {
  const text = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-[var(--foreground)]";
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${text}`}>{value === null ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-[var(--muted)]" /> : value}</p>
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
      <defs><linearGradient id="pgFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(5 150 105)" stopOpacity="0.2" /><stop offset="100%" stopColor="rgb(5 150 105)" stopOpacity="0" /></linearGradient></defs>
      {[0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={P} y1={H - P - t * (H - 2 * P)} x2={W - P} y2={H - P - t * (H - 2 * P)} stroke="rgb(148 163 184)" strokeOpacity="0.18" strokeDasharray="3 4" />)}
      <path d={`${path} L ${xs[xs.length - 1]} ${H - P} L ${xs[0]} ${H - P} Z`} fill="url(#pgFade)" />
      <path d={path} fill="none" stroke="rgb(5 150 105)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}><circle cx={xs[i]} cy={ys[i]} r="4" fill="rgb(5 150 105)" /><text x={xs[i]} y={H - 8} textAnchor="middle" fontSize="11" fill="rgb(100 116 139)">{d.label}</text></g>
      ))}
    </svg>
  );
}
