/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/users/new/[role]/page.tsx
 * Purpose: Sub-admin — create Principal or Teacher.
 *          Real schools list from API. POST /users/ with role pre-bound.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { API_BASE, getToken } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

type RoleSlug = "principal" | "teacher";

const ROLE_MAP: Record<RoleSlug, { backend: "PRINCIPAL" | "TEACHER"; label: string; pretty: string }> = {
  principal: { backend: "PRINCIPAL", label: "Principal",   pretty: "Principal" },
  teacher:   { backend: "TEACHER",   label: "Teacher",     pretty: "Teacher"   },
};

interface School {
  id: string;
  name: string;
  city?: string;
}

export default function CreateUserByRolePage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const toast = useToast();

  const slug = (params?.role as RoleSlug | undefined);
  const role = slug && (slug in ROLE_MAP) ? ROLE_MAP[slug] : null;

  const [schools, setSchools] = useState<School[] | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) document.title = `Create ${role.pretty} — Skillship`;
  }, [role]);

  const loadSchools = useCallback(async () => {
    const token = await getToken();
    if (!token) { setSchools([]); return; }
    try {
      const res = await fetch(`${API_BASE}/schools/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setSchools([]); return; }
      const data = await res.json();
      setSchools(data?.results ?? []);
    } catch {
      setSchools([]);
    }
  }, []);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  if (!role) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Unknown role &quot;{slug}&quot;. <Link href="/dashboard/sub-admin" className="font-semibold underline">Back to dashboard</Link>
      </div>
    );
  }

  function genPassword() {
    const charset = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let out = "";
    const arr = new Uint32Array(12);
    crypto.getRandomValues(arr);
    arr.forEach((n) => { out += charset[n % charset.length]; });
    setPassword(out); setConfirm(out);
  }

  function validate(): string | null {
    if (!first.trim()) return "First name required.";
    if (!last.trim()) return "Last name required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Valid email required.";
    if (!school) return "Pick a school.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!role) return;
    const r = role;
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    const token = await getToken();
    if (!token) { setError("Session expired."); setSaving(false); return; }
    try {
      const res = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: first.trim(),
          last_name: last.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role: r.backend,
          school,
          password,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.detail
          ?? body?.email?.[0]
          ?? body?.password?.[0]
          ?? body?.school?.[0]
          ?? `Failed to create ${r.pretty.toLowerCase()} (${res.status})`;
        setError(typeof msg === "string" ? msg : "Validation error.");
        return;
      }
      toast(`${r.pretty} created`, "success");
      router.push("/dashboard/sub-admin/users");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/sub-admin/users" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          All Users
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">Create {role.pretty}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Provision a new {role.pretty.toLowerCase()} account. They&apos;ll receive login credentials at their email.
        </p>
      </div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
        <div className="space-y-5 p-6 md:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name *">
              <input value={first} onChange={(e) => setFirst(e.target.value)} className={inputCls} autoComplete="given-name" />
            </Field>
            <Field label="Last name *">
              <input value={last} onChange={(e) => setLast(e.target.value)} className={inputCls} autoComplete="family-name" />
            </Field>
          </div>
          <Field label="Email *">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
          </Field>
          <Field label="Phone (optional)">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" className={inputCls} autoComplete="tel" />
          </Field>
          <Field label="School *">
            {schools === null ? (
              <div className="h-10 animate-pulse rounded-xl bg-[var(--muted)]" />
            ) : schools.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                No schools assigned to your territory yet. Add a school first.
              </p>
            ) : (
              <select value={school} onChange={(e) => setSchool(e.target.value)} className={inputCls}>
                <option value="">Select school</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ""}</option>)}
              </select>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password *">
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
            </Field>
            <Field label="Confirm password *">
              <input type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} autoComplete="new-password" />
            </Field>
          </div>
          <div>
            <button type="button" onClick={genPassword} className="text-xs font-semibold text-primary hover:underline">
              Generate secure password
            </button>
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
          <Link href="/dashboard/sub-admin/users" className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary inline-flex items-center dark:bg-[var(--background)]">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || schools === null || schools.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {saving ? "Creating…" : `Create ${role.pretty}`}
          </button>
        </div>
      </motion.form>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</label>
      {children}
    </div>
  );
}
