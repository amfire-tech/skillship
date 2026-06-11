/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/students/page.tsx
 * Purpose: Principal — Student Management (READ-ONLY). Search / filter / view the
 *          student roster. Creating, editing, and removing students is locked to
 *          the platform Super Admin (MAIN_ADMIN) — the /users/ surface rejects
 *          everyone else server-side — so this page no longer offers any mutation
 *          actions. Real API: GET /users/?role=STUDENT, GET /academics/classes/.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  admission_number?: string;
  roll_number?: string;
  grade?: string;
  class_id?: string;
  class_name?: string;
  section?: string;
  quizzes_attempted?: number;
  avg_score?: number;
  career_path?: string;
  assigned_teacher_name?: string | null;
}

interface AcademicClass {
  id: string;
  name?: string;
  class_name?: string;
}

const CAREER_TINT: Record<string, string> = {
  Engineering: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Medical:     "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  Computing:   "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  Robotics:    "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  Arts:        "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  Business:    "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function ScoreBar({ value }: { value?: number }) {
  if (typeof value !== "number") return <span className="text-xs text-[var(--muted-foreground)]">—</span>;
  const tone = value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-amber-500" : "bg-red-500";
  const text = value >= 80 ? "text-emerald-600" : value >= 65 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--muted)]">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className={`text-xs font-semibold ${text}`}>{Math.round(value)}%</span>
    </div>
  );
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [classes, setClasses] = useState<AcademicClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [sectionFilter, setSectionFilter] = useState<string>("ALL");

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setStudents([]); return; }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      // /roster/ is auto-scoped to the principal's own school.
      const res = await fetch(`${API_BASE}/users/roster/?page_size=500`, { headers });
      if (!res.ok) { setError(`Failed to load students (${res.status}).`); setStudents([]); return; }
      const rows = asArray<any>(await res.json());
      setStudents(rows.map((r) => ({
        id: r.id,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        is_active: r.is_active,
        admission_number: r.roll_number ?? undefined,
        roll_number: r.roll_number ?? undefined,
        grade: r.grade != null ? String(r.grade) : undefined,
        class_name: r.class_label ?? undefined,
        section: r.section ?? undefined,
        quizzes_attempted: r.quizzes_attempted ?? undefined,
        avg_score: r.avg_score ?? undefined,
        assigned_teacher_name: r.assigned_teacher_name ?? undefined,
      })));
      setClasses([]);
    } catch {
      setError("Network error.");
      setStudents([]);
    }
  }, []);

  useEffect(() => { document.title = "Student Management — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  // Build distinct class/section options from real data
  const classOptions = useMemo(() => {
    if (!students) return [];
    return Array.from(new Set(students.map((s) => s.class_name ?? s.grade).filter(Boolean))) as string[];
  }, [students]);
  const sectionOptions = useMemo(() => {
    if (!students) return [];
    return Array.from(new Set(students.map((s) => s.section).filter(Boolean))) as string[];
  }, [students]);

  const filtered = useMemo(() => {
    if (!students) return null;
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || (s.email ?? "").toLowerCase().includes(q);
      const cls = s.class_name ?? s.grade ?? "";
      const matchClass = classFilter === "ALL" || cls === classFilter;
      const matchSection = sectionFilter === "ALL" || (s.section ?? "") === sectionFilter;
      return matchSearch && matchClass && matchSection;
    });
  }, [students, search, classFilter, sectionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Students</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {students === null ? "Loading…" : `${students.length} student${students.length === 1 ? "" : "s"} registered`}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]">
          <LockIcon />
          Student accounts are managed by the Super Admin
        </span>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm dark:bg-[var(--background)]">
        <div className="relative min-w-[260px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"><SearchIcon /></span>
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name…"
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:focus:bg-[var(--background)]"
          />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
          <option value="ALL">All Classes</option>
          {classOptions.map((c) => <option key={c}>{c}</option>)}
          {classOptions.length === 0 && classes?.map((c) => <option key={c.id}>{c.class_name ?? c.name}</option>)}
        </select>
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
          <option value="ALL">All Sections</option>
          {sectionOptions.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {filtered === null ? "—" : `${filtered.length} student${filtered.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Section</th>
                <th className="px-6 py-3">Roll No.</th>
                <th className="px-6 py-3">Assigned Teacher</th>
                <th className="px-6 py-3">Quizzes Attempted</th>
                <th className="px-6 py-3">Avg Score</th>
                <th className="px-6 py-3">Career Path</th>
              </tr>
            </thead>
            <tbody>
              {filtered === null ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-6 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8">
                  <EmptyState
                    title={students?.length === 0 ? "No students yet" : "No students match"}
                    description={students?.length === 0 ? "Students appear here once the Super Admin generates their logins and they complete first-login setup." : "Try clearing filters or search."}
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                  />
                </td></tr>
              ) : (
                filtered.map((s) => {
                  const fullName = `${s.first_name} ${s.last_name}`.trim() || s.email;
                  return (
                    <tr key={s.id} className="group border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">{initials(fullName)}</div>
                          <span className="font-medium text-[var(--foreground)]">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.class_name ?? s.grade ?? "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.section ? `Section ${s.section}` : "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.roll_number ?? s.admission_number ?? "—"}</td>
                      <td className="px-6 py-3.5">
                        {s.assigned_teacher_name
                          ? <span className="text-[var(--foreground)]">{s.assigned_teacher_name}</span>
                          : <span className="text-xs text-amber-600">Unassigned</span>}
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.quizzes_attempted ?? "—"}</td>
                      <td className="px-6 py-3.5"><ScoreBar value={s.avg_score} /></td>
                      <td className="px-6 py-3.5">
                        {s.career_path
                          ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CAREER_TINT[s.career_path] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{s.career_path}</span>
                          : <span className="text-xs text-[var(--muted-foreground)]">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>; }
function LockIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>; }
