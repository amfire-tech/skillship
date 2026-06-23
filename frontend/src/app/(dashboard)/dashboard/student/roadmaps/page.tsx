/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/roadmaps/page.tsx
 * Purpose: Saved Roadmaps — the student's saved career roadmaps. View one in full,
 *          and from here create the 30-day daily plan (which lands in My Daily
 *          Planner). The checklist is only ever created from this screen.
 * Owner:   Pranav
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { RoadmapView } from "@/components/career/RoadmapView";
import type { CareerProfile, Quota, RoadmapDetail, SavedRoadmap } from "@/components/career/types";
import { useLanguage } from "@/providers/LanguageProvider";

export default function SavedRoadmapsPage() {
  const toast = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<SavedRoadmap[] | null>(null);
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [checklistQuota, setChecklistQuota] = useState<Quota | null>(null);
  const [hasPlan, setHasPlan] = useState(false);

  const [open, setOpen] = useState<SavedRoadmap | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = "Saved Roadmaps — Skillship"; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, pRes, cRes] = await Promise.all([
        apiFetch(`/career/roadmaps/`),
        apiFetch(`/career/profile/`),
        apiFetch(`/career/checklist/`),
      ]);
      if (rRes.ok) { const d = await rRes.json(); setSaved(d.results ?? []); }
      if (pRes.ok) { const p = await pRes.json(); setProfile(p.profile); setChecklistQuota(p.quota?.checklists ?? null); }
      if (cRes.ok) { const c = await cRes.json(); setHasPlan(!!c.checklist); }
    } catch { /* per-action */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function createPlan(rm: SavedRoadmap) {
    if (busy) return;
    setBusy(true);
    try {
      // Committing this roadmap as the objective is required before a plan.
      if (profile?.career_slug !== rm.career_slug) {
        const o = await apiFetch(`/career/objective/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roadmap_id: rm.id }) });
        if (!o.ok) { const d = await o.json().catch(() => ({})); toast(d?.detail ?? "Couldn't set objective", "error"); return; }
        const od = await o.json(); setProfile(od.profile);
      }
      const c = await apiFetch(`/career/checklist/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const cd = await c.json().catch(() => ({}));
      if (!c.ok) { toast(cd?.detail ?? `Couldn't create plan (${c.status})`, "error"); return; }
      toast(t("Your 30-day plan is ready 🚀"), "success");
      router.push("/dashboard/student/planner");
    } catch { toast("Network error", "error"); } finally { setBusy(false); }
  }

  const checklistExhausted = !!checklistQuota && checklistQuota.used >= checklistQuota.limit;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">{t("Saved Roadmaps")}</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{t("Your saved career roadmaps. Open one to create your 30-day daily plan.")}</p>
        </div>
        {checklistQuota && <span className="text-[11px] text-[var(--muted-foreground)]">{t("Plans:")} <b className="text-[var(--foreground)]">{checklistQuota.used}/{checklistQuota.limit}</b> {t("this month")}</span>}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>
      ) : open ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm dark:bg-[var(--background)]">
          <RoadmapView
            roadmap={open.roadmap as RoadmapDetail}
            onBack={() => setOpen(null)}
            footer={
              (open.is_objective || profile?.career_slug === open.career_slug) && hasPlan ? (
                <Link href="/dashboard/student/planner" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white">{t("View my planner")} →</Link>
              ) : (
                <>
                  <button onClick={() => createPlan(open)} disabled={busy || checklistExhausted} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {busy ? t("Creating…") : checklistExhausted ? t("Plan already used this month") : t("Create my 30-day plan")}
                  </button>
                  {checklistExhausted && <span className="self-center text-xs text-[var(--muted-foreground)]">{t("One 30-day plan per month.")}</span>}
                </>
              )
            }
          />
        </div>
      ) : saved && saved.length > 0 ? (
        <ul className="space-y-2">
          {saved.map((s) => (
            <li key={s.id}>
              <button onClick={() => setOpen(s)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/30 dark:bg-[var(--background)]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-[var(--foreground)]">{s.career_title}</p>
                    {(s.is_objective || s.career_slug === profile?.career_slug) && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{t("Objective")}</span>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{t("Grade")} {s.grade} · {s.board} · {t("saved")} {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-primary">{t("Open")} →</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">{t("You haven't saved any roadmaps yet.")}</p>
          <Link href="/dashboard/student/career" className="mt-3 inline-flex h-9 items-center rounded-full bg-gradient-to-r from-primary to-accent px-5 text-xs font-semibold text-white">{t("Build a roadmap in AI Career Pilot")}</Link>
        </div>
      )}
    </motion.div>
  );
}
