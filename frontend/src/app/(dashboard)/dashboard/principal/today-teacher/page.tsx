/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/today-teacher/page.tsx
 * Purpose: Principal — "Today's Teacher". Shows which Skillship (roaming)
 *          teacher(s) are scheduled to visit THIS school today — name, id,
 *          class, subject and photo — so front-desk/reception can recognise
 *          an unfamiliar teacher walking in. Backed by
 *          GET /assignments/skillship/today/, which already filters to the
 *          principal's own school and today's weekday/date.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";

interface TodayTeacher {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_photo: string | null;
  klass_label: string;
  subject: string;
  note: string;
}

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export default function TodayTeacherPage() {
  const [rows, setRows] = useState<TodayTeacher[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { document.title = "Today's Teacher — Skillship"; }, []);

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/assignments/skillship/today/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setRows([]);
        setError("Could not load today's teachers.");
        return;
      }
      setRows(asArray<TodayTeacher>(await res.json()));
    } catch {
      setRows([]);
      setError("Network error.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Today's Teacher</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Skillship (roaming) teachers scheduled to visit your school today — {todayLabel}.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-500/10">{error}</p>}

      {rows === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-[var(--muted)]/40" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No Skillship teacher scheduled today"
          description="Check back on a day a roaming teacher is due to visit, or contact the Super Admin if you expected someone."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />
              <div className="flex items-center gap-4 p-5">
                {r.teacher_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.teacher_photo} alt={r.teacher_name} className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {initials(r.teacher_name) || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--foreground)]">{r.teacher_name}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">ID: {r.teacher_id.slice(0, 8)}</p>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-[var(--border)] px-5 py-4 text-sm">
                <p className="flex justify-between gap-2 text-[var(--muted-foreground)]">
                  <span>Class</span>
                  <span className="font-semibold text-[var(--foreground)]">{r.klass_label || "Whole school"}</span>
                </p>
                <p className="flex justify-between gap-2 text-[var(--muted-foreground)]">
                  <span>Subject</span>
                  <span className="font-semibold text-[var(--foreground)]">{r.subject || "—"}</span>
                </p>
                {r.note && <p className="pt-1 text-xs italic text-[var(--muted-foreground)]">“{r.note}”</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
