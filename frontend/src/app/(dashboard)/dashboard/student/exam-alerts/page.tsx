/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/exam-alerts/page.tsx
 * Purpose: Student Exam Alerts — upcoming exams, deadlines, subscription toggles.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";

interface ExamAlert {
  id: string;
  title: string;
  exam_type?: string;
  category?: string;
  date?: string;
  registration_deadline?: string;
  url?: string;
  description?: string;
  subscribed?: boolean;
}

type Filter = "ALL" | "UPCOMING" | "SUBSCRIBED";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

const TYPE_TONE: Record<string, string> = {
  Engineering: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Medical:     "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  Commerce:    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  General:     "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

export default function ExamAlertsPage() {
  const toast = useToast();
  const [alerts, setAlerts] = useState<ExamAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("UPCOMING");

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setAlerts([]); return; }
    try {
      const res = await fetch(`${API_BASE}/exam-alerts/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 404) { setAlerts([]); return; }
      if (!res.ok) { setError(`Failed (${res.status})`); setAlerts([]); return; }
      setAlerts(asArray<ExamAlert>(await res.json()));
    } catch {
      setError("Network error.");
      setAlerts([]);
    }
  }, []);

  useEffect(() => { document.title = "Exam Alerts — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(a: ExamAlert) {
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); return; }
    const next = !a.subscribed;
    setAlerts((cur) => (cur ?? []).map((x) => x.id === a.id ? { ...x, subscribed: next } : x));
    try {
      const res = await fetch(`${API_BASE}/exam-alerts/${a.id}/${next ? "subscribe" : "unsubscribe"}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // revert
        setAlerts((cur) => (cur ?? []).map((x) => x.id === a.id ? { ...x, subscribed: !next } : x));
        toast(`Couldn't ${next ? "subscribe" : "unsubscribe"} (${res.status})`, "error");
        return;
      }
      toast(next ? "Subscribed — you'll receive email reminders" : "Unsubscribed", "success");
    } catch {
      setAlerts((cur) => (cur ?? []).map((x) => x.id === a.id ? { ...x, subscribed: !next } : x));
      toast("Network error", "error");
    }
  }

  const filtered = useMemo(() => {
    if (!alerts) return null;
    return alerts.filter((a) => {
      if (filter === "SUBSCRIBED") return a.subscribed;
      if (filter === "UPCOMING") {
        const d = daysUntil(a.date);
        return d == null || d >= 0;
      }
      return true;
    }).sort((a, b) => new Date(a.date ?? "").getTime() - new Date(b.date ?? "").getTime());
  }, [alerts, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Exam Alerts</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">JEE, NEET, CUET and more — never miss a registration deadline</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-1 w-fit">
        {(["UPCOMING", "SUBSCRIBED", "ALL"] as Filter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${filter === f ? "bg-white shadow-sm text-[var(--foreground)] dark:bg-[var(--background)]" : "text-[var(--muted-foreground)]"}`}>
            {f === "UPCOMING" ? "Upcoming" : f === "SUBSCRIBED" ? "My Subscriptions" : "All"}
          </button>
        ))}
      </div>

      {filtered === null ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--muted)]/40" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No alerts in this view"
          description={filter === "SUBSCRIBED" ? "Subscribe to exams from the Upcoming list to get email reminders." : "Check back once admissions open — JEE, NEET, CUET and more will appear here."}
          action={filter === "SUBSCRIBED" ? { label: "Browse upcoming", onClick: () => setFilter("UPCOMING") } : undefined}
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((a, i) => {
            const days = daysUntil(a.date);
            const urgency = days == null ? null : days < 0 ? "past" : days <= 7 ? "soon" : "later";
            return (
              <motion.li key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.04 * i }} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--foreground)]">{a.title}</h3>
                      {a.exam_type && <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${TYPE_TONE[a.exam_type] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{a.exam_type}</span>}
                    </div>
                    {a.description && <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">{a.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span className="text-[var(--muted-foreground)]">
                        <span className="font-semibold text-[var(--foreground)]">Exam:</span> {fmtDate(a.date)}
                        {urgency === "soon" && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">in {days} day{days === 1 ? "" : "s"}</span>}
                        {urgency === "past" && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 dark:bg-slate-500/15 dark:text-slate-300">past</span>}
                      </span>
                      {a.registration_deadline && (
                        <span className="text-[var(--muted-foreground)]"><span className="font-semibold text-[var(--foreground)]">Reg. deadline:</span> {fmtDate(a.registration_deadline)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => toggle(a)}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all ${
                        a.subscribed
                          ? "border border-primary/30 bg-primary/10 text-primary"
                          : "bg-gradient-to-r from-primary to-accent text-white shadow-sm hover:-translate-y-0.5"
                      }`}
                    >
                      {a.subscribed ? "✓ Subscribed" : "Subscribe"}
                    </button>
                    {a.url && <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Official site →</a>}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
