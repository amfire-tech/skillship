/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/quizzes/[id]/page.tsx
 * Purpose: Sub-admin — quiz detail (read-only) with stats.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";

interface Quiz {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  grade_level?: string;
  duration_minutes?: number;
  status?: string;
  description?: string;
  instructions?: string;
  question_count?: number;
  questions_count?: number;
  total_attempts?: number;
  avg_score?: number | null;
  created_at?: string;
  updated_at?: string;
}

const statusBadge: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-700",
  REVIEW: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

function fmt(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; }
}

export default function SubAdminQuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to load quiz (${res.status})`);
      setQuiz(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { document.title = "Quiz — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const questionCount = quiz?.questions_count ?? quiz?.question_count ?? 0;
  const attempts = quiz?.total_attempts ?? null;
  const avgScore = quiz?.avg_score != null ? `${Math.round(Number(quiz.avg_score))}%` : "—";
  const grade = quiz?.grade ?? quiz?.grade_level ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/sub-admin/quizzes" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          All Quizzes
        </Link>
        {loading ? (
          <div className="mt-2 h-7 w-64 animate-pulse rounded bg-[var(--muted)]" />
        ) : (
          <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{quiz?.title ?? "Untitled Quiz"}</h1>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-3 text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Questions", value: loading ? null : String(questionCount) },
          { label: "Attempts", value: loading ? null : (attempts != null ? Number(attempts).toLocaleString("en-IN") : "—") },
          { label: "Avg Score", value: loading ? null : avgScore },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-5 text-center shadow-sm">
            {s.value === null ? (
              <div className="mx-auto h-7 w-16 animate-pulse rounded bg-[var(--muted)]" />
            ) : (
              <p className="text-2xl font-bold text-primary">{s.value}</p>
            )}
            <p className="mt-1 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-[var(--foreground)]">Details</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-[var(--muted)]" />)}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Subject" value={quiz?.subject ?? "—"} />
            <Detail label="Grade" value={grade} />
            <Detail label="Duration" value={quiz?.duration_minutes ? `${quiz.duration_minutes} min` : "—"} />
            <Detail label="Status">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[quiz?.status ?? ""] ?? "bg-gray-100 text-gray-500"}`}>
                {quiz?.status ?? "—"}
              </span>
            </Detail>
            <Detail label="Created" value={fmt(quiz?.created_at)} />
            <Detail label="Last Updated" value={fmt(quiz?.updated_at)} />
            {(quiz?.description || quiz?.instructions) && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Detail label={quiz?.instructions ? "Instructions" : "Description"} value={quiz?.instructions ?? quiz?.description ?? ""} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      {children ? <div className="mt-1">{children}</div> : <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>}
    </div>
  );
}
