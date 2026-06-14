/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/quizzes/page.tsx
 * Purpose: Student quiz list — browse published quizzes, see difficulty and due dates.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch, getToken, API_BASE } from "@/lib/auth";
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

interface Assignment {
  id: string;
  quiz: string;
  quiz_title?: string;
  due_at?: string | null;
  student?: string | null;
  klass?: string | null;
}

interface Attempt {
  id: string;
  quiz?: string;             // quiz UUID this attempt belongs to
  status?: string;
  score_percent?: number | null;
  score?: number | null;
  passed?: boolean | null;
  submitted_at?: string;
  created_at?: string;
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
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  // quizId → the student's latest attempt for that quiz (so cards can show an
  // "Attempted" badge + link to the result instead of looking identical to new ones).
  const [attemptByQuiz, setAttemptByQuiz] = useState<Map<string, Attempt>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Authentication failed."); return; }

    try {
      const [qRes, aRes, atRes] = await Promise.all([
        fetch(`${API_BASE}/quizzes/?status=PUBLISHED`, { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch(`/quizzes/assignments/`),
        apiFetch(`/quizzes/attempts/`),
      ]);

      if (!qRes.ok) {
        setError("Failed to load quizzes. Please try again.");
        setQuizzes([]);
      } else {
        setQuizzes(asArray<Quiz>(await qRes.json()));
      }
      setAssignments(aRes.ok ? asArray<Assignment>(await aRes.json()) : []);

      // Keep the most-recent attempt per quiz.
      const map = new Map<string, Attempt>();
      if (atRes.ok) {
        const att = asArray<Attempt>(await atRes.json());
        att.sort((x, y) => new Date(y.submitted_at ?? y.created_at ?? "").getTime() - new Date(x.submitted_at ?? x.created_at ?? "").getTime());
        for (const a of att) {
          if (a.quiz && !map.has(a.quiz)) map.set(a.quiz, a);
        }
      }
      setAttemptByQuiz(map);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setQuizzes([]); setAssignments([]);
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

      {/* Assigned to you — only when the student actually has assignments */}
      {assignments !== null && assignments.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Assigned to you ({assignments.length})
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignments.map((a) => {
              const overdue = a.due_at ? new Date(a.due_at).getTime() < Date.now() : false;
              const attempt = attemptByQuiz.get(a.quiz);
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] leading-snug">{a.quiz_title ?? "Assigned quiz"}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${a.student ? "bg-amber-100 text-amber-700" : "bg-cyan-100 text-cyan-700"}`}>
                      {a.student ? "Personal" : "Class"}
                    </span>
                  </div>
                  <StatusPill attempt={attempt} />
                  {a.due_at ? (
                    <p className={`text-[12px] ${overdue ? "text-red-600 font-semibold" : "text-[var(--muted-foreground)]"}`}>
                      {overdue ? "Overdue · " : "Due "}
                      <span className="font-medium">{new Date(a.due_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </p>
                  ) : (
                    <p className="text-[12px] text-[var(--muted-foreground)]">No due date</p>
                  )}
                  <div className="mt-auto flex justify-end">
                    {attempt ? (
                      <Link
                        href={`/dashboard/student/results/${attempt.id}`}
                        className="rounded-xl border border-primary/40 bg-white px-4 py-2 text-[13px] font-semibold text-primary hover:bg-primary/5 dark:bg-[var(--background)]"
                      >
                        View Result
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/student/quizzes/${a.quiz}`}
                        className="rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
                      >
                        Start
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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
          {quizzes.map((quiz) => {
            const attempt = attemptByQuiz.get(quiz.id);
            return (
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

              <StatusPill attempt={attempt} />

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
                {attempt ? (
                  <Link
                    href={`/dashboard/student/results/${attempt.id}`}
                    className="rounded-xl border border-[var(--border)] px-4 py-2 text-[13px] font-semibold text-primary hover:bg-primary/5"
                  >
                    View Result
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/student/quizzes/${quiz.id}`}
                    className="rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
                  >
                    Start
                  </Link>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Attempted / not-attempted status pill ──────────────────────────────────
function StatusPill({ attempt }: { attempt?: Attempt }) {
  if (attempt) {
    const score = attempt.score_percent ?? attempt.score;
    const pending = attempt.status && attempt.status !== "SUBMITTED";
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        {pending ? "In progress" : "Attempted"}{!pending && typeof score === "number" ? ` · ${Math.round(Number(score))}%` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
      Not attempted
    </span>
  );
}
