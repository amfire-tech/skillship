/*
 * File:    frontend/src/components/layout/SubAdminSchoolSwitcher.tsx
 * Purpose: For a sub-admin — a banner that lets them pick which granted school
 *          they're currently working in. The whole dashboard (nav + data) then
 *          scopes to that school via the X-School-Context header. Loads the
 *          territory once into the shared access store. Renders nothing until
 *          grants are known; if a sub-admin has no active grants it shows a
 *          "no access yet" hint instead of a dead dropdown.
 * Owner:   Pranav
 */

"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/auth";
import { useSubAdminAccess, type SubAdminGrant } from "@/store/subAdminAccess";

export function SubAdminSchoolSwitcher() {
  const grants = useSubAdminAccess((s) => s.grants);
  const current = useSubAdminAccess((s) => s.current);
  const loaded = useSubAdminAccess((s) => s.loaded);
  const setGrants = useSubAdminAccess((s) => s.setGrants);
  const setCurrent = useSubAdminAccess((s) => s.setCurrent);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/assignments/subadmin-grants/my-access/`);
        if (!res.ok) { if (!cancelled) setGrants([]); return; }
        const rows: SubAdminGrant[] = await res.json();
        if (cancelled) return;
        const before = current;
        setGrants(rows);
        // If selecting a default school changed the active context, reload so
        // every page refetches scoped to it (mirrors the Skillship switcher).
        const after = useSubAdminAccess.getState().current;
        if (after && after !== before) window.location.reload();
      } catch {
        if (!cancelled) setGrants([]);
      }
    })();
    return () => { cancelled = true; };
    // Load once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) return null;

  if (!grants || grants.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-2.5 dark:bg-amber-500/10">
        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
          No school access yet — ask the super admin to grant you a school.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" /></svg>
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xs font-semibold text-[var(--foreground)]">Sub admin — working in:</span>
        <select
          value={current ?? ""}
          onChange={(e) => { setCurrent(e.target.value); window.location.reload(); }}
          className="h-8 rounded-lg border border-[var(--border)] bg-white px-2 text-sm font-semibold text-primary outline-none focus:border-primary dark:bg-[var(--background)]"
        >
          {grants.map((g) => <option key={g.school} value={g.school}>{g.school_name}</option>)}
        </select>
        <span className="text-[11px] text-[var(--muted-foreground)]">Switch to act in another granted school.</span>
      </div>
    </div>
  );
}
