/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/quizzes/[id]/page.tsx
 * Purpose: Admin quiz detail/edit page — loads real quiz data from API.
 * Owner:   Pranav
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { API_BASE, getToken } from "@/lib/auth";

interface Quiz {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  grade_level?: string;
  section?: string;
  duration_minutes?: number;
  description?: string;
  school?: string | null;
  school_name?: string | null;
  questions_count?: number;
  question_count?: number;
  total_attempts?: number;
  avg_score?: number | string | null;
  status?: string;
  approved_by_name?: string | null;
  approved_by_role?: string | null;
  updated_at?: string;
  created_at?: string;
}

interface QuestionOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: string;
  options: QuestionOption[];
  correct_option_ids?: string[];
  accepted_answers?: string[];
  explanation?: string | null;
}

// Friendly label for the role that approved (published) the quiz.
const ROLE_LABEL: Record<string, string> = {
  MAIN_ADMIN: "Super Admin",
  SUB_ADMIN: "Sub Admin",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
};
function approverLabel(role?: string | null): string | null {
  if (!role) return null;
  return ROLE_LABEL[role] ?? role;
}

// Only title / grade / description are writable on the quiz serializer — subject
// is derived from the course, duration_minutes/status are managed elsewhere
// (status is driven by the publish/return-to-draft state machine, not PATCH).
type EditableQuiz = Pick<Quiz, "title" | "grade" | "description">;

// Backend serializes status in UPPER_CASE; map it to a friendly Title-case label.
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  REVIEW: "Review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};
function prettyStatus(raw?: string): string {
  if (!raw) return "—";
  return STATUS_LABEL[raw.toUpperCase()] ?? raw;
}

const statusColor: Record<string, string> = {
  Published: "bg-primary/10 text-primary border-primary/20",
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Review: "bg-amber-50 text-amber-700 border-amber-200",
  Archived: "bg-slate-100 text-slate-500 border-slate-200",
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>
  </div>
);

function Skeleton({ className }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded bg-slate-200 ${className ?? ""}`} />;
}

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [form, setForm] = useState<EditableQuiz>({
    title: "", grade: "", description: "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired. Please log in again."); setLoading(false); return; }
    const res = await fetch(`${API_BASE}/quizzes/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { setError("Failed to load quiz. Please try again."); setLoading(false); return; }
    const data: Quiz = await res.json();
    setQuiz(data);
    setForm({
      title: data.title ?? "",
      grade: data.grade ?? data.grade_level ?? "",
      description: data.description ?? "",
    });
    setLoading(false);
  }, [id]);

  const loadQuestions = useCallback(async () => {
    setQuestionsError(null);
    const token = await getToken();
    if (!token) { setQuestionsError("Session expired."); return; }
    const res = await fetch(`${API_BASE}/quizzes/${id}/questions/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { setQuestionsError("Failed to load questions."); return; }
    const data = await res.json();
    setQuestions(Array.isArray(data) ? data : (data?.results ?? []));
  }, [id]);

  useEffect(() => {
    document.title = "Quiz Detail — Skillship";
    load();
    loadQuestions();
  }, [load, loadQuestions]);

  async function save() {
    if (!quiz) return;
    setSaving(true);
    const token = await getToken();
    if (!token) { toast("Session expired.", "error"); setSaving(false); return; }
    const res = await fetch(`${API_BASE}/quizzes/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: form.title,
        grade: form.grade,
        description: form.description,
      }),
    });
    if (!res.ok) {
      toast("Failed to save quiz. Please try again.", "error");
      setSaving(false);
      return;
    }
    const updated: Quiz = await res.json();
    setQuiz(updated);
    setForm({
      title: updated.title ?? "",
      grade: updated.grade ?? updated.grade_level ?? "",
      description: updated.description ?? "",
    });
    toast("Quiz updated", "success");
    setEditing(false);
    setSaving(false);
  }

  const questionCount = quiz ? (quiz.questions_count ?? quiz.question_count ?? 0) : 0;
  const attempts = quiz?.total_attempts ?? null;
  const avgScore = quiz?.avg_score != null
    ? `${Math.round(typeof quiz.avg_score === "number" ? quiz.avg_score : parseFloat(quiz.avg_score as string))}%`
    : "—";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={load} className="text-xs font-semibold text-primary underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          {loading ? (
            <Skeleton className="h-6 w-64" />
          ) : (
            <h1 className="text-xl font-bold text-[var(--foreground)]">{quiz?.title}</h1>
          )}
          <p className="text-xs text-[var(--muted-foreground)]">Quiz ID: {id} · <Link href="/dashboard/admin/quizzes" className="text-primary hover:underline">All Quizzes</Link></p>
        </div>
        <div className="ml-auto flex gap-2">
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} disabled={saving}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-50">Cancel</button>
              <button type="button" onClick={save} disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} disabled={loading}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Edit Quiz</button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Questions", value: loading ? null : String(questionCount) },
          { label: "Attempts", value: loading ? null : (attempts != null ? Number(attempts).toLocaleString("en-IN") : "—") },
          { label: "Avg Score", value: loading ? null : avgScore },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-3 text-center shadow-sm sm:p-5">
            {s.value === null ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-lg font-bold text-primary sm:text-2xl">{s.value}</p>
            )}
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-2/3" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div>
                <p className="font-bold text-[var(--foreground)]">{quiz?.title}</p>
                <div className="mt-1 flex gap-2 flex-wrap">
                  {quiz?.subject && <span className="rounded-full bg-teal-100 text-teal-700 px-2.5 py-0.5 text-xs font-semibold">{quiz.subject}</span>}
                  {(quiz?.grade ?? quiz?.grade_level) && <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-semibold">{quiz?.grade ?? quiz?.grade_level}</span>}
                  {quiz?.status && <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor[prettyStatus(quiz.status)] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{prettyStatus(quiz.status)}</span>}
                  {quiz?.status?.toUpperCase() === "PUBLISHED" && approverLabel(quiz?.approved_by_role) && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      Approved by {approverLabel(quiz?.approved_by_role)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {editing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {(["title", "grade", "description"] as const).map((k) => (
                  <div key={k} className={`flex flex-col gap-1 ${k === "description" ? "sm:col-span-2" : ""}`}>
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{k}</label>
                    {k === "description" ? (
                      <textarea
                        value={form[k] ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                        rows={3}
                        className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                      />
                    ) : (
                      <input value={form[k] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                        className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    )}
                  </div>
                ))}
                <p className="sm:col-span-2 text-xs text-[var(--muted-foreground)]">
                  Subject, status and duration are managed through the quiz workflow (approval / publish) and the question bank — they aren&apos;t edited here.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Subject" value={quiz?.subject ?? ""} />
                <Field label="Grade" value={quiz?.grade ?? quiz?.grade_level ?? ""} />
                <Field label="Duration" value={quiz?.duration_minutes ? `${quiz.duration_minutes} min` : ""} />
                <Field label="School" value={quiz?.school_name ?? (quiz?.school ? "Single school" : "All Schools")} />
                <Field label="Last Updated" value={quiz?.updated_at ? new Date(quiz.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                <Field label="Status" value={prettyStatus(quiz?.status)} />
                {quiz?.status?.toUpperCase() === "PUBLISHED" && approverLabel(quiz?.approved_by_role) && (
                  <Field
                    label="Approved by"
                    value={`${quiz?.approved_by_name ? `${quiz.approved_by_name} · ` : ""}${approverLabel(quiz?.approved_by_role)}`}
                  />
                )}
                {quiz?.description && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Description" value={quiz.description} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Questions */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Questions ({questionCount})</h2>
        {questionsError ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-red-500">{questionsError}</p>
            <button onClick={loadQuestions} className="text-xs font-semibold text-primary underline">Retry</button>
          </div>
        ) : questions === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            This quiz has no questions yet. Build the question set from the quiz wizard.
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, qi) => (
              <div key={q.id} className="rounded-xl bg-[var(--muted)]/40 p-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{qi + 1}. {q.text}</p>
                {q.options && q.options.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {q.options.map((o) => {
                      const correct = q.correct_option_ids?.includes(o.id);
                      return (
                        <li key={o.id} className={`flex items-center gap-2 text-xs ${correct ? "font-semibold text-primary" : "text-[var(--muted-foreground)]"}`}>
                          <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${correct ? "border-primary bg-primary/10" : "border-[var(--border)]"}`}>{o.id}</span>
                          {o.text}
                          {correct && <span className="ml-1 text-[10px] uppercase tracking-wide">✓ correct</span>}
                        </li>
                      );
                    })}
                  </ul>
                ) : q.accepted_answers && q.accepted_answers.length > 0 ? (
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Accepted answers: <span className="font-medium text-primary">{q.accepted_answers.join(", ")}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-xs italic text-[var(--muted-foreground)]">Short-answer question</p>
                )}
                {q.explanation && (
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]"><span className="font-semibold">Explanation:</span> {q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
