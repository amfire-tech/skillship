"use client";

// Admin Global Analytics — real counts from API.
// Chart time-series data shows empty state until backend provides time-series endpoints.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { LineChartCard } from "@/components/admin/LineChartCard";
import { BarChartCard } from "@/components/admin/BarChartCard";
import type { PaginatedResponse } from "@/types";
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
interface AnalyticsStats {
  schools: number | null;
  students: number | null;
  teachers: number | null;
  quizzes: number | null;
}

function Skeleton({ className }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded bg-[var(--muted)] ${className ?? ""}`} />;
}

// Empty state for charts that need time-series data not yet available
function ChartEmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
      <div className="border-b border-[var(--border)] p-5">
        <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">{title}</h3>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-10 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Analytics charts available once data accumulates
        </p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function GlobalAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats>({
    schools: null,
    students: null,
    teachers: null,
    quizzes: null,
  });

  useEffect(() => {
    document.title = "Analytics — Skillship";
  }, []);

  useEffect(() => {
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
  }, []);

  const fmt = (n: number | null) =>
    n === null ? (
      <Skeleton className="h-6 w-20" />
    ) : (
      n.toLocaleString("en-IN")
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Analytics"
        subtitle="Platform-wide engagement, performance and regional distribution"
      />

      {/* KPI strip — real counts */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Schools"
          value={typeof stats.schools === "number" ? stats.schools.toLocaleString("en-IN") : "—"}
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
          value={typeof stats.students === "number" ? stats.students.toLocaleString("en-IN") : "—"}
          delta={{ value: "" }}
          tint="accent"
          delay={0.1}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
          }
        />
        <StatCard
          label="Total Teachers"
          value={typeof stats.teachers === "number" ? stats.teachers.toLocaleString("en-IN") : "—"}
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
          value={typeof stats.quizzes === "number" ? stats.quizzes.toLocaleString("en-IN") : "—"}
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

      {/* Charts — empty arrays until time-series API is available */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartEmptyState
          title="Student Engagement Over Time"
          subtitle="Active rate across all schools"
        />
        <ChartEmptyState
          title="Average Score by Subject"
          subtitle="Across all students"
        />
      </div>

      {/* Regional distribution — placeholder until /analytics/ endpoint is available */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        <div className="border-b border-[var(--border)] p-5">
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Regional Distribution</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Schools and student activity across India</p>
        </div>
        <div className="flex items-center justify-center p-10 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Regional breakdown available once the <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/analytics/</code> endpoint is live.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
