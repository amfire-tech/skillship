/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/planner/page.tsx
 * Purpose: My Daily Planner — the student's 30-day day-by-day plan with completion
 *          tracking. Created from a saved roadmap (Saved Roadmaps page).
 * Owner:   Pranav
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { ChecklistView } from "@/components/career/ChecklistView";
import type { Checklist, ChecklistTask } from "@/components/career/types";
import { useLanguage } from "@/providers/LanguageProvider";

export default function PlannerPage() {
  const toast = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<Checklist | null>(null);

  useEffect(() => { document.title = "My Daily Planner — Skillship"; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/career/checklist/`);
      if (res.ok) { const d = await res.json(); setChecklist(d.checklist ?? null); }
    } catch { /* per-action */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggleTask(task: ChecklistTask) {
    setChecklist((c) => c ? {
      ...c,
      tasks: c.tasks.map((t) => t.id === task.id ? { ...t, is_done: !t.is_done } : t),
      done_count: c.done_count + (task.is_done ? -1 : 1),
    } : c);
    const res = await apiFetch(`/career/tasks/${task.id}/`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_done: !task.is_done }) });
    if (!res.ok) { toast(t("Couldn't update task"), "error"); load(); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">{t("My Daily Planner")}</h1>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{t("Your day-by-day plan toward your career objective. Tick off each day as you go.")}</p>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>
      ) : checklist ? (
        <ChecklistView checklist={checklist} onToggle={toggleTask} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">{t("You don't have a daily plan yet.")}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t("Open a saved roadmap and create your 30-day plan.")}</p>
          <Link href="/dashboard/student/roadmaps" className="mt-3 inline-flex h-9 items-center rounded-full bg-gradient-to-r from-primary to-accent px-5 text-xs font-semibold text-white">{t("Go to Saved Roadmaps")}</Link>
        </div>
      )}
    </motion.div>
  );
}
