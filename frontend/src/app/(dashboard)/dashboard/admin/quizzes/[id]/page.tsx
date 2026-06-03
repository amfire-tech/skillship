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
  duration?: string;
  description?: string;
  school?: string | null;
  questions_count?: number;
  question_count?: number;
  total_attempts?: number;
  avg_score?: number | string | null;
  status?: "Published" | "Draft" | "Review" | string;
  updated_at?: string;
  created_at?: string;
}

type EditableQuiz = Pick<Quiz, "title" | "subject" | "grade" | "duration" | "description" | "status">;

const statusOptions = ["Published", "Draft", "Review"] as const;

const statusColor: Record<string, string> = {
  Published: "bg-primary/10 text-primary border-primary/20",
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Review: "bg-amber-50 text-amber-700 border-amber-200",
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
    title: "", subject: "", grade: "", duration: "", description: "", status: "Draft",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired. Please log in again."); setLoading(false); return; }
    const res = await fetch(`${API_BASE}/quizzes/quizzes/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { setError("Failed to load quiz. Please try again."); setLoading(false); return; }
    const data: Quiz = await res.json();
    setQuiz(data);
    setForm({
      title: data.title ?? "",
      subject: data.subject ?? "",
      grade: data.grade ?? data.grade_level ?? "",
      duration: data.duration ?? "",
      description: data.description ?? "",
      status: data.status ?? "Draft",
    });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    document.title = "Quiz Detail — Skillship";
    load();
  }, [load]);

  async function save() {
    if (!quiz) return;
    setSaving(true);
    const token = await getToken();
    if (!token) { toast("Session expired.", "error"); setSaving(false); return; }
    const res = await fetch(`${API_BASE}/quizzes/quizzes/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: form.title,
        subject: form.subject,
        grade: form.grade,
        duration: form.duration,
        description: form.description,
        status: form.status,
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
      subject: updated.subject ?? "",
      grade: updated.grade ?? updated.grade_level ?? "",
      duration: updated.duration ?? "",
      description: updated.description ?? "",
      status: updated.status ?? "Draft",
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
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Questions", value: loading ? null : String(questionCount) },
          { label: "Attempts", value: loading ? null : (attempts != null ? Number(attempts).toLocaleString("en-IN") : "—") },
          { label: "Avg Score", value: loading ? null : avgScore },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-5 text-center shadow-sm">
            {s.value === null ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : (
              <p className="text-2xl font-bold text-primary">{s.value}</p>
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
                  {quiz?.status && <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor[quiz.status] ?? ""}`}>{quiz.status}</span>}
                </div>
              </div>
            </div>

            {editing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {(["title", "subject", "grade", "duration", "description"] as const).map((k) => (
                  <div key={k} className={`flex flex-col gap-1 ${k === "description" ? "sm:col-span-2" : ""}`}>
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{k}</label>
                    {k === "description" ? (
                      <textarea
                        value={form[k]}
                        onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                        rows={3}
                        className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                      />
                    ) : (
                      <input value={form[k] as string} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                        className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    )}
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Status</label>
                  <select value={form.status ?? "Draft"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))}
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                    {statusOptions.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Subject" value={quiz?.subject ?? ""} />
                <Field label="Grade" value={quiz?.grade ?? quiz?.grade_level ?? ""} />
                <Field label="Duration" value={quiz?.duration ?? ""} />
                <Field label="School" value={quiz?.school ? String(quiz.school) : "All Schools"} />
                <Field label="Last Updated" value={quiz?.updated_at ? new Date(quiz.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                <Field label="Status" value={quiz?.status ?? ""} />
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

      {/* Questions placeholder */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Questions ({questionCount})</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Question editor available — GET /api/v1/quizzes/quizzes/{id}/questions/</p>
      </div>
    </div>
  );
}
