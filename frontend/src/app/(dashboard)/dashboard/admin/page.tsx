"use client";

// Admin Dashboard — Main overview page.
// All stat values fetched from real API; no hardcoded mock data.

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StatCard } from "@/components/admin/StatCard";
import { QuickActions } from "@/components/admin/QuickActions";
import type { School, PaginatedResponse } from "@/types";
import { API_BASE, getToken } from "@/lib/auth";

async function apiFetch<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────
interface DashboardStats {
  schools: number | null | undefined;
  students: number | null | undefined;
  teachers: number | null | undefined;
  quizzes: number | null | undefined;
}

// ── Board badge colours ────────────────────────────────────────
const boardClass: Record<string, string> = {
  CBSE: "bg-primary/10 text-primary border-primary/20",
  ICSE: "bg-violet-50 text-violet-700 border-violet-200",
  STATE: "bg-amber-50 text-amber-700 border-amber-200",
};

// ── Skeleton helper ────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded bg-[var(--muted)] ${className ?? ""}`} />;
}

// ── Recent Schools Table ───────────────────────────────────────
interface RecentSchoolsProps {
  schools: School[] | null;
}

function RecentSchoolsTable({ schools }: RecentSchoolsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Recently Joined Schools</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Latest schools onboarded to the platform</p>
        </div>
        <Link
          href="/dashboard/admin/schools"
          className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-700"
        >
          View all
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              <th className="py-3 pr-4">School name</th>
              <th className="py-3 pr-4">Board</th>
              <th className="py-3 pr-4">City</th>
              <th className="py-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {schools === null ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                  <td className="py-3 pr-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="py-3 pr-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="py-3 pr-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-3 pr-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                </tr>
              ))
            ) : schools.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                  No schools found.
                </td>
              </tr>
            ) : (
              schools.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.3 + i * 0.05 }}
                  className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                >
                  <td className="py-3 pr-4 font-semibold text-[var(--foreground)]">{s.name}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${boardClass[s.board] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {s.board}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[var(--muted-foreground)]">{s.city ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.is_active ? "bg-primary/10 text-primary border-primary/20" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    schools: null,
    students: null,
    teachers: null,
    quizzes: null,
  });
  const [recentSchools, setRecentSchools] = useState<School[] | null>(null);

  useEffect(() => {
    document.title = "Admin Dashboard — Skillship";
    // Fetch all counts concurrently
    Promise.allSettled([
      apiFetch<PaginatedResponse<unknown>>("/schools/?limit=1"),
      apiFetch<PaginatedResponse<unknown>>("/users/?role=STUDENT&limit=1"),
      apiFetch<PaginatedResponse<unknown>>("/users/?role=TEACHER&limit=1"),
      apiFetch<PaginatedResponse<unknown>>("/quizzes/?limit=1"),
    ]).then(([schoolsRes, studentsRes, teachersRes, quizzesRes]) => {
      setStats({
        schools: schoolsRes.status === "fulfilled" ? schoolsRes.value.count : null,
        students: studentsRes.status === "fulfilled" ? studentsRes.value.count : null,
        teachers: teachersRes.status === "fulfilled" ? teachersRes.value.count : null,
        quizzes: quizzesRes.status === "fulfilled" ? quizzesRes.value.count : null,
      });
    });

    // Fetch recent schools for the table
    apiFetch<PaginatedResponse<School>>("/schools/?limit=5&ordering=-created_at")
      .then((data) => setRecentSchools(data.results))
      .catch(() => setRecentSchools([]));
  }, []);

  const fmt = (n: number | null | undefined) =>
    typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Schools"
          value={fmt(stats.schools)}
          delta={{ value: "" }}
          tint="primary"
          delay={0.05}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
            </svg>
          }
        />
        <StatCard
          label="Total Students"
          value={fmt(stats.students)}
          delta={{ value: "" }}
          tint="accent"
          delay={0.1}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Total Teachers"
          value={fmt(stats.teachers)}
          delta={{ value: "" }}
          tint="violet"
          delay={0.15}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          }
        />
        <StatCard
          label="Total Quizzes"
          value={fmt(stats.quizzes)}
          delta={{ value: "" }}
          tint="amber"
          delay={0.2}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12 11 14 15 10" /><circle cx="12" cy="12" r="10" />
            </svg>
          }
        />
      </div>

      {/* Recent schools + quick actions */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <RecentSchoolsTable schools={recentSchools} />
        <div className="space-y-4">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
