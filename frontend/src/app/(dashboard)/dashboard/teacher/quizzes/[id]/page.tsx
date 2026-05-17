/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/quizzes/[id]/page.tsx
 * Purpose: Teacher — quiz detail (read-only) with stats and metadata.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_BASE, apiFetch, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";

interface Quiz {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  grade_level?: string;
  duration_minutes?: number;
  duration?: string;
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
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

interface Assignment {
  id: string;
  student?: string | null;
  klass?: string | null;
  student_name?: string | null;
  class_label?: string | null;
  due_at?: string | null;
  created_at?: string;
}

export default function TeacherQuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired. Please log in again."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load quiz: ${res.status}`);
      const data: Quiz = await res.json();
      setQuiz(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAssignments = useCallback(async () => {
    try {
      const res = await apiFetch(`/quizzes/assignments/?quiz=${id}`);
      if (!res.ok) { setAssignments([]); return; }
      const data = await res.json();
      setAssignments(asArray<Assignment>(data));
    } catch {
      setAssignments([]);
    }
  }, [id]);

  async function revokeAssignment(assignmentId: string) {
    if (!confirm("Revoke this assignment?")) return;
    const res = await apiFetch(`/quizzes/assignments/${assignmentId}/`, { method: "DELETE" });
    if (res.ok) loadAssignments();
  }

  useEffect(() => { document.title = "Quiz — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const questionCount = quiz?.questions_count ?? quiz?.question_count ?? 0;
  const attempts = quiz?.total_attempts ?? null;
  const avgScore = quiz?.avg_score != null ? `${Math.round(Number(quiz.avg_score))}%` : "—";
  const grade = quiz?.grade ?? quiz?.grade_level ?? "—";
  const duration = quiz?.duration_minutes ? `${quiz.duration_minutes} min` : (quiz?.duration ?? "—");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/teacher/quizzes" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            All Quizzes
          </Link>
          {loading ? (
            <div className="mt-2 h-7 w-64 animate-pulse rounded bg-[var(--muted)]" />
          ) : (
            <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{quiz?.title ?? "Untitled Quiz"}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {quiz?.status === "PUBLISHED" && (
            <button
              type="button"
              onClick={() => setAssignModalOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 text-sm font-semibold text-primary hover:bg-primary/15"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></svg>
              Assign
            </button>
          )}
          {quiz && (quiz.status === "DRAFT" || quiz.status === "REVIEW") && (
            <Link
              href={`/dashboard/teacher/quizzes/${id}/edit`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              Edit
            </Link>
          )}
        </div>
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
            <Detail label="Duration" value={duration} />
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

      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Questions ({questionCount})</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Question editor available via the edit page.{" "}
          {quiz && (quiz.status === "DRAFT" || quiz.status === "REVIEW") && (
            <Link href={`/dashboard/teacher/quizzes/${id}/edit`} className="font-medium text-primary hover:underline">Open editor →</Link>
          )}
        </p>
      </div>

      {/* Assignments — visible only for PUBLISHED quizzes since you can't assign drafts. */}
      {quiz?.status === "PUBLISHED" && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Assignments {assignments !== null && <span className="text-[var(--muted-foreground)]">({assignments.length})</span>}
            </h2>
            <button
              type="button"
              onClick={() => setAssignModalOpen(true)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              + Assign to student / class
            </button>
          </div>
          {assignments === null ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--muted)]" />)}
            </div>
          ) : assignments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] py-6 text-center text-sm text-[var(--muted-foreground)]">
              No assignments yet. Click <strong>Assign</strong> above to push this quiz to a student or whole class.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]/60">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {a.student_name ?? a.class_label ?? "—"}
                      <span className="ml-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {a.student ? "STUDENT" : "CLASS"}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {a.due_at ? `Due ${fmt(a.due_at)}` : "No due date"} · Assigned {fmt(a.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeAssignment(a.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <AssignModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        quizId={id}
        onAssigned={() => { setAssignModalOpen(false); loadAssignments(); }}
      />
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


// ─── Assignment modal ────────────────────────────────────────────────────────

interface Student { id: string; first_name?: string; last_name?: string; email?: string; }
interface AClass { id: string; grade?: number; section?: string; academic_year_name?: string; }

function AssignModal({
  open, onClose, quizId, onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  quizId: string;
  onAssigned: () => void;
}) {
  const [target, setTarget] = useState<"student" | "class">("student");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<AClass[]>([]);
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTargets, setLoadingTargets] = useState(true);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    setStudentId("");
    setClassId("");
    setDueAt("");
    setLoadingTargets(true);
    (async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          apiFetch(`/users/?role=STUDENT`),
          apiFetch(`/academics/classes/`),
        ]);
        setStudents(sRes.ok ? asArray<Student>(await sRes.json()) : []);
        setClasses(cRes.ok ? asArray<AClass>(await cRes.json()) : []);
      } catch {
        setStudents([]); setClasses([]);
      } finally {
        setLoadingTargets(false);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (target === "student" && !studentId) { setError("Pick a student."); return; }
    if (target === "class" && !classId) { setError("Pick a class."); return; }
    setBusy(true);
    try {
      const body: Record<string, unknown> = { quiz: quizId };
      if (target === "student") body.student = studentId;
      else body.klass = classId;
      if (dueAt) body.due_at = new Date(dueAt).toISOString();
      const res = await apiFetch(`/quizzes/assignments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = typeof data === "object" && data
          ? (data.detail ?? JSON.stringify(data))
          : `Failed (${res.status})`;
        setError(String(msg));
        return;
      }
      onAssigned();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  function studentLabel(s: Student) {
    const name = [s.first_name, s.last_name].filter(Boolean).join(" ").trim();
    return name ? `${name} · ${s.email ?? ""}` : (s.email ?? s.id);
  }
  function classLabel(c: AClass) {
    return `Grade ${c.grade ?? "?"}-${c.section ?? "?"}${c.academic_year_name ? ` · ${c.academic_year_name}` : ""}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Assign quiz"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] dark:bg-[var(--background)]"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Assign quiz</h3>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Push this quiz to one student or an entire class. Students see it under <em>My Assignments</em>.
            </p>
          </div>

          {/* Target type toggle */}
          <div className="flex gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-1">
            {(["student", "class"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTarget(t)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${target === t ? "bg-white text-[var(--foreground)] shadow-sm dark:bg-[var(--background)]" : "text-[var(--muted-foreground)]"}`}
              >
                {t === "student" ? "Single student" : "Entire class"}
              </button>
            ))}
          </div>

          {target === "student" ? (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Student</span>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={loadingTargets}
                className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
              >
                <option value="">{loadingTargets ? "Loading…" : students.length === 0 ? "No students in this school" : "Pick a student…"}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{studentLabel(s)}</option>)}
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Class</span>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={loadingTargets}
                className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
              >
                <option value="">{loadingTargets ? "Loading…" : classes.length === 0 ? "No classes in this school" : "Pick a class…"}</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c)}</option>)}
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Due (optional)</span>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 break-words">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-full border border-[var(--border)] bg-white px-4 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary dark:bg-[var(--background)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(5,150,105,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Assigning…" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
