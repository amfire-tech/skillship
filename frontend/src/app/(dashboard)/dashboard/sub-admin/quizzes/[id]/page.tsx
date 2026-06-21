/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/quizzes/[id]/page.tsx
 * Purpose: Sub-admin — quiz review/detail. Shows stats + EVERY question (with the
 *          correct answer marked) so a sub-admin can read the whole quiz before
 *          approving, exactly like the super-admin panel. When the quiz is in
 *          REVIEW, Approve/Reject act via the gated state-machine endpoints
 *          (publish / return-to-draft), scoped to the acting X-School-Context.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

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
  created_by_name?: string;
  school_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface PreviewQuestion {
  id: string;
  text: string;
  type: string;
  options: { id: string; text: string }[];
  correct_option_ids: string[];
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
  const router = useRouter();
  const toast = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<PreviewQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    try {
      // Fetch the quiz + its full question set in parallel. The questions
      // endpoint returns the staff shape (with correct_option_ids) for a
      // granted sub-admin acting in the quiz's school (X-School-Context).
      const [qRes, quesRes] = await Promise.all([
        fetch(`${API_BASE}/quizzes/${id}/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/quizzes/${id}/questions/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!qRes.ok) throw new Error(`Failed to load quiz (${qRes.status})`);
      setQuiz(await qRes.json());
      if (quesRes.ok) {
        const data = await quesRes.json();
        setQuestions(Array.isArray(data) ? data : (data.results ?? []));
      } else {
        setQuestions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { document.title = "Quiz — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(action: "approve" | "reject") {
    if (acting) return;
    setActing(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setActing(false); return; }
    try {
      // Status is read-only on the serializer — transitions go through the gated
      // action endpoints (publish needs can_approve_quizzes for this school).
      const path = action === "approve" ? "publish" : "return-to-draft";
      const res = await fetch(`${API_BASE}/quizzes/${id}/${path}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(
          res.status === 403
            ? "You don't have quiz-approval access for this school"
            : (body?.detail ?? `Failed to ${action} quiz`),
          "error",
        );
        return;
      }
      toast(action === "approve" ? "Quiz approved & published" : "Quiz sent back to draft", action === "approve" ? "success" : "info");
      router.push("/dashboard/sub-admin/quizzes");
    } catch {
      toast("Network error", "error");
    } finally {
      setActing(false);
    }
  }

  const questionCount = questions?.length ?? quiz?.questions_count ?? quiz?.question_count ?? 0;
  const attempts = quiz?.total_attempts ?? null;
  const avgScore = quiz?.avg_score != null ? `${Math.round(Number(quiz.avg_score))}%` : "—";
  const grade = quiz?.grade ?? quiz?.grade_level ?? "—";
  const isReview = quiz?.status === "REVIEW";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
          {!loading && (quiz?.created_by_name || quiz?.school_name) && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {quiz?.created_by_name && <span className="font-semibold text-[var(--foreground)]">{quiz.created_by_name}</span>}
              {quiz?.created_by_name && quiz?.school_name && " · "}
              {quiz?.school_name}
            </p>
          )}
        </div>

        {/* Approve / Reject — only while the quiz is awaiting review. */}
        {!loading && isReview && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => decide("reject")}
              disabled={acting}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => decide("approve")}
              disabled={acting}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              {acting ? "Working…" : "Approve"}
            </button>
          </div>
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

      {/* Full question review — every question with its correct answer marked. */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-[var(--foreground)]">
          Questions {questions ? `(${questions.length})` : ""}
        </h2>
        {loading || questions === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--muted)]/50" />)}
          </div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-amber-600">⚠ This quiz has no questions{isReview ? " — reject it back to the author." : "."}</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, qi) => (
              <div key={q.id} className="rounded-xl bg-[var(--muted)]/40 p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">{qi + 1}. {q.text}</p>
                <ul className="mt-2.5 space-y-1.5">
                  {q.options.map((o) => {
                    const correct = q.correct_option_ids?.includes(o.id);
                    return (
                      <li key={o.id} className={`flex items-center gap-2 text-sm ${correct ? "font-semibold text-primary" : "text-[var(--muted-foreground)]"}`}>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] uppercase ${correct ? "border-primary bg-primary/10" : "border-[var(--border)]"}`}>{o.id}</span>
                        {o.text}
                        {correct && <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-primary">✓ correct</span>}
                      </li>
                    );
                  })}
                  {q.options.length === 0 && (
                    <li className="text-xs italic text-[var(--muted-foreground)]">Short-answer question</li>
                  )}
                </ul>
              </div>
            ))}
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
