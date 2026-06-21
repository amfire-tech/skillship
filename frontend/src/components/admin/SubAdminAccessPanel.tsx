/*
 * File:    frontend/src/components/admin/SubAdminAccessPanel.tsx
 * Purpose: Super-admin control for a sub-admin's per-school access. Lists every
 *          school with four capability toggles (manage / onboard students /
 *          onboard teachers / approve quizzes). Toggling upserts a grant via
 *          /assignments/subadmin-grants/; clearing every box on a school revokes
 *          it (is_active=false). This is the surface that decides exactly what
 *          the sub-admin sees and can do, school by school.
 * Owner:   Pranav
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

interface SchoolRow { id: string; name: string }

interface Caps {
  can_manage_school: boolean;
  can_onboard_students: boolean;
  can_onboard_teachers: boolean;
  can_approve_quizzes: boolean;
}

const CAP_FIELDS: { key: keyof Caps; label: string }[] = [
  { key: "can_manage_school", label: "School mgmt" },
  { key: "can_onboard_students", label: "Onboard students" },
  { key: "can_onboard_teachers", label: "Onboard teachers" },
  { key: "can_approve_quizzes", label: "Approve quizzes" },
];

const EMPTY: Caps = {
  can_manage_school: false,
  can_onboard_students: false,
  can_onboard_teachers: false,
  can_approve_quizzes: false,
};

function anyOn(c: Caps): boolean {
  return c.can_manage_school || c.can_onboard_students || c.can_onboard_teachers || c.can_approve_quizzes;
}

export function SubAdminAccessPanel({ subadminId }: { subadminId: string }) {
  const toast = useToast();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [caps, setCaps] = useState<Record<string, Caps>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, gRes] = await Promise.all([
        apiFetch(`/schools/?page_size=200`),
        apiFetch(`/assignments/subadmin-grants/?subadmin=${subadminId}`),
      ]);
      const sData = sRes.ok ? await sRes.json() : null;
      const gData = gRes.ok ? await gRes.json() : null;
      const schoolList: SchoolRow[] = (sData?.results ?? sData ?? []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }));
      const grantRows = gData?.results ?? gData ?? [];
      const map: Record<string, Caps> = {};
      for (const g of grantRows) {
        // A revoked (is_active=false) grant reads as no access.
        map[g.school] = g.is_active
          ? {
              can_manage_school: g.can_manage_school,
              can_onboard_students: g.can_onboard_students,
              can_onboard_teachers: g.can_onboard_teachers,
              can_approve_quizzes: g.can_approve_quizzes,
            }
          : { ...EMPTY };
      }
      setSchools(schoolList);
      setCaps(map);
    } catch {
      toast("Couldn't load school access", "error");
    } finally {
      setLoading(false);
    }
  }, [subadminId, toast]);

  useEffect(() => { load(); }, [load]);

  async function toggle(schoolId: string, key: keyof Caps) {
    const next: Caps = { ...(caps[schoolId] ?? EMPTY), [key]: !(caps[schoolId]?.[key]) };
    setCaps((c) => ({ ...c, [schoolId]: next }));
    setSaving(schoolId);
    try {
      const res = await apiFetch(`/assignments/subadmin-grants/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subadmin: subadminId, school: schoolId, ...next, is_active: anyOn(next) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as Record<string, unknown>));
        const detail =
          (typeof body.detail === "string" && body.detail) ||
          (Array.isArray(body.subadmin) && body.subadmin[0]) ||
          (Array.isArray(body.school) && body.school[0]) ||
          `Couldn't update access (${res.status})`;
        toast(String(detail), "error");
        load(); // resync from server on failure
        return;
      }
      toast(anyOn(next) ? "Access updated" : "Access removed for this school", anyOn(next) ? "success" : "info");
    } catch {
      toast("Network error", "error");
      load();
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-base font-bold text-[var(--foreground)]">School Access &amp; Permissions</h2>
      </div>
      <p className="mb-4 text-xs text-[var(--muted-foreground)]">
        Grant this sub-admin a territory of schools and choose, per school, exactly what they can do.
        Clearing every box removes their access to that school.
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}
        </div>
      ) : schools.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">No schools yet — create a school first.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-3 py-2">School</th>
                {CAP_FIELDS.map((c) => <th key={c.key} className="px-3 py-2 text-center">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => {
                const c = caps[s.id] ?? EMPTY;
                const granted = anyOn(c);
                return (
                  <tr key={s.id} className="border-b border-[var(--border)]/60 last:border-0">
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-[var(--foreground)]">{s.name}</span>
                      {granted && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">granted</span>}
                      {saving === s.id && <span className="ml-2 text-[10px] text-[var(--muted-foreground)]">saving…</span>}
                    </td>
                    {CAP_FIELDS.map((f) => (
                      <td key={f.key} className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={c[f.key]}
                          onChange={() => toggle(s.id, f.key)}
                          className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
                          aria-label={`${f.label} for ${s.name}`}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
