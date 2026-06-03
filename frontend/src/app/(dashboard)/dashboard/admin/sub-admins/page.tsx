/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/sub-admins/page.tsx
 * Purpose: Sub-admin management — list, deactivate, delete via real API.
 * Owner:   Pranav
 */
"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { API_BASE, getToken } from "@/lib/auth";

interface SubAdminRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

export default function SubAdminManagementPage() {
  const toast = useToast();
  const router = useRouter();
  const [subadmins, setSubadmins] = useState<SubAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<SubAdminRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SubAdminRow | null>(null);

  useEffect(() => {
    document.title = "Sub-Admin Management — Skillship";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = await getToken();
    if (!token) { setFetchError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/users/?role=SUB_ADMIN`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setFetchError("Failed to load sub-admins."); setLoading(false); return; }
      const data = await res.json();
      setSubadmins(data.results ?? []);
    } catch {
      setFetchError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(subadmin: SubAdminRow) {
    const token = await getToken();
    if (!token) return;
    const nextActive = !subadmin.is_active;
    try {
      const res = await fetch(`${API_BASE}/users/${subadmin.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (res.ok) {
        setSubadmins((prev) =>
          prev.map((s) => s.id === subadmin.id ? { ...s, is_active: nextActive } : s)
        );
        const fullName = `${subadmin.first_name} ${subadmin.last_name}`.trim();
        toast(`${fullName} ${nextActive ? "reactivated" : "deactivated"}`, nextActive ? "success" : "info");
      } else {
        toast("Failed to update sub-admin status", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setConfirmDeactivate(null);
    }
  }

  async function deleteSubAdmin(subadmin: SubAdminRow) {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/users/${subadmin.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setSubadmins((prev) => prev.filter((s) => s.id !== subadmin.id));
        const fullName = `${subadmin.first_name} ${subadmin.last_name}`.trim();
        toast(`${fullName} removed`, "error");
      } else {
        toast("Failed to delete sub-admin", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SubAdmin Management"
        subtitle={
          loading
            ? "Loading…"
            : `${subadmins.length} sub-admin${subadmins.length !== 1 ? "s" : ""} managing schools across regions`
        }
        action={
          <Link
            href="/dashboard/admin/users/new/SUB_ADMIN"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Create SubAdmin
          </Link>
        }
      />

      {/* Stat strip */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Total SubAdmins", value: subadmins.length.toString(), tone: "text-primary" },
          { label: "Active", value: subadmins.filter((s) => s.is_active).length.toString(), tone: "text-teal-600" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.05 }}
            className="rounded-2xl border border-[var(--border)] bg-white p-4"
          >
            <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
            <p className={`mt-1.5 text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[var(--muted-foreground)]">
            <svg className="mr-2 animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Loading sub-admins…
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-red-500">{fetchError}</p>
            <button onClick={load} className="text-xs font-semibold text-primary underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subadmins.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8">
                    <EmptyState
                      title="No sub-admins yet"
                      description="Sub-admins manage a territory of schools — onboarding, quiz approvals, and analytics. Create one to delegate operations."
                      action={{ label: "Create Sub-Admin", href: "/dashboard/admin/users/new/SUB_ADMIN" }}
                      icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                    />
                  </td></tr>
                )}
                <AnimatePresence mode="popLayout">
                  {subadmins.map((s, i) => {
                    const fullName = `${s.first_name} ${s.last_name}`.trim() || s.email;
                    const initials = [s.first_name?.[0], s.last_name?.[0]].filter(Boolean).join("").slice(0, 2).toUpperCase() || s.email[0].toUpperCase();
                    return (
                      <motion.tr
                        key={s.id}
                        layout
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: 0.35 + i * 0.04 }}
                        className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                              {initials}
                            </div>
                            <p className="font-semibold text-[var(--foreground)]">{fullName}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{s.email}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            s.is_active
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.is_active ? "bg-primary" : "bg-slate-400"}`} />
                            {s.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 text-xs">
                            <button onClick={() => router.push(`/dashboard/admin/users/${s.id}`)} className="inline-flex min-h-8 items-center rounded-md px-2.5 py-1.5 font-semibold text-primary transition-colors hover:bg-primary/10 hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/20">View</button>
                            <button onClick={() => setConfirmDeactivate(s)} className={`inline-flex min-h-8 items-center rounded-md px-2.5 py-1.5 font-semibold transition-colors focus:outline-none focus:ring-2 ${s.is_active ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700 focus:ring-amber-300/40" : "text-teal-600 hover:bg-teal-50 hover:text-teal-700 focus:ring-teal-300/40"}`}>
                              {s.is_active ? "Deactivate" : "Reactivate"}
                            </button>
                            <button onClick={() => setConfirmDelete(s)} className="inline-flex min-h-8 items-center rounded-md px-2.5 py-1.5 font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300/40">Delete</button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Deactivate / Reactivate dialog */}
      <AnimatePresence>
        {confirmDeactivate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              role="alertdialog" aria-modal="true"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
            >
              <h3 className="text-base font-bold text-[var(--foreground)]">
                {confirmDeactivate.is_active ? "Deactivate" : "Reactivate"} sub-admin?
              </h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {confirmDeactivate.is_active
                  ? `${confirmDeactivate.first_name} ${confirmDeactivate.last_name} will lose access immediately.`
                  : `${confirmDeactivate.first_name} ${confirmDeactivate.last_name} will regain platform access.`}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setConfirmDeactivate(null)}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
                <button onClick={() => toggleStatus(confirmDeactivate)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${confirmDeactivate.is_active ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:opacity-90"}`}>
                  {confirmDeactivate.is_active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              role="alertdialog" aria-modal="true"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="m3 6 1 14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L21 6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-bold text-[var(--foreground)]">Delete sub-admin?</h3>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold text-[var(--foreground)]">{confirmDelete.first_name} {confirmDelete.last_name}</span> will be permanently removed. This cannot be undone.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 h-10 rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">Cancel</button>
                <button onClick={() => deleteSubAdmin(confirmDelete)}
                  className="flex-1 h-10 rounded-full bg-red-500 text-sm font-semibold text-white hover:bg-red-600">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
