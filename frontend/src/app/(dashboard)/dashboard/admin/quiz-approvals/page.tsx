/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/quiz-approvals/page.tsx
 * Purpose: Quiz approval panel — list pending, approve, reject via real API.
 * Owner:   Pranav
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { API_BASE, getToken } from "@/lib/auth";

interface ApprovalItem {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  section?: string;
  created_by_name?: string;
  school_name?: string;
  created_at: string;
  question_count?: number;
  total_questions?: number;
}

interface PreviewQuestion {
  id: string;
  text: string;
  type: string;
  options: { id: string; text: string }[];
  correct_option_ids: string[];
}

export default function QuizApprovalPage() {
  const toast = useToast();
  const [queue, setQueue] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  // Inline question preview so the reviewer can read the quiz before deciding.
  const [openId, setOpenId] = useState<string | null>(null);
  const [previewCache, setPreviewCache] = useState<Record<string, PreviewQuestion[]>>({});
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  const togglePreview = useCallback(async (item: ApprovalItem) => {
    if (openId === item.id) { setOpenId(null); return; }
    setOpenId(item.id);
    if (previewCache[item.id]) return;
    setPreviewLoading(item.id);
    const token = await getToken();
    if (!token) { setPreviewLoading(null); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/${item.id}/questions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      setPreviewCache((c) => ({ ...c, [item.id]: Array.isArray(data) ? data : (data.results ?? []) }));
    } catch {
      setPreviewCache((c) => ({ ...c, [item.id]: [] }));
    } finally {
      setPreviewLoading(null);
    }
  }, [openId, previewCache]);

  useEffect(() => {
    document.title = "Quiz Approvals — Skillship";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = await getToken();
    if (!token) { setFetchError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/quizzes/?status=REVIEW`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setFetchError("Failed to load approval queue."); setLoading(false); return; }
      const data = await res.json();
      setQueue(data.results ?? []);
    } catch {
      setFetchError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(item: ApprovalItem) {
    const token = await getToken();
    if (!token) return;
    try {
      // Status is managed by the quiz state machine, not a writable field — a
      // PATCH of `status` is silently ignored. Approve = the publish transition.
      const res = await fetch(`${API_BASE}/quizzes/${item.id}/publish/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        setQueue((prev) => prev.filter((i) => i.id !== item.id));
        setApprovedCount((n) => n + 1);
        toast("Quiz approved", "success");
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? "Failed to approve quiz", "error");
      }
    } catch {
      toast("Network error", "error");
    }
  }

  async function reject(item: ApprovalItem) {
    const token = await getToken();
    if (!token) return;
    try {
      // Reject = return the quiz to the author as DRAFT (state-machine action).
      const res = await fetch(`${API_BASE}/quizzes/${item.id}/return-to-draft/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        setQueue((prev) => prev.filter((i) => i.id !== item.id));
        setRejectedCount((n) => n + 1);
        toast("Quiz rejected", "info");
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? "Failed to reject quiz", "error");
      }
    } catch {
      toast("Network error", "error");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Approval Panel"
        subtitle={
          loading
            ? "Loading…"
            : `${queue.length} ${queue.length === 1 ? "quiz" : "quizzes"} pending review from teachers and principals`
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Pending Review", value: queue.length.toString(), tone: "text-amber-600", icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          ) },
          { label: "Approved Today", value: approvedCount.toString(), tone: "text-primary", icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          ) },
          { label: "Rejected Today", value: rejectedCount.toString(), tone: "text-red-500", icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
          ) },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
            className="flex items-start justify-between rounded-2xl border border-[var(--border)] bg-white p-4"
          >
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
              <p className={`mt-1.5 text-2xl font-bold ${s.tone}`}>{s.value}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)]/60 ${s.tone}`}>
              {s.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Queue */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-[var(--muted)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--muted)]" />
                </div>
                <div className="flex shrink-0 gap-2">
                  <div className="h-9 w-20 animate-pulse rounded-full bg-[var(--muted)]" />
                  <div className="h-9 w-24 animate-pulse rounded-full bg-[var(--muted)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-white py-16 gap-3">
          <p className="text-sm text-red-500">{fetchError}</p>
          <button onClick={load} className="text-xs font-semibold text-primary underline">Retry</button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {queue.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-white py-16 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">All caught up!</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">No quizzes pending review.</p>
              </motion.div>
            ) : (
              queue.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, scale: 0.97 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 transition-all hover:border-primary/30 md:p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[var(--foreground)]">{item.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                          {item.subject && <span>{item.subject}</span>}
                          {item.subject && item.grade && <span className="h-1 w-1 rounded-full bg-[var(--muted-foreground)]" />}
                          {item.grade && <span>{item.grade}{item.section ? ` · Sec ${item.section}` : ""}</span>}
                          {item.question_count != null && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-[var(--muted-foreground)]" />
                              <span>{item.question_count} questions</span>
                            </>
                          )}
                          <span className="h-1 w-1 rounded-full bg-[var(--muted-foreground)]" />
                          <span>Submitted {new Date(item.created_at).toLocaleDateString("en-IN")}</span>
                        </div>
                        {(item.created_by_name || item.school_name) && (
                          <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                            {item.created_by_name && <span className="font-semibold text-[var(--foreground)]">{item.created_by_name}</span>}
                            {item.created_by_name && item.school_name && " · "}
                            {item.school_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => togglePreview(item)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-4 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        {openId === item.id ? "Hide" : "View"} questions
                      </button>
                      <button
                        onClick={() => reject(item)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approve(item)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)] transition-all hover:-translate-y-0.5"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Approve
                      </button>
                    </div>
                  </div>

                  {/* Inline question preview */}
                  <AnimatePresence initial={false}>
                    {openId === item.id && (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                          {item.description && (
                            <p className="text-xs italic text-[var(--muted-foreground)]">{item.description}</p>
                          )}
                          {previewLoading === item.id ? (
                            <p className="text-xs text-[var(--muted-foreground)]">Loading questions…</p>
                          ) : (previewCache[item.id]?.length ?? 0) === 0 ? (
                            <p className="text-xs text-amber-600">⚠ This quiz has no questions — reject it back to the author.</p>
                          ) : (
                            previewCache[item.id].map((pq, qi) => (
                              <div key={pq.id} className="rounded-xl bg-[var(--muted)]/40 p-3">
                                <p className="text-sm font-semibold text-[var(--foreground)]">{qi + 1}. {pq.text}</p>
                                <ul className="mt-2 space-y-1">
                                  {pq.options.map((o) => {
                                    const correct = pq.correct_option_ids?.includes(o.id);
                                    return (
                                      <li key={o.id} className={`flex items-center gap-2 text-xs ${correct ? "font-semibold text-primary" : "text-[var(--muted-foreground)]"}`}>
                                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${correct ? "border-primary bg-primary/10" : "border-[var(--border)]"}`}>{o.id}</span>
                                        {o.text}
                                        {correct && <span className="ml-1 text-[10px] uppercase tracking-wide">✓ correct</span>}
                                      </li>
                                    );
                                  })}
                                  {pq.options.length === 0 && (
                                    <li className="text-xs italic text-[var(--muted-foreground)]">Short-answer question</li>
                                  )}
                                </ul>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
