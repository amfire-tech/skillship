/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/quizzes/page.tsx
 * Purpose: Teacher quiz management — list, filter by status, create/edit/view links.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

type QuizStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

interface Quiz {
  id: string;
  title: string;
  status: QuizStatus;
  created_at: string;
}

type FilterOption = "ALL" | QuizStatus;

const FILTERS: { label: string; value: FilterOption }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Review", value: "REVIEW" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
];

const statusBadge: Record<QuizStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-700",
  REVIEW: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("ALL");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("Session expired. Please log in again.");
      setQuizzes([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/quizzes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load quizzes: ${res.status}`);
      const data = await res.json();
      setQuizzes(asArray<Quiz>(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quizzes.");
      setQuizzes([]);
    }
  }, []);

  useEffect(() => {
    document.title = "My Quizzes — Skillship";
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = quizzes === null
    ? null
    : activeFilter === "ALL"
    ? quizzes
    : quizzes.filter((q) => q.status === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">My Quizzes</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Create, manage and publish quizzes for your classes
          </p>
        </div>
        <Link
          href="/dashboard/teacher/quizzes/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          Create Quiz
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setActiveFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === f.value
                ? "bg-primary text-white"
                : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-primary/40 hover:text-[var(--foreground)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Quiz table */}
      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered === null ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/50">
                    <td className="px-5 py-3"><div className="h-4 w-48 animate-pulse rounded bg-[var(--muted)]" /></td>
                    <td className="px-5 py-3"><div className="h-5 w-20 animate-pulse rounded-full bg-[var(--muted)]" /></td>
                    <td className="px-5 py-3"><div className="h-4 w-28 animate-pulse rounded bg-[var(--muted)]" /></td>
                    <td className="px-5 py-3"><div className="h-4 w-24 animate-pulse rounded bg-[var(--muted)]" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8">
                  <EmptyState
                    title={activeFilter === "ALL" ? "No quizzes yet" : `No ${activeFilter.toLowerCase()} quizzes`}
                    description={activeFilter === "ALL" ? "Create your first quiz manually or use the AI generator on the teacher dashboard." : "Try a different status filter."}
                    action={activeFilter === "ALL" ? { label: "Create Quiz", href: "/dashboard/teacher/quizzes/new" } : { label: "Show all", onClick: () => setActiveFilter("ALL") }}
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>}
                  />
                </td></tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--muted)]/20">
                    <td className="px-5 py-3 font-medium text-[var(--foreground)]">{q.title}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[q.status]}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--muted-foreground)]">{formatDate(q.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {(q.status === "DRAFT" || q.status === "REVIEW") && (
                          <Link
                            href={`/dashboard/teacher/quizzes/${q.id}/edit`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Edit
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/teacher/quizzes/${q.id}`}
                          className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
