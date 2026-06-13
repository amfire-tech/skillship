/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/teachers/page.tsx
 * Purpose: Principal — Teachers Management (read-only). Lists the teachers in the
 *          principal's school via /users/teachers/ with each teacher's assigned
 *          student count. Account creation/edits are Super-Admin-only (the
 *          /users/ write surface is locked to MAIN_ADMIN), so this view does not
 *          expose add / bulk-upload / activate controls.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

interface Teacher {
  id: string;
  name?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  date_joined?: string;
  student_count?: number;
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export default function TeachersManagementPage() {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setTeachers([]); return; }
    try {
      // Principal-scoped, read-only directory of teachers in their own school.
      const res = await fetch(`${API_BASE}/users/teachers/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setError(`Failed to load teachers (${res.status}).`); setTeachers([]); return; }
      setTeachers(asArray<Teacher>(await res.json()));
    } catch {
      setError("Network error.");
      setTeachers([]);
    }
  }, []);

  useEffect(() => { document.title = "Teachers Management — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!teachers) return null;
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      const name = (t.name ?? `${t.first_name} ${t.last_name}`).toLowerCase();
      const matchSearch = !q || name.includes(q) || t.email.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? t.is_active : !t.is_active);
      return matchSearch && matchStatus;
    });
  }, [teachers, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Teachers</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {teachers === null ? "Loading…" : `${teachers.length} teacher${teachers.length === 1 ? "" : "s"} in your school`}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          Teacher accounts are managed by the Super Admin
        </span>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm dark:bg-[var(--background)]">
        <div className="relative min-w-[240px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"><SearchIcon /></span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:focus:bg-[var(--background)]"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Teacher</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Students</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered === null ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8">
                  <EmptyState
                    title={teachers?.length === 0 ? "No teachers yet" : "No teachers match"}
                    description={teachers?.length === 0 ? "Teacher accounts are created by the Super Admin. Once added to your school, they'll appear here with their assigned student counts." : "Try clearing the filters or search."}
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>}
                  />
                </td></tr>
              ) : (
                filtered.map((t) => {
                  const fullName = (t.name ?? `${t.first_name} ${t.last_name}`).trim() || t.email;
                  return (
                    <tr key={t.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                            {initials(fullName)}
                          </div>
                          <span className="font-medium text-[var(--foreground)]">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{t.email}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{t.phone || "—"}</td>
                      <td className="px-6 py-3.5">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {t.student_count ?? 0} student{(t.student_count ?? 0) === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{t.date_joined ? new Date(t.date_joined).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                      <td className="px-6 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-500"}`}>
                          {t.is_active ? "Active" : "Inactive"}
                        </span>
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
