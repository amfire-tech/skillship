/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/skillship-teachers/page.tsx
 * Purpose: Super-admin management of Skillship (roaming) teachers — assign one
 *          to a school (+ optional class) with visit days, see their active
 *          assignments, and revoke/restore access at any time.
 * Owner:   Pranav
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";

interface Teacher { id: string; first_name: string; last_name: string; email: string; teacher_type?: string }
interface SchoolOpt { id: string; name: string }
interface ClassOpt { id: string; grade: number; section: string; school: string }
interface Assignment {
  id: string;
  teacher: string;
  school: string; school_name: string;
  klass: string | null; klass_label: string;
  is_active: boolean;
  date_from: string | null; date_to: string | null;
  weekdays: number[]; specific_dates: string[]; note: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fullName = (t: Teacher) => [t.first_name, t.last_name].filter(Boolean).join(" ") || t.email;

export default function SkillshipTeachersPage() {
  const toast = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<SchoolOpt[]>([]);
  const [classes, setClasses] = useState<ClassOpt[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // New-assignment form
  const [teacher, setTeacher] = useState("");
  const [school, setSchool] = useState("");
  const [klass, setKlass] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [specificDates, setSpecificDates] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { document.title = "Skillship Teachers — Skillship"; }, []);

  const headers = useCallback(async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : undefined;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const h = await headers();
    if (!h) { setLoading(false); return; }
    try {
      const [tRes, sRes, cRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/users/?role=TEACHER`, { headers: h }),
        fetch(`${API_BASE}/schools/`, { headers: h }),
        fetch(`${API_BASE}/academics/classes/`, { headers: h }),
        fetch(`${API_BASE}/assignments/skillship/`, { headers: h }),
      ]);
      const allTeachers = tRes.ok ? asArray<Teacher>(await tRes.json()) : [];
      setTeachers(allTeachers.filter((t) => t.teacher_type === "SKILLSHIP"));
      if (sRes.ok) setSchools(asArray<SchoolOpt>(await sRes.json()));
      if (cRes.ok) setClasses(asArray<ClassOpt>(await cRes.json()));
      if (aRes.ok) setAssignments(asArray<Assignment>(await aRes.json()));
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  function toggleWeekday(d: number) {
    setWeekdays((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d].sort()));
  }

  async function createAssignment() {
    setError(null);
    if (!teacher) { setError("Pick a Skillship teacher."); return; }
    if (!school) { setError("Pick a school."); return; }
    setSaving(true);
    const h = await headers();
    if (!h) { setSaving(false); return; }
    const dates = specificDates.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      const res = await fetch(`${API_BASE}/assignments/skillship/`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          teacher, school, klass: klass || null,
          weekdays, specific_dates: dates,
          date_from: dateFrom || null, date_to: dateTo || null, note,
        }),
      });
      if (res.ok) {
        toast("Skillship teacher assigned", "success");
        setKlass(""); setWeekdays([]); setDateFrom(""); setDateTo(""); setSpecificDates(""); setNote("");
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(Object.values(data).flat().join(" ") || "Failed to assign.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(id: string, active: boolean) {
    const h = await headers();
    if (!h) return;
    const res = await fetch(`${API_BASE}/assignments/skillship/${id}/${active ? "reactivate" : "revoke"}/`, { method: "POST", headers: h });
    if (res.ok) {
      toast(active ? "Access restored" : "Access revoked", active ? "success" : "info");
      setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: active } : a)));
    } else {
      toast("Failed to update access", "error");
    }
  }

  const classesForSchool = classes.filter((c) => c.school === school);
  const inputCls = "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]";

  return (
    <div className="space-y-6">
      <PageHeader title="Skillship Teachers" subtitle="Assign roaming Skillship teachers to schools & classes, with visit days. Revoke access anytime." />

      {/* Assign form */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />
        <div className="space-y-4 p-6">
          <p className="text-sm font-semibold text-[var(--foreground)]">New assignment</p>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {teachers.length === 0 && !loading && (
            <p className="text-xs text-[var(--muted-foreground)]">No Skillship teachers yet. Create one from User Management → New Teacher → Skillship Teacher.</p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Skillship teacher</span>
              <select value={teacher} onChange={(e) => setTeacher(e.target.value)} className={inputCls}>
                <option value="">— Select —</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{fullName(t)}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">School</span>
              <select value={school} onChange={(e) => { setSchool(e.target.value); setKlass(""); }} className={inputCls}>
                <option value="">— Select —</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Class (optional)</span>
              <select value={klass} onChange={(e) => setKlass(e.target.value)} className={inputCls} disabled={!school}>
                <option value="">— Whole school —</option>
                {classesForSchool.map((c) => <option key={c.id} value={c.id}>Grade {c.grade}-{c.section}</option>)}
              </select>
            </label>
          </div>

          {/* Visit days */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Recurring weekdays</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((w, i) => (
                  <button key={w} type="button" onClick={() => toggleWeekday(i)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${weekdays.includes(i) ? "border-primary bg-primary/10 text-primary" : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-primary/30"}`}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-[var(--muted-foreground)]">From</span>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-[var(--muted-foreground)]">To</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
              </label>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Specific dates (comma-separated)</span>
              <input value={specificDates} onChange={(e) => setSpecificDates(e.target.value)} placeholder="2026-07-01, 2026-07-08" className={inputCls} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Note</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Robotics workshop" className={inputCls} />
            </label>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={createAssignment} disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white hover:-translate-y-0.5 transition-all disabled:opacity-70">
              {saving ? "Assigning…" : "Assign to school"}
            </button>
          </div>
        </div>
      </div>

      {/* Existing assignments */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="border-b border-[var(--border)] p-5">
          <h3 className="text-base font-bold text-[var(--foreground)]">Assignments</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Active assignments grant the teacher access to that school. Revoke to pull it.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-5 py-3">Teacher</th>
                <th className="px-5 py-3">School</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Days</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {!loading && assignments.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-[var(--muted-foreground)]">No assignments yet.</td></tr>
              )}
              {assignments.map((a) => {
                const t = teachers.find((x) => x.id === a.teacher);
                const days = [
                  a.weekdays?.map((d) => WEEKDAYS[d]).join(", "),
                  a.specific_dates?.length ? `${a.specific_dates.length} date${a.specific_dates.length === 1 ? "" : "s"}` : "",
                ].filter(Boolean).join(" · ") || "—";
                return (
                  <tr key={a.id} className="border-b border-[var(--border)]/60 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">{t ? fullName(t) : a.teacher.slice(0, 8)}</td>
                    <td className="px-5 py-3.5">{a.school_name}</td>
                    <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{a.klass_label || "Whole school"}</td>
                    <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{days}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"}`}>
                        {a.is_active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {a.is_active ? (
                        <button type="button" onClick={() => setActive(a.id, false)} className="text-xs font-semibold text-red-500 hover:underline">Revoke</button>
                      ) : (
                        <button type="button" onClick={() => setActive(a.id, true)} className="text-xs font-semibold text-primary hover:underline">Restore</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
