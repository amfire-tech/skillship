/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/quizzes/page.tsx
 * Purpose: Sub-admin quizzes list — status filter pills, table with View links.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";

interface Quiz {
  id: string;
  title: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  created_at: string;
}

type StatusFilter = "ALL" | "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

const statusBadge: Record<string, string> = {
  DRAFT:     "bg-[var(--muted)] text-[var(--muted-foreground)]",
  REVIEW:    "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED:  "bg-gray-100 text-gray-500",
};

const QuizEmptyIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

function SkeletonRow() {
  return (
    <tr>
      <td className="py-3 pr-4"><div className="h-4 w-48 animate-pulse rounded-lg bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-20 animate-pulse rounded-full bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-28 animate-pulse rounded-lg bg-[var(--muted)]" /></td>
      <td className="py-3"><div className="h-4 w-10 animate-pulse rounded-lg bg-[var(--muted)]" /></td>
    </tr>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_PILLS: { key: StatusFilter; label: string }[] = [
  { key: "ALL",       label: "All"       },
  { key: "DRAFT",     label: "Draft"     },
  { key: "REVIEW",    label: "Review"    },
  { key: "PUBLISHED", label: "Published" },
  { key: "ARCHIVED",  label: "Archived"  },
];

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) { setError(true); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(true); return; }
      const data = await res.json();
      setQuizzes(data.results ?? []);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    document.title = "Quizzes — Skillship";
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!quizzes) return null;
    if (statusFilter === "ALL") return quizzes;
    return quizzes.filter((q) => q.status === statusFilter);
  }, [quizzes, statusFilter]);

  const emptyLabel =
    statusFilter === "ALL"
      ? "No quizzes found"
      : `No ${statusFilter.toLowerCase()} quizzes found`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Quizzes</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Quizzes published across your schools
        </p>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_PILLS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`inline-flex min-h-8 items-center rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors ${
              statusFilter === key
                ? "border-primary bg-primary text-white"
                : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-primary/40 hover:text-primary dark:bg-[var(--background)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
        {error && (
          <p className="py-10 text-center text-sm text-[var(--muted-foreground)]">
            Could not load quizzes — check API connection.
          </p>
        )}

        {!error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Created</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered === null ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center py-14 text-center text-[var(--muted-foreground)]">
                        <QuizEmptyIcon />
                        <p className="mt-3 text-sm">{emptyLabel}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((q) => (
                    <tr key={q.id} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="py-3 pr-4 font-medium text-[var(--foreground)]">{q.title}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[q.status] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                          {q.status.charAt(0) + q.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[var(--muted-foreground)]">{formatDate(q.created_at)}</td>
                      <td className="py-3">
                        <Link
                          href={`/dashboard/sub-admin/quizzes/${q.id}`}
                          className="text-[13px] font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
