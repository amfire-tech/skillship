/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/quizzes/page.tsx
 * Purpose: Student quiz list — browse published quizzes, see difficulty and due dates.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getToken, API_BASE } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

interface Quiz {
  id: string;
  title: string;
  difficulty?: string;
  due_date?: string | null;
  subject?: string;
  description?: string;
}

const difficultyStyle: Record<string, string> = {
  EASY:   "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  HARD:   "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

const QuizIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

function QuizSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-48 rounded-lg bg-[var(--muted)]" />
        <div className="h-5 w-16 rounded-full bg-[var(--muted)]" />
      </div>
      <div className="h-4 w-32 rounded-lg bg-[var(--muted)]" />
      <div className="flex justify-end">
        <div className="h-9 w-20 rounded-xl bg-[var(--muted)]" />
      </div>
    </div>
  );
}

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Authentication failed."); return; }

    try {
      const res = await fetch(`${API_BASE}/quizzes/?status=PUBLISHED`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError("Failed to load quizzes. Please try again.");
        setQuizzes([]);
        return;
      }

      const data = await res.json();
      setQuizzes(asArray<Quiz>(data));
    } catch {
      setError("Network error. Please check your connection and try again.");
      setQuizzes([]);
    }
  }, []);

  useEffect(() => {
    document.title = "My Quizzes — Skillship";
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">My Quizzes</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Published quizzes assigned to you.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {quizzes === null && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <QuizSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {quizzes !== null && quizzes.length === 0 && !error && (
        <EmptyState
          title="No quizzes assigned yet"
          description="Check back once your teacher publishes a quiz — assignments and adaptive quizzes will appear here."
          icon={<QuizIcon />}
        />
      )}

      {/* Quiz cards */}
      {quizzes !== null && quizzes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                  {quiz.title}
                </h3>
                {quiz.difficulty && (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      difficultyStyle[quiz.difficulty] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    {quiz.difficulty}
                  </span>
                )}
              </div>

              {quiz.subject && (
                <p className="text-[13px] text-[var(--muted-foreground)]">{quiz.subject}</p>
              )}

              {quiz.due_date && (
                <p className="text-[12px] text-[var(--muted-foreground)]">
                  Due:{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {new Date(quiz.due_date).toLocaleDateString()}
                  </span>
                </p>
              )}

              <div className="mt-auto flex justify-end">
                <Link
                  href={`/dashboard/student/quizzes/${quiz.id}`}
                  className="rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
                >
                  Start
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
