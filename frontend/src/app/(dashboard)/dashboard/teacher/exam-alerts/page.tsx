/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/exam-alerts/page.tsx
 * Purpose: Teacher Exam Alerts — schedule an exam (name/date/mode/category) for a
 *          class; students in that class see it on their Exam Alerts page.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";

interface ClassRow { id: string; class_name?: string; grade?: number; section?: string; student_count?: number; }
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
}

const CATEGORIES = [
  { value: "CLASS_TEST", label: "Class Test" },
  { value: "SEMESTER",   label: "Semester Exam" },
  { value: "ENTRANCE",   label: "Entrance Exam" },
  { value: "OTHER",      label: "Other" },
];

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; }
}

export default function TeacherExamAlertsPage() {
  const toast = useToast();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [alerts, setAlerts] = useState<ExamAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CLASS_TEST");
  const [mode, setMode] = useState("PHYSICAL");
  const [examDate, setExamDate] = useState("");
  const [klass, setKlass] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");

  const loadAlerts = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch(`/exam-alerts/`);
      if (!res.ok) { setError(`Failed to load alerts (${res.status})`); setAlerts([]); return; }
      setAlerts(asArray<ExamAlert>(await res.json()));
    } catch { setError("Network error."); setAlerts([]); }
  }, []);

  const loadClasses = useCallback(async () => {
    try {
      const res = await apiFetch(`/academics/classes/`);
      if (res.ok) setClasses(asArray<ClassRow>(await res.json()));
    } catch { /* surfaced via the empty class dropdown */ }
  }, []);

  useEffect(() => { document.title = "Exam Alerts — Skillship"; }, []);
  useEffect(() => { loadAlerts(); loadClasses(); }, [loadAlerts, loadClasses]);

  const canSubmit = title.trim().length > 1 && examDate && klass && !busy;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/exam-alerts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), category, mode, exam_date: examDate,
          klass, venue: venue.trim(), description: description.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? body?.klass ?? `Couldn't create alert (${res.status})`, "error");
        return;
      }
      toast("Exam alert published to the class", "success");
      setTitle(""); setVenue(""); setDescription(""); setExamDate("");
      await loadAlerts();
    } catch { toast("Network error", "error"); }
    finally { setBusy(false); }
  }

  async function remove(a: ExamAlert) {
    const prev = alerts;
    setAlerts((cur) => (cur ?? []).filter((x) => x.id !== a.id));
    try {
      const res = await apiFetch(`/exam-alerts/${a.id}/`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) { setAlerts(prev); toast(`Couldn't delete (${res.status})`, "error"); return; }
      toast("Alert deleted", "success");
    } catch { setAlerts(prev); toast("Network error", "error"); }
  }

  const sorted = useMemo(() => {
    if (!alerts) return null;
    return [...alerts].sort((a, b) => new Date(a.exam_date ?? "").getTime() - new Date(b.exam_date ?? "").getTime());
  }, [alerts]);

  const inputCls = "mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Exam Alerts</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Schedule an exam for a class — students see it on their dashboard.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr]">
        {/* Create form */}
        <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} onSubmit={create} className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
          <h2 className="text-base font-bold text-[var(--foreground)]">New Exam Alert</h2>

          <label className="block">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">Exam name *</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-Term Science Exam" className={inputCls} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Category *</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Mode *</span>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
                <option value="PHYSICAL">Physical</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Exam date *</span>
              <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Class *</span>
              <select value={klass} onChange={(e) => setKlass(e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name ?? `Grade ${c.grade}-${c.section}`}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">{mode === "VIRTUAL" ? "Joining link" : "Venue"} (optional)</span>
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={mode === "VIRTUAL" ? "https://meet…" : "Room 204, Block B"} className={inputCls} />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">Notes (optional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Syllabus, instructions…" className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]" />
          </label>

          {classes.length === 0 && <p className="text-xs text-amber-600">No classes found in your school yet — ask your admin to set up classes first.</p>}

          <button type="submit" disabled={!canSubmit} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Publishing…" : "Publish to class"}
          </button>
        </motion.form>

        {/* List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Scheduled exams {sorted ? `(${sorted.length})` : ""}</h2>
          {sorted === null ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--muted)]/40" />)}</div>
          ) : sorted.length === 0 ? (
            <EmptyState title="No exams scheduled yet" description="Use the form to schedule your first exam for a class." icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>} />
          ) : (
            <ul className="space-y-3">
              {sorted.map((a) => (
                <li key={a.id} className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm dark:bg-[var(--background)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-[var(--foreground)]">{a.title}</h3>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">{a.category_display ?? a.category}</span>
                        <span className="rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">{a.mode_display ?? a.mode}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {fmtDate(a.exam_date)} · {a.class_name ?? "—"}{a.venue ? ` · ${a.venue}` : ""}
                      </p>
                      {a.description && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{a.description}</p>}
                    </div>
                    <button type="button" onClick={() => remove(a)} aria-label="Delete alert" className="shrink-0 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
