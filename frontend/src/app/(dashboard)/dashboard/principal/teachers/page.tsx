/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/teachers/page.tsx
 * Purpose: Principal — Teachers Management. Add teacher, list, search, status filter.
 *          Real API: /users/?role=TEACHER, POST /users/ for new.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  date_joined?: string;
  last_login?: string;
  classes_count?: number;
  quizzes_count?: number;
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export default function TeachersManagementPage() {
  const toast = useToast();
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setTeachers([]); return; }
    try {
      const res = await fetch(`${API_BASE}/users/?role=TEACHER`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setError(`Failed to load teachers (${res.status}).`); setTeachers([]); return; }
      setTeachers(asArray<Teacher>(await res.json()));
    } catch {
      setError("Network error.");
      setTeachers([]);
    }
  }, []);

  useEffect(() => { document.title = "Teachers Management — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  async function handleBulkUpload(file: File) {
    setUploading(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setUploading(false); return; }
    const form = new FormData();
    form.append("file", file);
    form.append("role", "TEACHER");
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
      toast(`Imported ${data?.created ?? "teachers"} successfully`, "success");
      await load();
    } catch {
      toast("Network error during upload", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function toggleActive(t: Teacher) {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/users/${t.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !t.is_active }),
      });
      if (!res.ok) { toast("Failed to update status", "error"); return; }
      setTeachers((prev) => (prev ?? []).map((x) => x.id === t.id ? { ...x, is_active: !x.is_active } : x));
      toast(`Teacher ${!t.is_active ? "activated" : "deactivated"}`, "success");
    } catch {
      toast("Network error", "error");
    }
  }

  const filtered = useMemo(() => {
    if (!teachers) return null;
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      const name = `${t.first_name} ${t.last_name}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || t.email.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? t.is_active : !t.is_active);
      return matchSearch && matchStatus;
    });
  }, [teachers, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Teachers</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {teachers === null ? "Loading…" : `${teachers.length} teacher${teachers.length === 1 ? "" : "s"} registered`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef} type="file" accept=".csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBulkUpload(f); }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60 dark:bg-[var(--background)]"
          >
            <UploadIcon />
            {uploading ? "Uploading…" : "Bulk Upload CSV"}
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            <PlusIcon />
            Add Teacher
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm dark:bg-[var(--background)]">
        <div className="relative min-w-[240px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"><SearchIcon /></span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:focus:bg-[var(--background)]"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <th className="px-6 py-3">Teacher</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered === null ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/60 last:border-0">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-3.5"><div className="h-4 animate-pulse rounded bg-[var(--muted)]" style={{ width: `${50 + ((i * 7 + j * 11) % 40)}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8">
                  <EmptyState
                    title={teachers?.length === 0 ? "No teachers yet" : "No teachers match"}
                    description={teachers?.length === 0 ? "Add your first teacher manually or import a CSV — they'll appear here with login credentials and class assignments." : "Try clearing the filters or search."}
                    action={teachers?.length === 0 ? { label: "Add Teacher", onClick: () => setShowAdd(true) } : undefined}
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>}
                  />
                </td></tr>
              ) : (
                filtered.map((t) => {
                  const fullName = `${t.first_name} ${t.last_name}`.trim() || t.email;
                  return (
                    <tr key={t.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                            {initials(fullName)}
                          </div>
                          <span className="font-medium text-[var(--foreground)]">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{t.email}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{t.phone ?? "—"}</td>
                      <td className="px-6 py-3.5 text-[var(--muted-foreground)]">{t.date_joined ? new Date(t.date_joined).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                      <td className="px-6 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-500"}`}>
                          {t.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-3 text-xs">
                          <button type="button" onClick={() => toggleActive(t)} className="font-semibold text-[var(--muted-foreground)] hover:text-primary">
                            {t.is_active ? "Deactivate" : "Activate"}
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
        {showAdd && (
          <AddTeacherModal
            onClose={() => setShowAdd(false)}
            onCreated={async () => { setShowAdd(false); toast("Teacher added", "success"); await load(); }}
          />
        )}
      </AnimatePresence>

      <p className="text-xs text-[var(--muted-foreground)]">
        Looking to give a teacher a different role? <Link href="/dashboard/principal" className="font-semibold text-primary hover:underline">Back to overview</Link>
      </p>
    </div>
  );
}

// ─── Add Teacher Modal ──────────────────────────────────────────────────
function AddTeacherModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    const buf = new Uint32Array(12);
    crypto.getRandomValues(buf);
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
        body: JSON.stringify({ first_name: first.trim(), last_name: last.trim(), email: email.trim(), phone: phone.trim() || undefined, role: "TEACHER", password }),
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
          <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Add Teacher</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name *"><input value={first} onChange={(e) => setFirst(e.target.value)} className={inputCls} autoComplete="given-name" /></Field>
            <Field label="Last name *"><input value={last} onChange={(e) => setLast(e.target.value)} className={inputCls} autoComplete="family-name" /></Field>
          </div>
          <Field label="Email *"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" /></Field>
          <Field label="Phone (optional)"><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></Field>
          <Field label="Password *"><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" /></Field>
          <button type="button" onClick={genPassword} className="text-xs font-semibold text-primary hover:underline">Generate secure password</button>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
            <button type="button" onClick={onClose} className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:opacity-60">{saving ? "Creating…" : "Add Teacher"}</button>
          </div>
        </form>
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
