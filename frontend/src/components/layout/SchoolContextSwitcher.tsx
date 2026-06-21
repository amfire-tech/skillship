/*
 * File:    frontend/src/components/layout/SchoolContextSwitcher.tsx
 * Purpose: For a Skillship (roaming) teacher only — a banner that lets them pick
 *          which assigned school they're currently working in. Their whole
 *          dashboard is then scoped to that school (via the X-School-Context
 *          header). Renders nothing for a normal teacher (no assignments).
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState } from "react";
import { API_BASE, getToken } from "@/lib/auth";
import { getSchoolContext, setSchoolContext } from "@/lib/schoolContext";

interface MineRow { school: string; school_name: string }

export function SchoolContextSwitcher() {
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [current, setCurrent] = useState<string | null>(getSchoolContext());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/assignments/skillship/mine/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setReady(true); return; }
        const rows: MineRow[] = await res.json();
        if (cancelled) return;
        // De-dupe schools (a teacher may have several assignments per school).
        const seen = new Set<string>();
        const list = rows
          .filter((r) => (seen.has(r.school) ? false : (seen.add(r.school), true)))
          .map((r) => ({ id: r.school, name: r.school_name }));

        if (list.length === 0) {
          // Not a Skillship teacher (or no active access) — clear any stale ctx.
          setSchoolContext(null);
          setReady(true);
          return;
        }
        setSchools(list);
        const ctx = getSchoolContext();
        if (!ctx || !list.some((s) => s.id === ctx)) {
          // First visit / stale context → default to the first school and reload
          // so the dashboard's data refetches scoped to it.
          setSchoolContext(list[0].id);
          window.location.reload();
          return;
        }
        setCurrent(ctx);
        setReady(true);
      } catch {
        setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!ready || schools.length === 0) return null;

  function onChange(id: string) {
    setSchoolContext(id);
    setCurrent(id);
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" /></svg>
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xs font-semibold text-[var(--foreground)]">Skillship teacher — working in:</span>
        <select
          value={current ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-lg border border-[var(--border)] bg-white px-2 text-sm font-semibold text-primary outline-none focus:border-primary dark:bg-[var(--background)]"
        >
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="text-[11px] text-[var(--muted-foreground)]">Switch to act in another assigned school.</span>
      </div>
    </div>
  );
}
