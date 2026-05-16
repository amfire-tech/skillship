/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/quizzes/[id]/page.tsx
 * Purpose: Student quiz taker — load questions, navigate, submit answers.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface Quiz {
  id: string;
  title: string;
  subject?: string;
  duration_minutes?: number;
  instructions?: string;
}

interface Question {
  id: string;
  question_text: string;
  options?: { id: string; text: string }[];
  choices?: string[];
}

export default function StudentQuizTakerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [qRes, qsRes] = await Promise.all([
        fetch(`${API_BASE}/quizzes/${id}/`, { headers }),
        fetch(`${API_BASE}/quizzes/${id}/questions/`, { headers }),
      ]);
      if (!qRes.ok) throw new Error(`Failed to load quiz (${qRes.status})`);
      const q: Quiz = await qRes.json();
      setQuiz(q);
      if (q.duration_minutes) setSecondsLeft(q.duration_minutes * 60);

      if (qsRes.ok) {
        const qsData = await qsRes.json();
        setQuestions(asArray<Question>(qsData));
      } else {
        setQuestions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { document.title = "Take Quiz — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  // Timer
  useEffect(() => {
    if (secondsLeft === null || submitted) return;
    if (secondsLeft <= 0) { void submit(); return; }
    const t = setInterval(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, submitted]);

  const total = questions?.length ?? 0;
  const answered = Object.keys(answers).length;
  const q = questions?.[current];

  const timer = useMemo(() => {
    if (secondsLeft === null) return null;
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [secondsLeft]);

  async function submit() {
    if (submitting || submitted) return;
    setSubmitting(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setSubmitting(false); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/${id}/attempts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
      toast("Quiz submitted", "success");
    } catch {
      toast("Could not submit. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-[var(--foreground)]">Submitted!</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Your answers have been recorded.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dashboard/student/quizzes" className="rounded-full border border-[var(--border)] bg-white px-5 py-2 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">All Quizzes</Link>
            <button onClick={() => router.push("/dashboard/student")} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/student/quizzes" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            All Quizzes
          </Link>
          {loading ? (
            <div className="mt-2 h-7 w-64 animate-pulse rounded bg-[var(--muted)]" />
          ) : (
            <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{quiz?.title ?? "Quiz"}</h1>
          )}
          {quiz?.subject && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{quiz.subject}</p>}
        </div>
        {timer && (
          <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-center shadow-sm">
            <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Time Left</div>
            <div className={`text-lg font-bold tabular-nums ${secondsLeft! < 60 ? "text-red-600" : "text-[var(--foreground)]"}`}>{timer}</div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-3 text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {!loading && questions !== null && questions.length === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-medium text-[var(--foreground)]">This quiz has no questions yet.</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Please check back later.</p>
        </div>
      )}

      {q && (
        <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Question {current + 1} of {total}
              </span>
              <div className="h-1.5 w-32 rounded-full bg-[var(--muted)]">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((current + 1) / total) * 100}%` }} />
              </div>
            </div>
            <h2 className="text-base font-semibold leading-relaxed text-[var(--foreground)]">{q.question_text}</h2>

            <div className="mt-6 space-y-2">
              {(q.options ?? q.choices?.map((c, i) => ({ id: String(i), text: c })) ?? []).map((opt) => {
                const optId = typeof opt === "string" ? opt : opt.id;
                const optText = typeof opt === "string" ? opt : opt.text;
                const checked = answers[q.id] === optId;
                return (
                  <label
                    key={optId}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors ${
                      checked ? "border-primary bg-primary/5" : "border-[var(--border)] bg-white hover:border-primary/40 hover:bg-[var(--muted)]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={optId}
                      checked={checked}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: optId }))}
                      className="mt-0.5 h-4 w-4 accent-[color:var(--primary)]"
                    />
                    <span className={checked ? "font-medium text-[var(--foreground)]" : "text-[var(--foreground)]"}>{optText}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                disabled={current === 0}
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                className="rounded-full border border-[var(--border)] bg-white px-5 py-2 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary disabled:opacity-50"
              >
                Previous
              </button>
              {current < total - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
                  className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Progress</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{answered}/{total}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions?.map((qq, i) => {
                const isCurrent = i === current;
                const isAnswered = !!answers[qq.id];
                return (
                  <button
                    key={qq.id}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
                      isCurrent ? "bg-primary text-white" : isAnswered ? "bg-primary/10 text-primary" : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/70"
                    }`}
                    aria-label={`Go to question ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="mt-5 w-full rounded-full bg-primary py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Quiz"}
            </button>
          </aside>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm space-y-4">
          <div className="h-5 w-2/3 animate-pulse rounded bg-[var(--muted)]" />
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--muted)]" />)}
        </div>
      )}
    </div>
  );
}
