/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/teaching-logs/page.tsx
 * Purpose: Super Admin view of Skillship (roaming) teachers' Daily Logs — what
 *          each teacher taught, in which school, on which day. Reads every log
 *          from /assignments/teaching-logs/ (MAIN_ADMIN sees all) with filters
 *          for teacher, school and date. This is the accountability surface for
 *          roaming teachers who visit multiple schools.
 * Owner:   Pranav
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";

interface LogRow {
  id: string;
  teacher: string;
  teacher_name?: string;
  school: string;
  school_name?: string;
  date: string;
  subject: string;
  description: string;
  has_photo?: boolean;
  created_at: string;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function AdminTeachingLogsPage() {
  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [teacher, setTeacher] = useState("");
  const [school, setSchool] = useState("");
  const [date, setDate] = useState("");

  // Lightbox: the proof photo is only on the detail endpoint, so we lazy-fetch
  // it when the admin clicks "View photo" (keeps the list response light).
  const [proof, setProof] = useState<{ id: string; url: string | null; loading: boolean } | null>(null);

  useEffect(() => { document.title = "Teaching Logs — Skillship Admin"; }, []);

  const openProof = useCallback(async (id: string) => {
    setProof({ id, url: null, loading: true });
    const token = await getToken();
    if (!token) { setProof({ id, url: null, loading: false }); return; }
    try {
      const res = await fetch(`${API_BASE}/assignments/teaching-logs/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : {};
      setProof({ id, url: data?.photo || null, loading: false });
    } catch {
      setProof({ id, url: null, loading: false });
    }
  }, []);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/assignments/teaching-logs/?page_size=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.ok ? asArray<LogRow>(await res.json()) : []);
    } catch {
      setLogs([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter dropdown options derived from the loaded data.
  const teachers = useMemo(() => {
    const m = new Map<string, string>();
    (logs ?? []).forEach((l) => { if (l.teacher) m.set(l.teacher, l.teacher_name || "Teacher"); });
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [logs]);

  const schools = useMemo(() => {
    const m = new Map<string, string>();
    (logs ?? []).forEach((l) => { if (l.school) m.set(l.school, l.school_name || "School"); });
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [logs]);

  const filtered = useMemo(() => {
    return (logs ?? []).filter((l) =>
      (!teacher || l.teacher === teacher) &&
      (!school || l.school === school) &&
      (!date || l.date === date)
    );
  }, [logs, teacher, school, date]);

  const todays = useMemo(() => (logs ?? []).filter((l) => l.date === todayISO()).length, [logs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Teaching Logs</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Daily records submitted by Skillship teachers — what they taught, where, and when.
          {logs !== null && <span className="ml-1 font-semibold text-[var(--foreground)]">{todays} submitted today.</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm dark:bg-[var(--background)]">
        <Field label="Teacher">
          <select value={teacher} onChange={(e) => setTeacher(e.target.value)} className="h-10 w-48 rounded-lg border border-[var(--border)] bg-white px-2 text-sm text-[var(--foreground)] outline-none focus:border-primary dark:bg-[var(--background)]">
            <option value="">All teachers</option>
            {teachers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </Field>
        <Field label="School">
          <select value={school} onChange={(e) => setSchool(e.target.value)} className="h-10 w-48 rounded-lg border border-[var(--border)] bg-white px-2 text-sm text-[var(--foreground)] outline-none focus:border-primary dark:bg-[var(--background)]">
            <option value="">All schools</option>
            {schools.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-[var(--border)] bg-white px-2 text-sm text-[var(--foreground)] outline-none focus:border-primary dark:bg-[var(--background)]" />
        </Field>
        {(teacher || school || date) && (
          <button onClick={() => { setTeacher(""); setSchool(""); setDate(""); }} className="h-10 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">
            Clear
          </button>
        )}
      </div>

      {/* Logs */}
      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-sm font-bold tracking-tight text-[var(--foreground)]">
            {logs === null ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`}
          </h2>
        </div>
        <div className="p-4">
          {logs === null ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">No teaching logs match these filters.</div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((l) => (
                <motion.li
                  key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  className="rounded-xl bg-[var(--muted)]/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                        {(l.teacher_name || "T").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">{l.teacher_name || "Teacher"}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{l.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {l.school_name && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{l.school_name}</span>}
                      <span className="text-[var(--muted-foreground)]">{fmtDate(l.date)}</span>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{l.description}</p>
                  {l.has_photo && (
                    <div className="mt-2.5 text-xs font-semibold">
                      <button onClick={() => openProof(l.id)} className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[var(--muted-foreground)] hover:border-primary/40 hover:text-primary dark:bg-[var(--background)]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                        View photo
                      </button>
                    </div>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Proof photo lightbox */}
      {proof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setProof(null)}>
          <div className="max-h-[90vh] max-w-2xl overflow-auto rounded-2xl bg-white p-3 dark:bg-[var(--background)]" onClick={(e) => e.stopPropagation()}>
            {proof.loading ? (
              <div className="flex h-64 w-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
            ) : proof.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proof.url} alt="Attendance proof" className="max-h-[82vh] w-auto rounded-lg" />
            ) : (
              <p className="p-8 text-center text-sm text-[var(--muted-foreground)]">Photo unavailable.</p>
            )}
            <button onClick={() => setProof(null)} className="mt-2 block w-full rounded-lg bg-[var(--muted)] py-2 text-sm font-semibold text-[var(--foreground)]">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</span>
      {children}
    </div>
  );
}
