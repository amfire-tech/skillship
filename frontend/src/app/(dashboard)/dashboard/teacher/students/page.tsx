/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/students/page.tsx
 * Purpose: Teacher — Student Performance. Real students from API,
 *          aggregated quiz stats per student. Filters + search.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  class_name?: string;
  grade?: string;
  section?: string;
  roll_number?: string;
  quizzes_attempted?: number;
  avg_score?: number;
  last_attempt_at?: string;
  trend?: number; // % change vs prior period
}

interface AcademicClass { id: string; name?: string; class_name?: string }

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function ScoreBar({ value }: { value?: number }) {
  if (typeof value !== "number") return <span className="text-xs text-[var(--muted-foreground)]">—</span>;
  const tone = value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-amber-500" : "bg-red-500";
  const text = value >= 80 ? "text-emerald-600" : value >= 65 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-[var(--muted)]">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className={`text-xs font-semibold ${text}`}>{Math.round(value)}%</span>
    </div>
  );
}

export default function StudentPerformancePage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [classes, setClasses] = useState<AcademicClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [scoreFilter, setScoreFilter] = useState<"ALL" | "HIGH" | "MID" | "LOW">("ALL");

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); return; }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [stRes, clRes] = await Promise.all([
        fetch(`${API_BASE}/users/?role=STUDENT`, { headers }),
        fetch(`${API_BASE}/academics/classes/`, { headers }),
      ]);
      setStudents(stRes.ok ? asArray<Student>(await stRes.json()) : []);
      setClasses(clRes.ok ? asArray<AcademicClass>(await clRes.json()) : []);
    } catch {
      setError("Network error.");
    }
  }, []);

  useEffect(() => { document.title = "Student Performance — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const classOptions = useMemo(() => {
    if (!students) return [];
    return Array.from(new Set(students.map((s) => s.class_name ?? s.grade).filter(Boolean))) as string[];
  }, [students]);

  const filtered = useMemo(() => {
    if (!students) return null;
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || s.email.toLowerCase().includes(q);
      const cls = s.class_name ?? s.grade ?? "";
      const matchClass = classFilter === "ALL" || cls === classFilter;
      const sc = s.avg_score ?? -1;
      const matchScore = scoreFilter === "ALL"
        || (scoreFilter === "HIGH" && sc >= 80)
        || (scoreFilter === "MID"  && sc >= 65 && sc < 80)
        || (scoreFilter === "LOW"  && sc >= 0  && sc < 65);
      return matchSearch && matchClass && matchScore;
    });
  }, [students, search, classFilter, scoreFilter]);

  // Aggregate stats for the strip
  const aggregate = useMemo(() => {
    if (!students) return { total: null, avg: null, top: null, bottom: null };
    const scored = students.filter((s) => typeof s.avg_score === "number");
    const total = students.length;
    const avg = scored.length === 0 ? null : Math.round(scored.reduce((a, b) => a + (b.avg_score ?? 0), 0) / scored.length * 10) / 10;
    const top = scored.filter((s) => (s.avg_score ?? 0) >= 80).length;
    const bottom = scored.filter((s) => (s.avg_score ?? 0) < 65).length;
    return { total, avg, top, bottom };
  }, [students]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Student Performance</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {students === null ? "Loading…" : `${students.length} student${students.length === 1 ? "" : "s"} across your classes`}
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Aggregate strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Total Students"      value={aggregate.total === null ? null : aggregate.total} />
        <Card label="Class Average"       value={aggregate.avg === null ? null : `${aggregate.avg}%`} />
        <Card label="Top Performers (≥80%)" value={aggregate.top === null ? null : aggregate.top}    tone="emerald" />
        <Card label="Needs Attention (<65%)" value={aggregate.bottom === null ? null : aggregate.bottom} tone="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm dark:bg-[var(--background)]">
        <div className="relative min-w-[260px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student name or email…" className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:focus:bg-[var(--background)]" />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
          <option value="ALL">All Classes</option>
          {classOptions.map((c) => <option key={c}>{c}</option>)}
          {classOptions.length === 0 && classes?.map((c) => <option key={c.id}>{c.class_name ?? c.name}</option>)}
        </select>
        <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value as typeof scoreFilter)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
          <option value="ALL">All Scores</option>
          <option value="HIGH">≥ 80% (Excellent)</option>
          <option value="MID">65-79% (Good)</option>
          <option value="LOW">&lt; 65% (Needs help)</option>
        </select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Class · Section</th>
                <th className="px-6 py-3">Quizzes Attempted</th>
                <th className="px-6 py-3">Avg Score</th>
                <th className="px-6 py-3">Trend</th>
                <th className="px-6 py-3">Last Attempt</th>
              </tr>
            </thead>
            <tbody>
              {filtered === null ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8">
                  <EmptyState
                    title={students?.length === 0 ? "No students yet" : "No students match"}
                    description={students?.length === 0 ? "Once your principal assigns students to your classes, they'll appear here with quiz stats and performance trends." : "Try clearing the filters or search."}
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                  />
                </td></tr>
              ) : (
                filtered.map((s) => {
                  const fullName = `${s.first_name} ${s.last_name}`.trim() || s.email;
                  return (
                    <tr key={s.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">{initials(fullName)}</div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[var(--foreground)]">{fullName}</p>
                            {s.roll_number && <p className="text-xs text-[var(--muted-foreground)]">Roll {s.roll_number}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">
                        {s.class_name ?? s.grade ?? "—"}{s.section ? ` · ${s.section}` : ""}
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.quizzes_attempted ?? "—"}</td>
                      <td className="px-6 py-3.5"><ScoreBar value={s.avg_score} /></td>
                      <td className="px-6 py-3.5">
                        {typeof s.trend === "number" ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${s.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {s.trend >= 0 ? "↑" : "↓"} {Math.abs(s.trend)}%
                          </span>
                        ) : <span className="text-xs text-[var(--muted-foreground)]">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{fmtDate(s.last_attempt_at)}</td>
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

function Card({ label, value, tone }: { label: string; value: number | string | null; tone?: "emerald" | "red" }) {
  const text = tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-[var(--foreground)]";
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${text}`}>
        {value === null ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-[var(--muted)]" /> : value}
      </p>
    </div>
  );
}
