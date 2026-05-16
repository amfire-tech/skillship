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
  subject?: string;
  grade?: string;
  created_by_name?: string;
  school_name?: string;
  created_at: string;
  question_count?: number;
}

export default function QuizApprovalPage() {
  const toast = useToast();
  const [queue, setQueue] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

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
      const res = await fetch(`${API_BASE}/quizzes/${item.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      if (res.ok) {
        setQueue((prev) => prev.filter((i) => i.id !== item.id));
        setApprovedCount((n) => n + 1);
        toast("Quiz approved", "success");
      } else {
        toast("Failed to approve quiz", "error");
      }
    } catch {
      toast("Network error", "error");
    }
  }

  async function reject(item: ApprovalItem) {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/quizzes/${item.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
      });
      if (res.ok) {
        setQueue((prev) => prev.filter((i) => i.id !== item.id));
        setRejectedCount((n) => n + 1);
        toast("Quiz rejected", "info");
      } else {
        toast("Failed to reject quiz", "error");
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
                          {item.grade && <span>{item.grade}</span>}
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
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
