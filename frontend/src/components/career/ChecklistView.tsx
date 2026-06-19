/*
 * File:    frontend/src/components/career/ChecklistView.tsx
 * Purpose: Renders a 30-day day-by-day checklist with progress + completion toggles.
 * Owner:   Pranav
 */

"use client";

import { CATEGORY_STYLE, type Checklist, type ChecklistTask } from "./types";

export function ChecklistView({ checklist, onToggle }: { checklist: Checklist; onToggle: (t: ChecklistTask) => void }) {
  const pct = checklist.total_count ? Math.round((checklist.done_count / checklist.total_count) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-bold text-[var(--foreground)]">{checklist.headline || `Your 30-day plan toward ${checklist.career_title}`}</p>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{checklist.period_start} → {checklist.period_end}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold text-[var(--foreground)]">{checklist.done_count}/{checklist.total_count} · {pct}%</span>
        </div>
      </div>

      <ul className="space-y-2">
        {checklist.tasks.map((t) => (
          <li key={t.id} className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${t.is_done ? "border-emerald-300/50 bg-emerald-50/50 dark:bg-emerald-500/5" : "border-[var(--border)] bg-[var(--muted)]/20"}`}>
            <button
              onClick={() => onToggle(t)}
              aria-pressed={t.is_done}
              aria-label={t.is_done ? "Mark incomplete" : "Mark complete"}
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${t.is_done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--border)] hover:border-primary"}`}
            >
              {t.is_done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-[var(--muted-foreground)]">DAY {t.day_index}</span>
                {t.category && <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${CATEGORY_STYLE[t.category] ?? CATEGORY_STYLE.study}`}>{t.category}</span>}
                <span className="text-[10px] text-[var(--muted-foreground)]">{t.due_date}</span>
              </div>
              <p className={`mt-0.5 text-sm font-medium ${t.is_done ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}>{t.title}</p>
              {t.detail && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{t.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
