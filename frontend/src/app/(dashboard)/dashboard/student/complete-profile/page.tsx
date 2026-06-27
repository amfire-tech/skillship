/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/complete-profile/page.tsx
 * Purpose: Student first-login profile setup. A blank-generated account has no
 *          name/roll/class yet — the student fills those in here exactly ONCE.
 *          School is auto-filled (read-only) from the account. On submit the
 *          backend enrols them into the class and LOCKS the profile; only the
 *          Super Admin can change it afterward. Drives: /auth/complete-profile/.
 *          Always rendered in English regardless of any saved language
 *          preference — this runs on shared school devices before the new
 *          student has made any choice of their own, so a prior student's
 *          stored locale must never leak into this form.
 * Owner:   Pranav
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";

export default function CompleteProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [roll, setRoll] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schoolLabel = useMemo(() => user?.school_name?.trim() || "Your school", [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!first.trim()) return setError("Please enter your name.");
    if (!roll.trim()) return setError("Please enter your roll number.");
    const g = Number(grade);
    if (!Number.isInteger(g) || g < 1 || g > 12) return setError("Enter your class (1–12).");
    if (!section.trim()) return setError("Please enter your section.");

    setSaving(true);
    try {
      const res = await apiFetch("/auth/complete-profile/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: first.trim(),
          last_name: last.trim(),
          admission_number: roll.trim(),
          grade: g,
          section: section.trim().toUpperCase(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.detail ?? body?.non_field_errors?.[0] ?? `Could not save (${res.status}).`);
        return;
      }
      const updated = (await res.json()) as User;
      setUser(updated);
      router.replace("/dashboard/student");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3.5 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]";
  const labelCls = "text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]";

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.3)] dark:bg-[var(--background)]"
      >
        <div className="h-1.5 w-full" style={{ backgroundImage: "var(--gradient-brand)" }} />
        <form onSubmit={submit} className="space-y-5 p-7">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Set up your profile</h1>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
              Welcome to Skillship! Fill in your details to get started.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            You can only set this <span className="font-semibold">once</span>. After you save, your details
            are locked — only your school admin can change them. Please check them carefully.
          </div>

          {/* School — auto-filled, read-only */}
          <div className="grid gap-1.5">
            <span className={labelCls}>School</span>
            <div className="flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 px-3.5 text-sm font-medium text-[var(--foreground)]">
              {schoolLabel}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className={labelCls}>First name *</span>
              <input value={first} onChange={(e) => setFirst(e.target.value)} className={inputCls} autoFocus />
            </label>
            <label className="grid gap-1.5">
              <span className={labelCls}>Last name</span>
              <input value={last} onChange={(e) => setLast(e.target.value)} className={inputCls} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1.5">
              <span className={labelCls}>Roll no *</span>
              <input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="e.g. 23" className={inputCls} />
            </label>
            <label className="grid gap-1.5">
              <span className={labelCls}>Class *</span>
              <input
                type="number" min={1} max={12} value={grade}
                onChange={(e) => setGrade(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 6" className={inputCls}
              />
            </label>
            <label className="grid gap-1.5">
              <span className={labelCls}>Section *</span>
              <input
                value={section}
                onChange={(e) => setSection(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="e.g. A" className={inputCls}
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit" disabled={saving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(243,156,50,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            {saving ? "Saving…" : "Save & continue"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
