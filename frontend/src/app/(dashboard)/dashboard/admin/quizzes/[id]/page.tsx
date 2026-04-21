"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

const STUB = {
  title: "Photosynthesis — Light Reactions",
  subject: "Biology",
  grade: "Class 10",
  questions: 20,
  attempts: "1,840",
  avgScore: "78%",
  status: "Published" as "Published" | "Draft" | "Review",
  updated: "2h ago",
  duration: "30 min",
  school: "All Schools",
  description: "Covers light-dependent reactions, photosystems I & II, and ATP synthesis.",
};

const statusOptions = ["Published", "Draft", "Review"] as const;

const statusColor: Record<string, string> = {
  Published: "bg-primary/10 text-primary border-primary/20",
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Review: "bg-amber-50 text-amber-700 border-amber-200",
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>
  </div>
);

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [quiz, setQuiz] = useState({ ...STUB });
  const [editing, setEditing] = useState(false);

  function save() {
    // TODO: PATCH /api/v1/quizzes/{id}/
    toast("Quiz updated", "success");
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{quiz.title}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Quiz ID: {id} · <Link href="/dashboard/admin/quizzes" className="text-primary hover:underline">All Quizzes</Link></p>
        </div>
        <div className="ml-auto flex gap-2">
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={save}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save</button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Edit Quiz</button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Questions", value: quiz.questions },
          { label: "Attempts", value: quiz.attempts },
          { label: "Avg Score", value: quiz.avgScore },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <p className="font-bold text-[var(--foreground)]">{quiz.title}</p>
            <div className="mt-1 flex gap-2 flex-wrap">
              <span className="rounded-full bg-teal-100 text-teal-700 px-2.5 py-0.5 text-[11px] font-semibold">{quiz.subject}</span>
              <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-[11px] font-semibold">{quiz.grade}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColor[quiz.status]}`}>{quiz.status}</span>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["title", "subject", "grade", "duration", "description"] as const).map((k) => (
              <div key={k} className={`flex flex-col gap-1 ${k === "description" ? "sm:col-span-2" : ""}`}>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{k}</label>
                {k === "description" ? (
                  <textarea
                    value={quiz[k]}
                    onChange={(e) => setQuiz((q) => ({ ...q, [k]: e.target.value }))}
                    rows={3}
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                  />
                ) : (
                  <input value={quiz[k] as string} onChange={(e) => setQuiz((q) => ({ ...q, [k]: e.target.value }))}
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                )}
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Status</label>
              <select value={quiz.status} onChange={(e) => setQuiz((q) => ({ ...q, status: e.target.value as typeof quiz.status }))}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                {statusOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Subject" value={quiz.subject} />
            <Field label="Grade" value={quiz.grade} />
            <Field label="Duration" value={quiz.duration} />
            <Field label="School" value={quiz.school} />
            <Field label="Last Updated" value={quiz.updated} />
            <Field label="Status" value={quiz.status} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Description" value={quiz.description} />
            </div>
          </div>
        )}
      </div>

      {/* Questions placeholder */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-[var(--foreground)]">Questions ({quiz.questions})</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Question editor available after backend connects — GET /api/v1/quizzes/{id}/questions/</p>
      </div>
    </div>
  );
}
