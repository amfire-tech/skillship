/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/feedback/page.tsx
 * Purpose: Teacher Feedback System — review pending short-answer attempts,
 *          AI-grade them, finalise + send feedback. Real API only.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface Attempt {
  id: string;
  quiz_id?: string;
  quiz_title?: string;
  student_id?: string;
  student_name?: string;
  question_text?: string;
  answer_text?: string;
  expected_answer?: string;
  score?: number;
  ai_score?: number;
  ai_feedback?: string;
  feedback?: string;
  status?: "PENDING" | "REVIEWED" | "FINALISED";
  submitted_at?: string;
}

type Tab = "PENDING" | "REVIEWED" | "FINALISED";

export default function FeedbackSystemPage() {
  const toast = useToast();
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("PENDING");
  const [active, setActive] = useState<Attempt | null>(null);
  const [draftScore, setDraftScore] = useState(0);
  const [draftFeedback, setDraftFeedback] = useState("");
  const [grading, setGrading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setAttempts([]); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/attempts/pending-feedback/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 404) { setAttempts([]); return; }
      if (!res.ok) { setError(`Failed to load attempts (${res.status}).`); setAttempts([]); return; }
      setAttempts(asArray<Attempt>(await res.json()));
    } catch {
      setError("Network error.");
      setAttempts([]);
    }
  }, []);

  useEffect(() => { document.title = "Feedback System — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!attempts) return null;
    return attempts.filter((a) => (a.status ?? "PENDING") === tab);
  }, [attempts, tab]);

  function openAttempt(a: Attempt) {
    setActive(a);
    setDraftScore(a.score ?? a.ai_score ?? 0);
    setDraftFeedback(a.feedback ?? a.ai_feedback ?? "");
  }

  async function aiGrade() {
    if (!active) return;
    setGrading(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setGrading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/grade-short/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          question: active.question_text,
          student_answer: active.answer_text,
          expected_answer: active.expected_answer,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? `AI grading failed (${res.status})`, "error");
        return;
      }
      const data = await res.json();
      const score = typeof data?.score === "number" ? data.score : draftScore;
      const fb = data?.feedback ?? data?.explanation ?? draftFeedback;
      setDraftScore(score);
      setDraftFeedback(fb);
      toast("AI suggestion loaded — review and finalise", "success");
    } catch {
      toast("Network error", "error");
    } finally {
      setGrading(false);
    }
  }

  async function finalize() {
    if (!active) return;
    setSaving(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setSaving(false); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/attempts/${active.id}/feedback/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ score: draftScore, feedback: draftFeedback, status: "FINALISED" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? `Save failed (${res.status})`, "error");
        return;
      }
      setAttempts((prev) => (prev ?? []).map((x) => x.id === active.id ? { ...x, score: draftScore, feedback: draftFeedback, status: "FINALISED" } : x));
      setActive(null);
      toast("Feedback sent to student", "success");
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Feedback System</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Review short-answer submissions, get AI suggestions, send personalised feedback</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-1 w-fit">
        {(["PENDING", "REVIEWED", "FINALISED"] as Tab[]).map((t) => {
          const count = attempts ? attempts.filter((a) => (a.status ?? "PENDING") === t).length : null;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${tab === t ? "bg-white shadow-sm text-[var(--foreground)] dark:bg-[var(--background)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
              {count !== null && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tab === t ? "bg-primary/10 text-primary" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        {filtered === null ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--muted)]/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {tab === "PENDING" ? "No submissions waiting" : tab === "REVIEWED" ? "Nothing in review" : "Nothing finalised yet"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {tab === "PENDING" ? "Short-answer responses appear here as students submit." : "Items move here after action."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {filtered.map((a) => (
              <li key={a.id} className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-[var(--muted)]/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                  {(a.student_name ?? "—").split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{a.student_name ?? "Unknown student"}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{a.quiz_title ?? "—"}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--foreground)]">{a.question_text ?? "—"}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {typeof a.score === "number" && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.score >= 80 ? "bg-emerald-50 text-emerald-700" : a.score >= 65 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                      {Math.round(a.score)}%
                    </span>
                  )}
                  <button type="button" onClick={() => openAttempt(a)} className="inline-flex h-8 items-center gap-1 rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20">
                    {tab === "FINALISED" ? "View" : "Review"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActive(null)} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.22 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] dark:bg-[var(--background)]">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
              <div className="space-y-5 p-6">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">{active.student_name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{active.quiz_title}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Question</p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">{active.question_text ?? "—"}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Student Answer</p>
                  <div className="mt-1 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-3 text-sm">{active.answer_text ?? "—"}</div>
                </div>

                {active.expected_answer && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Expected Answer</p>
                    <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{active.expected_answer}</div>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3">
                  <span aria-hidden="true">✨</span>
                  <button type="button" onClick={aiGrade} disabled={grading || active.status === "FINALISED"} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
                    {grading ? "Asking AI…" : "Get AI suggestion"}
                  </button>
                  <p className="text-xs text-[var(--muted-foreground)]">Calls /quizzes/grade-short/ via Gemini bridge</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Score</p>
                    <input type="number" min={0} max={100} value={draftScore} onChange={(e) => setDraftScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} disabled={active.status === "FINALISED"} className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60 dark:bg-[var(--background)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Feedback</p>
                    <textarea rows={4} value={draftFeedback} onChange={(e) => setDraftFeedback(e.target.value)} disabled={active.status === "FINALISED"} placeholder="Personalised feedback for the student…" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60 dark:bg-[var(--background)]" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
                  <button type="button" onClick={() => setActive(null)} className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary dark:bg-[var(--background)]">Close</button>
                  {active.status !== "FINALISED" && (
                    <button type="button" onClick={finalize} disabled={saving || draftFeedback.trim().length < 5} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:opacity-60">
                      {saving ? "Sending…" : "Send Feedback"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
