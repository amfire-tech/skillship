"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";

interface ApiUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  school: string | null;
  school_name: string | null;
  phone: string | null;
  admission_number: string | null;
  is_active: boolean;
  date_joined: string;
}

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function getToken(): Promise<string | null> {
  let token = useAuthStore.getState().accessToken;
  if (!token) {
    const ok = await useAuthStore.getState().refreshAuth();
    if (!ok) return null;
    token = useAuthStore.getState().accessToken;
  }
  return token;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
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
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
      setForm({ first_name: data.first_name, last_name: data.last_name, email: data.email, phone: data.phone ?? "" });
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
      const res = await fetch(`${API_BASE}/users/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated: ApiUser = await res.json();
        setUser(updated);
        setEditing(false);
        toast("User updated", "success");
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
              <button type="button" onClick={() => { setEditing(false); setForm({ first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone ?? "" }); }}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={save} disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Edit</button>
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
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleColors[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                {roleLabels[user.role] ?? user.role}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${user.is_active ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600"}`}>
                {user.is_active ? "Active" : "Suspended"}
              </span>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["first_name", "last_name", "email", "phone"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {k === "first_name" ? "First Name" : k === "last_name" ? "Last Name" : k === "email" ? "Email" : "Phone"}
                </label>
                <input
                  value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Email" value={user.email} />
            <Field label="Phone" value={user.phone ?? ""} />
            <Field label="School" value={user.school_name ?? (user.role === "MAIN_ADMIN" ? "Platform" : "—")} />
            <Field label="Joined" value={new Date(user.date_joined).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
            <Field label="Username" value={user.username} />
            {user.admission_number && <Field label="Admission No." value={user.admission_number} />}
          </div>
        )}
      </div>

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
    </div>
  );
}
