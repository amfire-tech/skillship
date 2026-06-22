/*
 * File:    frontend/src/components/teacher/TeachingScheduleCard.tsx
 * Purpose: Skillship (roaming) teacher's home schedule — "where do I teach
 *          today / this week". Reads the super-admin-set visit schedule from
 *          /assignments/skillship/mine/ (weekdays + specific dates per assigned
 *          school) and highlights which school(s) are scheduled for today.
 *          Renders nothing for a normal teacher (no skillship assignments).
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";

interface MineRow {
  id: string;
  school: string;
  school_name: string;
  klass_label?: string;
  weekdays?: number[];        // Mon=0 … Sun=6 (matches backend / Python weekday)
  specific_dates?: string[];  // ISO "YYYY-MM-DD"
  date_from?: string | null;
  date_to?: string | null;
  note?: string;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// JS getDay() is Sun=0…Sat=6; backend weekdays are Mon=0…Sun=6.
function pyWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function withinRange(row: MineRow, isoToday: string): boolean {
  if (row.date_from && isoToday < row.date_from) return false;
  if (row.date_to && isoToday > row.date_to) return false;
  return true;
}

function isToday(row: MineRow, today: Date, isoToday: string): boolean {
  if (!withinRange(row, isoToday)) return false;
  const wd = pyWeekday(today);
  if ((row.weekdays ?? []).includes(wd)) return true;
  if ((row.specific_dates ?? []).includes(isoToday)) return true;
  return false;
}

function fmtSpecific(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

export function TeachingScheduleCard() {
  const [rows, setRows] = useState<MineRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) { setRows([]); return; }
      try {
        const res = await fetch(`${API_BASE}/assignments/skillship/mine/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.ok ? await res.json() : [];
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Normal teacher (no assignments) → render nothing at all.
  if (rows !== null && rows.length === 0) return null;

  const today = new Date();
  const isoToday = isoLocal(today);
  const todaysSchools = (rows ?? []).filter((r) => isToday(r, today, isoToday));
  const todayLabel = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
          </span>
          <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">My Teaching Schedule</h2>
        </div>
        <span className="text-xs font-medium text-[var(--muted-foreground)]">{todayLabel}</span>
      </div>

      <div className="space-y-4 p-5">
        {/* Today banner */}
        {rows === null ? (
          <div className="h-12 animate-pulse rounded-xl bg-[var(--muted)]/40" />
        ) : todaysSchools.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <span className="text-sm font-semibold text-primary">Today you teach at:</span>
            {todaysSchools.map((r) => (
              <span key={r.id} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                {r.school_name}{r.klass_label ? ` · ${r.klass_label}` : ""}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/20 px-4 py-3 text-sm text-[var(--muted-foreground)]">
            No school scheduled for today. Enjoy the day off — or check your upcoming visits below.
          </div>
        )}

        {/* Per-school schedule, as set by the Super Admin */}
        {rows !== null && (
          <ul className="space-y-2">
            {rows.map((r) => {
              const today = isToday(r, new Date(), isoToday);
              const upcoming = (r.specific_dates ?? [])
                .filter((d) => d >= isoToday)
                .sort()
                .slice(0, 3);
              return (
                <li
                  key={r.id}
                  className={`rounded-xl p-4 ${today ? "bg-primary/5 ring-1 ring-primary/30" : "bg-[var(--muted)]/30"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {r.school_name}{r.klass_label ? ` · ${r.klass_label}` : ""}
                    </p>
                    {today && <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Today</span>}
                  </div>

                  {/* Recurring weekdays */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {WEEKDAY_LABELS.map((lbl, i) => {
                      const on = (r.weekdays ?? []).includes(i);
                      return (
                        <span
                          key={lbl}
                          className={`inline-flex h-6 w-9 items-center justify-center rounded-md text-[11px] font-semibold ${
                            on ? "bg-primary/15 text-primary" : "bg-[var(--muted)] text-[var(--muted-foreground)]/50"
                          }`}
                        >
                          {lbl}
                        </span>
                      );
                    })}
                    {(r.weekdays ?? []).length === 0 && (r.specific_dates ?? []).length === 0 && (
                      <span className="text-xs text-[var(--muted-foreground)]">No fixed days set yet</span>
                    )}
                  </div>

                  {/* Upcoming ad-hoc dates + admin note */}
                  {upcoming.length > 0 && (
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      Upcoming visits: <span className="font-medium text-[var(--foreground)]">{upcoming.map(fmtSpecific).join(", ")}</span>
                    </p>
                  )}
                  {r.note && <p className="mt-1 text-xs italic text-[var(--muted-foreground)]">“{r.note}”</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
