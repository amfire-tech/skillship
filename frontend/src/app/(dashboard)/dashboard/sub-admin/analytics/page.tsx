/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/analytics/page.tsx
 * Purpose: Sub-admin School Analytics — territory-wide performance.
 *          School filter, KPI strip, top schools table, quiz status mix.
 *          Real API only.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

interface School {
  id: string;
  name: string;
  city?: string;
  state?: string;
  is_active: boolean;
  student_count?: number;
  teacher_count?: number;
  avg_score?: number;
}

interface Quiz {
  id: string;
  title: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  school?: string;
  school_name?: string;
  avg_score?: number;
  total_attempts?: number;
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT:     "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  REVIEW:    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  PUBLISHED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  ARCHIVED:  "bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-300",
};

export default function SubAdminAnalyticsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[] | null>(null);
  const [students, setStudents] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<number | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSchool, setActiveSchool] = useState<string>("ALL");

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); return; }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [schoolsRes, studentsRes, teachersRes, quizzesRes] = await Promise.all([
        fetch(`${API_BASE}/schools/`, { headers }),
        fetch(`${API_BASE}/users/?role=STUDENT`, { headers }),
        fetch(`${API_BASE}/users/?role=TEACHER`, { headers }),
        fetch(`${API_BASE}/quizzes/`, { headers }),
      ]);
      const [sd, std, td, qd] = await Promise.all([
        schoolsRes.ok  ? schoolsRes.json()  : null,
        studentsRes.ok ? studentsRes.json() : null,
        teachersRes.ok ? teachersRes.json() : null,
        quizzesRes.ok  ? quizzesRes.json()  : null,
      ]);
      setSchools(asArray<School>(sd));
      setStudents(std?.count ?? asArray(std).length);
      setTeachers(td?.count ?? asArray(td).length);
      setQuizzes(asArray<Quiz>(qd));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics.");
    }
  }, []);

  useEffect(() => { document.title = "School Analytics — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return null;
    if (activeSchool === "ALL") return quizzes;
    return quizzes.filter((q) => q.school === activeSchool || q.school_name === activeSchool);
  }, [quizzes, activeSchool]);

  const statusMix = useMemo(() => {
    const list = filteredQuizzes ?? [];
    const counts = { DRAFT: 0, REVIEW: 0, PUBLISHED: 0, ARCHIVED: 0 };
    list.forEach((q) => { if (q.status in counts) counts[q.status as keyof typeof counts]++; });
    const total = list.length || 1;
    return Object.entries(counts).map(([k, v]) => ({ key: k, value: v, pct: Math.round((v / total) * 100) }));
  }, [filteredQuizzes]);

  const topSchools = useMemo(() => {
    if (!schools) return null;
    return [...schools]
      .sort((a, b) => (b.student_count ?? 0) - (a.student_count ?? 0))
      .slice(0, 5);
  }, [schools]);

  const stats = [
    { label: "Schools",          value: schools === null  ? null : schools.length,             tone: "primary" },
    { label: "Students",         value: students,                                                tone: "teal"    },
    { label: "Teachers",         value: teachers,                                                tone: "amber"   },
    { label: "Active Quizzes",   value: quizzes === null  ? null : quizzes.filter((q) => q.status === "PUBLISHED").length, tone: "rose" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">School Analytics</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Performance across schools in your territory
        </p>
      </div>

      {/* School filter */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Scope</span>
        <select
          value={activeSchool}
          onChange={(e) => setActiveSchool(e.target.value)}
          className="h-10 rounded-full border border-[var(--border)] bg-white px-4 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
        >
          <option value="ALL">All schools</option>
          {(schools ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 * i }}
            className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]"
          >
            <p className="text-sm font-medium text-[var(--muted-foreground)]">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
              {s.value === null ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-[var(--muted)]" /> : s.value.toLocaleString("en-IN")}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Quiz status mix + Top schools */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Status mix */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
          <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Quiz Status Mix</h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {filteredQuizzes === null
              ? "Loading…"
              : `${filteredQuizzes.length} quiz${filteredQuizzes.length === 1 ? "" : "zes"} ${activeSchool === "ALL" ? "across territory" : "for selected school"}`}
          </p>
          <div className="mt-5 space-y-3">
            {statusMix.map((s) => (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_COLOR[s.key]}`}>{s.key}</span>
                  <span className="font-semibold text-[var(--foreground)]">{s.value}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                  <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top schools */}
        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">Schools by Enrolment</h2>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Top 5 schools in your territory</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <th className="px-6 py-3">School</th>
                  <th className="px-6 py-3">Students</th>
                  <th className="px-6 py-3">Teachers</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {topSchools === null ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j} className="px-6 py-3.5">
                          <div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : topSchools.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8">
                    <EmptyState
                      title="No schools assigned"
                      description="Coordinate with the platform admin to add schools to your territory — analytics will populate as quizzes are run."
                      action={{ label: "View schools", href: "/dashboard/sub-admin/schools" }}
                      icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /></svg>}
                    />
                  </td></tr>
                ) : (
                  topSchools.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/dashboard/sub-admin/schools/${s.id}`)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/dashboard/sub-admin/schools/${s.id}`); }}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer border-b border-[var(--border)]/60 last:border-0 transition-colors hover:bg-[var(--muted)]/40 focus:bg-[var(--muted)]/40 focus:outline-none"
                    >
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-[var(--foreground)]">{s.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{[s.city, s.state].filter(Boolean).join(", ") || "—"}</p>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.student_count?.toLocaleString("en-IN") ?? "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.teacher_count?.toLocaleString("en-IN") ?? "—"}</td>
                      <td className="px-6 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-500"}`}>
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Note about engagement series */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        Time-series engagement charts (DAU / WAU, score trends) require the <code className="rounded bg-white px-1 py-0.5 text-[10px]">/analytics/timeseries/</code> endpoint, scheduled for Phase 03.
      </div>
    </div>
  );
}
