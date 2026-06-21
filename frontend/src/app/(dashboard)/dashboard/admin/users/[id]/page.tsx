"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { API_BASE, getToken } from "@/lib/auth";
import { SubAdminAccessPanel } from "@/components/admin/SubAdminAccessPanel";

interface ApiUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  school: string | null;
  school_name: string | null;
  teacher_type?: string;
  phone: string | null;
  admission_number: string | null;
  current_class: string | null;
  current_class_id: string | null;
  assigned_teacher: string | null;
  assigned_teacher_name: string | null;
  profile_completed?: boolean;
  is_active: boolean;
  date_joined: string;
}

interface TeacherOpt { id: string; name: string }
interface ClassOpt { id: string; name: string }

const roleColors: Record<string, string> = {
  MAIN_ADMIN: "bg-violet-100 text-violet-700",
  SUB_ADMIN: "bg-amber-100 text-amber-700",
  PRINCIPAL: "bg-teal-100 text-teal-700",
  TEACHER: "bg-primary/10 text-primary",
  STUDENT: "bg-blue-100 text-blue-700",
};

const roleLabels: Record<string, string> = {
  MAIN_ADMIN: "Super Admin",
  SUB_ADMIN: "Sub Admin",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>
  </div>
);

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", admission_number: "", assigned_teacher: "", klass: "", teacher_type: "SCHOOL", school: "" });
  const [teachers, setTeachers] = useState<TeacherOpt[]>([]);
  const [classes, setClasses] = useState<ClassOpt[]>([]);
  const [allSchools, setAllSchools] = useState<{ id: string; name: string }[]>([]);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = await getToken();
    if (!token) { setFetchError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/users/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setFetchError(res.status === 404 ? "User not found." : "Failed to load user."); setLoading(false); return; }
      const data: ApiUser = await res.json();
      setUser(data);
      setForm({ first_name: data.first_name, last_name: data.last_name, email: data.email, phone: data.phone ?? "", admission_number: data.admission_number ?? "", assigned_teacher: data.assigned_teacher ?? "", klass: data.current_class_id ?? "", teacher_type: data.teacher_type ?? "SCHOOL", school: data.school ?? "" });
      // For teachers, load the schools list so the admin can move them / set type.
      if (data.role === "TEACHER") {
        try {
          const sRes = await fetch(`${API_BASE}/schools/?page_size=200`, { headers: { Authorization: `Bearer ${token}` } });
          if (sRes.ok) { const sd = await sRes.json(); setAllSchools((sd.results ?? sd ?? []).map((s: any) => ({ id: s.id, name: s.name }))); }
        } catch { /* leave empty */ }
      }
      // For students, load their school's teachers + classes for the dropdowns.
      if (data.role === "STUDENT" && data.school) {
        try {
          const [tRes, cRes, ssRes] = await Promise.all([
            fetch(`${API_BASE}/users/?role=TEACHER&school=${data.school}&page_size=100`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_BASE}/academics/classes/?page_size=200`, { headers: { Authorization: `Bearer ${token}` } }),
            // Skillship teachers are school-less, so they don't show up under
            // ?school=. Pull the ones ACTIVELY assigned to this student's school
            // and add them to the dropdown (the backend allows assigning them).
            fetch(`${API_BASE}/assignments/skillship/?school=${data.school}&active=true`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          if (tRes.ok) {
            const td = await tRes.json();
            const schoolTeachers = (td.results ?? []).map((t: any) => ({ id: t.id, name: `${t.first_name} ${t.last_name}`.trim() || t.username || t.email }));
            let skillship: { id: string; name: string }[] = [];
            if (ssRes.ok) {
              const sd = await ssRes.json();
              const seen = new Set<string>();
              skillship = (sd.results ?? sd ?? [])
                .filter((a: any) => { if (seen.has(a.teacher)) return false; seen.add(a.teacher); return true; })
                .map((a: any) => ({ id: a.teacher, name: `${a.teacher_name} (Skillship)` }));
            }
            setTeachers([...schoolTeachers, ...skillship]);
          }
          if (cRes.ok) {
            const cd = await cRes.json();
            // MAIN_ADMIN sees every school's classes — keep only this student's school.
            setClasses((cd.results ?? cd ?? [])
              .filter((c: any) => String(c.school) === String(data.school))
              .map((c: any) => ({ id: c.id, name: c.class_name ?? `Grade ${c.grade}-${c.section}` })));
          }
        } catch { /* leave empty */ }
      }
    } catch {
      setFetchError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const token = await getToken();
    if (!token) { setSaving(false); return; }
    try {
      // klass only applies to students; empty selects → null (unassign/withdraw).
      const payload: Record<string, unknown> = { ...form, assigned_teacher: form.assigned_teacher || null };
      if (user.role === "STUDENT") payload.klass = form.klass || null;
      else delete payload.klass;
      if (user.role === "TEACHER") {
        // Skillship teachers carry no school; the backend also auto-clears it.
        payload.school = form.teacher_type === "SKILLSHIP" ? null : (form.school || null);
      } else {
        delete payload.teacher_type;
        delete payload.school;
      }
      const res = await fetch(`${API_BASE}/users/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditing(false);
        toast("User updated", "success");
        await load(); // refetch via the read serializer (current_class, teacher name, …)
      } else {
        const data = await res.json();
        const msg = Object.values(data).flat().join(" ");
        toast(msg || "Failed to save changes", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!user) return;
    const token = await getToken();
    if (!token) return;
    const newActive = !user.is_active;
    try {
      const res = await fetch(`${API_BASE}/users/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: newActive }),
      });
      if (res.ok) {
        setUser((u) => u ? { ...u, is_active: newActive } : u);
        toast(`User ${newActive ? "reactivated" : "suspended"}`, newActive ? "success" : "info");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSuspendOpen(false);
    }
  }

  function generatePassword() {
    const cs = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const buf = new Uint32Array(12);
    crypto.getRandomValues(buf);
    let out = "";
    buf.forEach((n) => { out += cs[n % cs.length]; });
    setNewPw(out);
  }

  async function resetPassword() {
    if (newPw.length < 8) { toast("Password must be at least 8 characters.", "error"); return; }
    setPwSaving(true);
    const token = await getToken();
    if (!token) { setPwSaving(false); return; }
    try {
      const res = await fetch(`${API_BASE}/users/${id}/set-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPw }),
      });
      if (res.ok || res.status === 204) {
        toast("Password updated — share the new password with the user.", "success");
        setPwOpen(false);
        setNewPw("");
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = Object.values(data).flat().join(" ");
        toast(msg || "Failed to reset password", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-[var(--muted-foreground)]">
        <svg className="mr-2 animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Loading user…
      </div>
    );
  }

  if (fetchError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-red-500">{fetchError ?? "User not found."}</p>
        <Link href="/dashboard/admin/users" className="text-xs font-semibold text-primary underline">Back to Users</Link>
      </div>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{fullName}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">User ID: {id} · <Link href="/dashboard/admin/users" className="text-primary hover:underline">All Users</Link></p>
        </div>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setSuspendOpen(true)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${user.is_active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}>
            {user.is_active ? "Suspend" : "Reactivate"}
          </button>
          {editing ? (
            <>
              <button type="button" onClick={() => { setEditing(false); setForm({ first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone ?? "", admission_number: user.admission_number ?? "", assigned_teacher: user.assigned_teacher ?? "", klass: user.current_class_id ?? "", teacher_type: user.teacher_type ?? "SCHOOL", school: user.school ?? "" }); }}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={save} disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setNewPw(""); setPwOpen(true); }}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-primary">Reset password</button>
              <button type="button" onClick={() => setEditing(true)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Edit</button>
            </>
          )}
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-xl font-bold text-white">
            {fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-bold text-[var(--foreground)]">{fullName}</p>
            <div className="mt-1 flex gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColors[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                {roleLabels[user.role] ?? user.role}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.is_active ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600"}`}>
                {user.is_active ? "Active" : "Suspended"}
              </span>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["first_name", "last_name", "email", "phone", "admission_number"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {k === "first_name" ? "First Name" : k === "last_name" ? "Last Name" : k === "email" ? "Email" : k === "phone" ? "Phone" : "Roll No."}
                </label>
                <input
                  value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            ))}
            {user.role === "TEACHER" && (
              <>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Teacher Type</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      { value: "SCHOOL", label: "School Teacher", desc: "Belongs to one school" },
                      { value: "SKILLSHIP", label: "Skillship Teacher", desc: "Roaming — assigned to schools" },
                    ] as const).map((t) => (
                      <button key={t.value} type="button" onClick={() => setForm((f) => ({ ...f, teacher_type: t.value }))}
                        className={`rounded-xl border p-3 text-left transition-all ${form.teacher_type === t.value ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-[var(--border)] bg-[var(--muted)]/30 hover:border-primary/30"}`}>
                        <p className="text-sm font-bold text-[var(--foreground)]">{t.label}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {form.teacher_type === "SCHOOL" ? (
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">School</label>
                    <select value={form.school} onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                      className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                      <option value="">— Select a school —</option>
                      {allSchools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--muted-foreground)] sm:col-span-2">Skillship teachers have no fixed school — manage their school access from <span className="font-semibold">Skillship Teachers</span>.</p>
                )}
              </>
            )}
            {user.role === "STUDENT" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Class</label>
                <select
                  value={form.klass}
                  onChange={(e) => setForm((f) => ({ ...f, klass: e.target.value }))}
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="">— No class —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {user.role === "STUDENT" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Assigned Teacher</label>
                <select
                  value={form.assigned_teacher}
                  onChange={(e) => setForm((f) => ({ ...f, assigned_teacher: e.target.value }))}
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="">— Unassigned —</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Email" value={user.email} />
            <Field label="Phone" value={user.phone ?? ""} />
            <Field label="School" value={user.school_name ?? (user.role === "MAIN_ADMIN" ? "Platform" : "—")} />
            {user.role === "STUDENT" && <Field label="Roll No." value={user.admission_number ?? ""} />}
            {user.role === "STUDENT" && <Field label="Class" value={user.current_class ?? "Not set up yet"} />}
            {user.role === "STUDENT" && <Field label="Assigned Teacher" value={user.assigned_teacher_name ?? "Unassigned"} />}
            {user.role === "STUDENT" && <Field label="Profile" value={user.profile_completed ? "Set up by student" : "Pending first login"} />}
            <Field label="Joined" value={new Date(user.date_joined).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
            <Field label="Username" value={user.username} />
          </div>
        )}
      </div>

      {/* Sub-admin: per-school capability grants (the delegation surface) */}
      {user.role === "SUB_ADMIN" && <SubAdminAccessPanel subadminId={user.id} />}

      {/* Suspend confirm dialog */}
      {suspendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[var(--foreground)]">
              {user.is_active ? "Suspend user?" : "Reactivate user?"}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {user.is_active
                ? `${fullName} will lose access immediately.`
                : `${fullName} will regain access immediately.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSuspendOpen(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={toggleActive}
                className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${user.is_active ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:opacity-90"}`}>
                {user.is_active ? "Suspend" : "Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset password dialog */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[var(--foreground)]">Reset password</h3>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
              Set a new password for <span className="font-semibold text-[var(--foreground)]">{fullName}</span>. They'll use it on their next login.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">New password</label>
              <input
                type="text"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 8 characters"
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <button type="button" onClick={generatePassword} className="self-start text-xs font-semibold text-primary hover:underline">Generate secure password</button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setPwOpen(false); setNewPw(""); }}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={resetPassword} disabled={pwSaving || newPw.length < 8}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {pwSaving ? "Saving…" : "Update password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
