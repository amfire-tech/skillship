/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/quizzes/[id]/edit/page.tsx
 * Purpose: Teacher — edit existing quiz metadata via PATCH /api/v1/quizzes/:id/
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
  instructions?: string;
  description?: string;
}

const subjects = ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "History", "Geography", "English", "Computer Science", "Hindi"];
const grades = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const statuses = ["DRAFT", "REVIEW", "PUBLISHED"];

export default function TeacherEditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [grade, setGrade] = useState("Class 9");
  const [duration, setDuration] = useState(30);
  const [status, setStatus] = useState("DRAFT");
  const [instructions, setInstructions] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    const res = await fetch(`${API_BASE}/quizzes/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { setError("Failed to load quiz."); setLoading(false); return; }
    const q: Quiz = await res.json();
    setTitle(q.title ?? "");
    setSubject(q.subject ?? "Mathematics");
    setGrade(q.grade ?? q.grade_level ?? "Class 9");
    setDuration(q.duration_minutes ?? 30);
    setStatus(q.status ?? "DRAFT");
    setInstructions(q.instructions ?? q.description ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => { document.title = "Edit Quiz — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 5) {
      toast("Title must be at least 5 characters", "error");
      return;
    }
    setSaving(true);
    const token = await getToken();
    if (!token) { toast("Session expired.", "error"); setSaving(false); return; }
    const res = await fetch(`${API_BASE}/quizzes/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: title.trim(),
        subject,
        grade,
        duration_minutes: duration,
        status,
        instructions: instructions.trim(),
      }),
    });
    if (!res.ok) {
      toast("Failed to save changes", "error");
      setSaving(false);
      return;
    }
    toast("Quiz updated", "success");
    router.push(`/dashboard/teacher/quizzes/${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={`/dashboard/teacher/quizzes/${id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Quiz Detail
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Edit Quiz</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Update metadata and publishing status.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={save} className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />
        <div className="space-y-5 p-6 md:p-8">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-[var(--muted)]" />)}
            </div>
          ) : (
            <>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                    {subjects.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Grade</label>
                  <select value={grade} onChange={(e) => setGrade(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                    {grades.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Duration (min)</label>
                  <input type="number" min={1} max={300} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 0)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                    {statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Instructions</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none resize-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4 md:px-8">
          <Link href={`/dashboard/teacher/quizzes/${id}`} className="inline-flex h-10 items-center rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">Cancel</Link>
          <button type="submit" disabled={loading || saving} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
