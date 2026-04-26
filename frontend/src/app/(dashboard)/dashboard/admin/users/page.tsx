"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

type Role = "all" | UserRole;

interface ApiUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  school: string | null;
  school_name: string | null;
  phone: string | null;
  admission_number: string | null;
  is_active: boolean;
  date_joined: string;
}

const roleColor: Record<UserRole, string> = {
  MAIN_ADMIN: "bg-primary/10 text-primary border-primary/20",
  SUB_ADMIN: "bg-teal-50 text-teal-700 border-teal-200",
  PRINCIPAL: "bg-violet-50 text-violet-700 border-violet-200",
  TEACHER: "bg-amber-50 text-amber-700 border-amber-200",
  STUDENT: "bg-slate-50 text-slate-600 border-slate-200",
};

const roleLabel: Record<UserRole, string> = {
  MAIN_ADMIN: "Super Admin",
  SUB_ADMIN: "Sub Admin",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

const roleTabDefs: { label: string; value: Role }[] = [
  { label: "All", value: "all" },
  { label: "Super Admin", value: "MAIN_ADMIN" },
  { label: "Sub Admins", value: "SUB_ADMIN" },
  { label: "Principals", value: "PRINCIPAL" },
  { label: "Teachers", value: "TEACHER" },
  { label: "Students", value: "STUDENT" },
];

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

export default function UserManagementPage() {
  const toast = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<Role>("all");
  const [search, setSearch] = useState("");
  const [confirmSuspend, setConfirmSuspend] = useState<ApiUser | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = await getToken();
    if (!token) { setFetchError("Session expired. Please log in again."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setFetchError("Failed to load users."); setLoading(false); return; }
      const data = await res.json();
      setUsers(data.results ?? []);
    } catch {
      setFetchError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const tabs = roleTabDefs.map((t) => ({
    ...t,
    count: t.value === "all" ? users.length : users.filter((u) => u.role === t.value).length,
  }));

  const filtered = (activeRole === "all" ? users : users.filter((u) => u.role === activeRole)).filter((u) => {
    const q = search.toLowerCase();
    return !q
      || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (u.school_name ?? "").toLowerCase().includes(q);
  });

  async function handleSuspend(user: ApiUser) {
    const token = await getToken();
    if (!token) return;
    try {
      await fetch(`${API_BASE}/users/${user.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: false }),
      });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: false } : u));
      toast(`${user.first_name} ${user.last_name} suspended`, "error");
    } catch {
      toast("Failed to suspend user", "error");
    } finally {
      setConfirmSuspend(null);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="All Skillship users across every role and school"
        action={
          <Link
            href="/dashboard/admin/users/new"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Create New User
          </Link>
        }
      />

      {/* Role tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-white p-2"
      >
        {tabs.map((t) => {
          const active = activeRole === t.value;
          return (
            <button
              key={t.value}
              onClick={() => { setActiveRole(t.value); setSearch(""); }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                active
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)]"
                  : "text-[var(--muted-foreground)] hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/25" : "bg-[var(--muted)]"}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="relative"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, school…"
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[var(--muted-foreground)]">
            <svg className="mr-2 animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Loading users…
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-red-500">{fetchError}</p>
            <button onClick={loadUsers} className="text-xs font-semibold text-primary underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">School / Scope</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">
                      {users.length === 0 ? "No users found." : "No users match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, i) => {
                    const fullName = `${u.first_name} ${u.last_name}`.trim() || u.username;
                    const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                    const status = u.is_active ? "Active" : "Suspended";
                    const statusColor = u.is_active
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-red-50 text-red-600 border-red-200";
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.25 + i * 0.04 }}
                        className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--foreground)]">{fullName}</p>
                              <p className="text-[11px] text-[var(--muted-foreground)]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${roleColor[u.role]}`}>
                            {roleLabel[u.role]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                          {u.school_name ?? (u.role === "MAIN_ADMIN" ? "Platform" : "—")}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{formatDate(u.date_joined)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-3 text-xs">
                            <button onClick={() => router.push(`/dashboard/admin/users/${u.id}`)} className="font-semibold text-primary transition-colors hover:text-primary-700">View</button>
                            <button onClick={() => router.push(`/dashboard/admin/users/${u.id}`)} className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">Edit</button>
                            {u.is_active && (
                              <button onClick={() => setConfirmSuspend(u)} className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-red-500">Suspend</button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Suspend confirmation dialog */}
      <AnimatePresence>
        {confirmSuspend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="suspend-dialog-title"
              aria-describedby="suspend-dialog-desc"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 id="suspend-dialog-title" className="mt-4 text-base font-bold text-[var(--foreground)]">Suspend user?</h3>
              <p id="suspend-dialog-desc" className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold text-[var(--foreground)]">{confirmSuspend.first_name} {confirmSuspend.last_name}</span> will lose access to the platform immediately. You can reinstate them later.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => setConfirmSuspend(null)}
                  className="flex-1 h-10 rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSuspend(confirmSuspend)}
                  className="flex-1 h-10 rounded-full bg-amber-500 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-amber-600"
                >
                  Suspend
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
