/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/exam-alerts/page.tsx
 * Purpose: Student Exam Alerts — read-only list of exams a teacher scheduled for
 *          the student's class (class test / semester / entrance / other).
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage } from "@/providers/LanguageProvider";

interface ExamAlert {
  id: string;
  title: string;
  category?: string;
  category_display?: string;
  mode?: string;
  mode_display?: string;
  exam_date?: string;
  class_name?: string;
  venue?: string;
  description?: string;
  created_by_name?: string;
}

type Filter = "UPCOMING" | "PAST" | "ALL";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const t = new Date(`${iso}T00:00:00`).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

const CATEGORY_TONE: Record<string, string> = {
  CLASS_TEST: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  SEMESTER:   "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  ENTRANCE:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  OTHER:      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export default function ExamAlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<ExamAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("UPCOMING");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch(`/exam-alerts/`);
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

  const filtered = useMemo(() => {
    if (!alerts) return null;
    return alerts
      .filter((a) => {
        const d = daysUntil(a.exam_date);
        if (filter === "UPCOMING") return d == null || d >= 0;
        if (filter === "PAST") return d != null && d < 0;
        return true;
      })
      .sort((a, b) => new Date(a.exam_date ?? "").getTime() - new Date(b.exam_date ?? "").getTime());
  }, [alerts, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{t("Exam Alerts")}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("Exams your teacher has scheduled for your class")}</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-1 w-fit">
        {(["UPCOMING", "PAST", "ALL"] as Filter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${filter === f ? "bg-white shadow-sm text-[var(--foreground)] dark:bg-[var(--background)]" : "text-[var(--muted-foreground)]"}`}>
            {f === "UPCOMING" ? t("Upcoming") : f === "PAST" ? t("Past") : t("All")}
          </button>
        ))}
      </div>

      {filtered === null ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--muted)]/40" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={filter === "PAST" ? t("No past exams") : t("No exams scheduled")}
          description={filter === "PAST" ? t("Completed exams will appear here.") : t("When your teacher schedules a class test, semester or entrance exam, it will show up here with the date and venue.")}
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((a, i) => {
            const days = daysUntil(a.exam_date);
            const urgency = days == null ? null : days < 0 ? "past" : days <= 7 ? "soon" : "later";
            const cat = a.category ?? "OTHER";
            return (
              <motion.li key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.04 * i }} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--foreground)]">{a.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${CATEGORY_TONE[cat] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{a.category_display ?? cat}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${a.mode === "VIRTUAL" ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300" : "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300"}`}>
                        {a.mode_display ?? a.mode ?? "—"}
                      </span>
                    </div>
                    {a.description && <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">{a.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span className="text-[var(--muted-foreground)]">
                        <span className="font-semibold text-[var(--foreground)]">{t("Date:")}</span> {fmtDate(a.exam_date)}
                        {urgency === "soon" && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">{t("in")} {days} {days === 1 ? t("day") : t("days")}</span>}
                        {urgency === "past" && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 dark:bg-slate-500/15 dark:text-slate-300">{t("past")}</span>}
                      </span>
                      {a.venue && (
                        <span className="text-[var(--muted-foreground)]">
                          <span className="font-semibold text-[var(--foreground)]">{a.mode === "VIRTUAL" ? t("Link:") : t("Venue:")}</span>{" "}
                          {a.mode === "VIRTUAL" && /^https?:\/\//.test(a.venue)
                            ? <a href={a.venue} target="_blank" rel="noreferrer" className="text-primary hover:underline">{t("Join")}</a>
                            : a.venue}
                        </span>
                      )}
                      {a.class_name && <span className="text-[var(--muted-foreground)]"><span className="font-semibold text-[var(--foreground)]">{t("Class:")}</span> {a.class_name}</span>}
                    </div>
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
