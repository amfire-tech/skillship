/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/students/page.tsx
 * Purpose: Principal — Student Management. Add, bulk upload, search, class/section filters.
 *          Real API: /users/?role=STUDENT, POST /users/.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  admission_number?: string;
  roll_number?: string;
  grade?: string;
  class_id?: string;
  class_name?: string;
  section?: string;
  quizzes_attempted?: number;
  avg_score?: number;
  career_path?: string;
}

interface AcademicClass {
  id: string;
  name?: string;
  class_name?: string;
}

const CAREER_TINT: Record<string, string> = {
  Engineering: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Medical:     "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  Computing:   "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  Robotics:    "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  Arts:        "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  Business:    "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function ScoreBar({ value }: { value?: number }) {
  if (typeof value !== "number") return <span className="text-xs text-[var(--muted-foreground)]">—</span>;
  const tone = value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-amber-500" : "bg-red-500";
  const text = value >= 80 ? "text-emerald-600" : value >= 65 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--muted)]">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className={`text-xs font-semibold ${text}`}>{Math.round(value)}%</span>
    </div>
  );
}

export default function StudentManagementPage() {
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [students, setStudents] = useState<Student[] | null>(null);
  const [classes, setClasses] = useState<AcademicClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [sectionFilter, setSectionFilter] = useState<string>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setStudents([]); return; }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [stRes, clRes] = await Promise.all([
        fetch(`${API_BASE}/users/?role=STUDENT`, { headers }),
        fetch(`${API_BASE}/academics/classes/`, { headers }),
      ]);
      if (!stRes.ok) { setError(`Failed to load students (${stRes.status}).`); setStudents([]); return; }
      setStudents(asArray<Student>(await stRes.json()));
      setClasses(clRes.ok ? asArray<AcademicClass>(await clRes.json()) : []);
    } catch {
      setError("Network error.");
      setStudents([]);
    }
  }, []);

  useEffect(() => { document.title = "Student Management — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  async function handleBulkUpload(file: File) {
    setUploading(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setUploading(false); return; }
    const form = new FormData();
    form.append("file", file);
    form.append("role", "STUDENT");
    try {
      const res = await fetch(`${API_BASE}/users/bulk-upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? `Upload failed (${res.status})`, "error");
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast(`Imported ${data?.created ?? "students"} successfully`, "success");
      await load();
    } catch {
      toast("Network error during upload", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteStudent(s: Student) {
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); return; }
    try {
      const res = await fetch(`${API_BASE}/users/${s.id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok && res.status !== 204) { toast("Failed to remove student", "error"); return; }
      setStudents((prev) => (prev ?? []).filter((x) => x.id !== s.id));
      toast("Student removed", "success");
    } catch {
      toast("Network error", "error");
    } finally {
      setConfirmDelete(null);
    }
  }

  // Build distinct class/section options from real data
  const classOptions = useMemo(() => {
    if (!students) return [];
    return Array.from(new Set(students.map((s) => s.class_name ?? s.grade).filter(Boolean))) as string[];
  }, [students]);
  const sectionOptions = useMemo(() => {
    if (!students) return [];
    return Array.from(new Set(students.map((s) => s.section).filter(Boolean))) as string[];
  }, [students]);

  const filtered = useMemo(() => {
    if (!students) return null;
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || (s.email ?? "").toLowerCase().includes(q);
      const cls = s.class_name ?? s.grade ?? "";
      const matchClass = classFilter === "ALL" || cls === classFilter;
      const matchSection = sectionFilter === "ALL" || (s.section ?? "") === sectionFilter;
      return matchSearch && matchClass && matchSection;
    });
  }, [students, search, classFilter, sectionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Students</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {students === null ? "Loading…" : `${students.length} student${students.length === 1 ? "" : "s"} registered`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBulkUpload(f); }} />
          <button
            type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] hover:border-primary/40 hover:text-primary disabled:opacity-60 dark:bg-[var(--background)]"
          >
            <UploadIcon />{uploading ? "Uploading…" : "Bulk Upload CSV"}
          </button>
          <button
            type="button" onClick={() => setShowAdd(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] hover:-translate-y-0.5"
          >
            <PlusIcon />Add Student
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm dark:bg-[var(--background)]">
        <div className="relative min-w-[260px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"><SearchIcon /></span>
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name…"
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:focus:bg-[var(--background)]"
          />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
          <option value="ALL">All Classes</option>
          {classOptions.map((c) => <option key={c}>{c}</option>)}
          {classOptions.length === 0 && classes?.map((c) => <option key={c.id}>{c.class_name ?? c.name}</option>)}
        </select>
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
          <option value="ALL">All Sections</option>
          {sectionOptions.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {filtered === null ? "—" : `${filtered.length} student${filtered.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Section</th>
                <th className="px-6 py-3">Roll No.</th>
                <th className="px-6 py-3">Quizzes Attempted</th>
                <th className="px-6 py-3">Avg Score</th>
                <th className="px-6 py-3">Career Path</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered === null ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-6 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8">
                  <EmptyState
                    title={students?.length === 0 ? "No students yet" : "No students match"}
                    description={students?.length === 0 ? "Add students one-by-one or upload a CSV — they'll appear here with class assignments and performance trends." : "Try clearing filters or search."}
                    action={students?.length === 0 ? { label: "Add Student", onClick: () => setShowAdd(true) } : undefined}
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                  />
                </td></tr>
              ) : (
                filtered.map((s) => {
                  const fullName = `${s.first_name} ${s.last_name}`.trim() || s.email;
                  return (
                    <tr key={s.id} className="group border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">{initials(fullName)}</div>
                          <span className="font-medium text-[var(--foreground)]">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.class_name ?? s.grade ?? "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.section ? `Section ${s.section}` : "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.roll_number ?? s.admission_number ?? "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{s.quizzes_attempted ?? "—"}</td>
                      <td className="px-6 py-3.5"><ScoreBar value={s.avg_score} /></td>
                      <td className="px-6 py-3.5">
                        {s.career_path
                          ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CAREER_TINT[s.career_path] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{s.career_path}</span>
                          : <span className="text-xs text-[var(--muted-foreground)]">—</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <button type="button" onClick={() => router.push(`/dashboard/principal/students?focus=${s.id}`)} aria-label="View" className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-primary/10 hover:text-primary">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          </button>
                          <button type="button" onClick={() => setEditTarget(s)} aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-primary/10 hover:text-primary">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                          </button>
                          <button type="button" onClick={() => setConfirmDelete(s)} aria-label="Remove" className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 6 1 14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L21 6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="3" y1="6" x2="21" y2="6" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && <AddStudentModal classes={classes ?? []} onClose={() => setShowAdd(false)} onCreated={async () => { setShowAdd(false); toast("Student added", "success"); await load(); }} />}
        {editTarget && <EditStudentModal student={editTarget} classes={classes ?? []} onClose={() => setEditTarget(null)} onSaved={async () => { setEditTarget(null); toast("Student updated", "success"); await load(); }} />}
        {confirmDelete && (
          <ConfirmDialog
            title="Remove student?"
            message={<>Remove <span className="font-semibold text-[var(--foreground)]">{`${confirmDelete.first_name} ${confirmDelete.last_name}`.trim()}</span>? This cannot be undone.</>}
            confirmLabel="Remove"
            onConfirm={() => deleteStudent(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Add Student Modal ──────────────────────────────────────────────────
function AddStudentModal({ classes, onClose, onCreated }: { classes: AcademicClass[]; onClose: () => void; onCreated: () => Promise<void> }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [roll, setRoll] = useState("");
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  function genPassword() {
    const cs = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const buf = new Uint32Array(12); crypto.getRandomValues(buf);
    let out = ""; buf.forEach((n) => { out += cs[n % cs.length]; });
    setPassword(out);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!first.trim() || !last.trim()) { setError("Name required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Valid email required."); return; }
    if (password.length < 8) { setError("Password ≥ 8 chars."); return; }
    setSaving(true);
    const token = await getToken();
    if (!token) { setError("Session expired."); setSaving(false); return; }
    try {
      const res = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: first.trim(), last_name: last.trim(), email: email.trim(),
          role: "STUDENT", password,
          roll_number: roll.trim() || undefined,
          class_id: classId || undefined,
          section: section.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.detail ?? body?.email?.[0] ?? body?.password?.[0] ?? `Failed (${res.status})`);
        return;
      }
      await onCreated();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.22 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)]">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
        <form onSubmit={submit} className="space-y-4 p-6">
          <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Add Student</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name *"><input value={first} onChange={(e) => setFirst(e.target.value)} className={inputCls} /></Field>
            <Field label="Last name *"><input value={last} onChange={(e) => setLast(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Email *"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Roll No."><input value={roll} onChange={(e) => setRoll(e.target.value)} className={inputCls} /></Field>
            <Field label="Class">
              {classes.length === 0 ? (
                <input className={inputCls} disabled placeholder="No classes yet" />
              ) : (
                <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name ?? c.name}</option>)}
                </select>
              )}
            </Field>
            <Field label="Section"><input value={section} onChange={(e) => setSection(e.target.value)} placeholder="A" className={inputCls} /></Field>
          </div>
          <Field label="Password *"><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></Field>
          <button type="button" onClick={genPassword} className="text-xs font-semibold text-primary hover:underline">Generate secure password</button>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <button type="button" onClick={onClose} className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:opacity-60">{saving ? "Creating…" : "Add Student"}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Edit Student Modal ────────────────────────────────────────────────
function EditStudentModal({ student, classes, onClose, onSaved }: { student: Student; classes: AcademicClass[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [first, setFirst] = useState(student.first_name ?? "");
  const [last, setLast] = useState(student.last_name ?? "");
  const [email, setEmail] = useState(student.email ?? "");
  const [roll, setRoll] = useState(student.roll_number ?? "");
  const [section, setSection] = useState(student.section ?? "");
  const [active, setActive] = useState(student.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!first.trim() || !last.trim()) { setError("Name required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Valid email required."); return; }
    setSaving(true);
    const token = await getToken();
    if (!token) { setError("Session expired."); setSaving(false); return; }
    try {
      const res = await fetch(`${API_BASE}/users/${student.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: first.trim(),
          last_name: last.trim(),
          email: email.trim(),
          roll_number: roll.trim() || null,
          section: section.trim() || null,
          is_active: active,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.detail ?? body?.email?.[0] ?? `Failed (${res.status})`);
        return;
      }
      await onSaved();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.22 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)]">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
        <form onSubmit={submit} className="space-y-4 p-6">
          <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Edit Student</h3>
          <p className="-mt-2 text-xs text-[var(--muted-foreground)]">{student.first_name} {student.last_name} · {classes.find((c) => c.id === student.class_id)?.class_name ?? student.class_name ?? "—"}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name *"><input value={first} onChange={(e) => setFirst(e.target.value)} className={inputCls} /></Field>
            <Field label="Last name *"><input value={last} onChange={(e) => setLast(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Email *"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Roll No."><input value={roll} onChange={(e) => setRoll(e.target.value)} className={inputCls} /></Field>
            <Field label="Section"><input value={section} onChange={(e) => setSection(e.target.value)} placeholder="A" className={inputCls} /></Field>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-[var(--border)] text-primary focus:ring-2 focus:ring-primary/30" />
            <span className="text-sm">
              <span className="font-semibold text-[var(--foreground)]">Active</span>
              <span className="ml-2 text-xs text-[var(--muted-foreground)]">— Inactive students cannot log in.</span>
            </span>
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <button type="button" onClick={onClose} className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Confirm Dialog ─────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: { title: string; message: React.ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m3 6 1 14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L21 6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
        </div>
        <h3 className="mt-4 text-base font-bold text-[var(--foreground)]">{title}</h3>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{message}</p>
        <div className="mt-5 flex items-center gap-3">
          <button onClick={onCancel} className="flex-1 h-10 rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">Cancel</button>
          <button onClick={onConfirm} className="flex-1 h-10 rounded-full bg-red-500 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-red-600">{confirmLabel}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const inputCls = "w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</label>{children}</div>;
}

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>; }
function UploadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>; }
function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>; }
