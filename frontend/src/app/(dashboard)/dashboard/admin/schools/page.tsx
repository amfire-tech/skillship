"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";

interface ApiSchool {
  id: string;
  name: string;
  slug: string;
  board: string;
  city: string;
  state: string;
  address: string;
  plan: string;
  is_active: boolean;
  created_at: string;
}

const planLabel: Record<string, string> = { CORE: "Core", AGENTIC: "Agentic" };
const planClass: Record<string, string> = {
  CORE: "bg-slate-50 text-slate-600 border-slate-200",
  AGENTIC: "bg-amber-50 text-amber-700 border-amber-200",
};
const boardLabel: Record<string, string> = { CBSE: "CBSE", ICSE: "ICSE", STATE: "State Board" };

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

function initialsColor(name: string) {
  const palette = ["from-primary to-accent", "from-teal-500 to-primary", "from-emerald-500 to-teal-500", "from-primary-700 to-primary", "from-accent to-primary-500"];
  return palette[name.charCodeAt(0) % palette.length];
}

export default function SchoolsManagementPage() {
  const toast = useToast();
  const router = useRouter();
  const [schools, setSchools] = useState<ApiSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [confirmRemove, setConfirmRemove] = useState<ApiSchool | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = await getToken();
    if (!token) { setFetchError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/schools/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setFetchError("Failed to load schools."); setLoading(false); return; }
      const data = await res.json();
      setSchools(data.results ?? []);
    } catch {
      setFetchError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cities = ["All Cities", ...Array.from(new Set(schools.map((s) => s.city).filter(Boolean)))];

  const filtered = schools.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
    const matchCity = cityFilter === "All Cities" || s.city === cityFilter;
    const matchStatus = statusFilter === "All Status" || (statusFilter === "Active" ? s.is_active : !s.is_active);
    return matchSearch && matchCity && matchStatus;
  });

  async function handleRemove(school: ApiSchool) {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/schools/${school.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 204) {
        setSchools((prev) => prev.filter((s) => s.id !== school.id));
        toast(`${school.name} removed`, "error");
      } else {
        toast("Failed to remove school", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setConfirmRemove(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schools Management"
        subtitle={loading ? "Loading…" : `${schools.length} school${schools.length !== 1 ? "s" : ""} registered on the platform`}
        action={
          <button
            onClick={() => router.push("/dashboard/admin/schools/new")}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Add New School
          </button>
        }
      />

      {/* Filters bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 md:flex-row md:items-center"
      >
        <div className="relative flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by school name or city…"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {filtered.length} of {schools.length} schools
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[var(--muted-foreground)]">
            <svg className="mr-2 animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Loading schools…
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-red-500">{fetchError}</p>
            <button onClick={load} className="text-xs font-semibold text-primary underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <th className="px-5 py-3">School Name</th>
                  <th className="px-5 py-3">City / State</th>
                  <th className="px-5 py-3">Board</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">
                      {schools.length === 0 ? "No schools yet. Add one to get started." : "No schools match your filters."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + i * 0.03 }}
                      className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${initialsColor(s.name)}`}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="max-w-[220px] truncate font-semibold text-[var(--foreground)]">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                        {[s.city, s.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{boardLabel[s.board] ?? s.board}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${planClass[s.plan] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {planLabel[s.plan] ?? s.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.is_active ? "bg-primary/10 text-primary border-primary/20" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3 text-xs">
                          <button onClick={() => router.push(`/dashboard/admin/schools/${s.id}`)} className="font-semibold text-primary transition-colors hover:text-primary-700">View</button>
                          <button onClick={() => router.push(`/dashboard/admin/schools/${s.id}`)} className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">Edit</button>
                          <button onClick={() => setConfirmRemove(s)} className="font-semibold text-[var(--muted-foreground)] transition-colors hover:text-red-500">Remove</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Confirm Remove Dialog */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <motion.div
              role="alertdialog" aria-modal="true"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="m3 6 1 14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L21 6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-bold text-[var(--foreground)]">Remove school?</h3>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold text-[var(--foreground)]">{confirmRemove.name}</span> and all its data will be permanently removed.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={() => setConfirmRemove(null)}
                  className="flex-1 h-10 rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">
                  Cancel
                </button>
                <button onClick={() => handleRemove(confirmRemove)}
                  className="flex-1 h-10 rounded-full bg-red-500 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-600">
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
