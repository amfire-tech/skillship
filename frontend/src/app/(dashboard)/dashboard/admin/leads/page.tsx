/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/leads/page.tsx
 * Purpose: MAIN_ADMIN view of public "Book a Demo" submissions (DemoRequest).
 *          Lists every school inquiry from the public site, lets the admin
 *          triage status (New/Contacted/Converted/Lost) and leave notes.
 *          Data from /demo-requests/ (apps/leads on the backend).
 * Owner:   Pranav
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { TableRowSkeleton } from "@/components/ui/TableRowSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { API_BASE, getToken } from "@/lib/auth";

interface DemoRequest {
  id: string;
  school_name: string;
  principal_name: string;
  city: string;
  student_range: string;
  phone_number: string;
  email_address: string;
  school_board: string;
  preferred_date: string | null;
  preferred_time_slot: string;
  status: "NEW" | "CONTACTED" | "CONVERTED" | "LOST";
  triage_notes: string;
  created_at: string;
}

const studentRangeLabel: Record<string, string> = {
  "up-to-250": "Up to 250",
  "251-500": "251–500",
  "501-1000": "501–1,000",
  "1000-plus": "1,000+",
};

const slotLabel: Record<string, string> = {
  "10:30": "10:30 AM",
  "11:30": "11:30 AM",
  "12:30": "12:30 PM",
  "15:00": "3:00 PM",
  "16:00": "4:00 PM",
};

const statusLabel: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONVERTED: "Converted",
  LOST: "Lost",
};

const statusClass: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-600 border-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
  CONVERTED: "bg-primary/10 text-primary border-primary/20",
  LOST: "bg-slate-100 text-slate-500 border-slate-200",
};

function initialsColor(name: string) {
  const palette = ["from-primary to-accent", "from-teal-500 to-primary", "from-emerald-500 to-teal-500", "from-primary-700 to-primary", "from-accent to-primary-500"];
  return palette[(name.charCodeAt(0) || 0) % palette.length];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function preferredSlot(lead: DemoRequest): string {
  if (!lead.preferred_date) return "—";
  return `${formatDate(lead.preferred_date)} · ${slotLabel[lead.preferred_time_slot] ?? lead.preferred_time_slot}`;
}

export default function DemoRequestsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [active, setActive] = useState<DemoRequest | null>(null);
  const [draftStatus, setDraftStatus] = useState<DemoRequest["status"]>("NEW");
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = await getToken();
    if (!token) { setFetchError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/demo-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setFetchError("Failed to load demo requests."); setLoading(false); return; }
      const data = await res.json();
      setLeads(data.results ?? []);
    } catch {
      setFetchError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Demo Requests — Skillship";
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || l.school_name.toLowerCase().includes(q)
      || l.principal_name.toLowerCase().includes(q)
      || l.city.toLowerCase().includes(q)
      || l.email_address.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All Status" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openLead(lead: DemoRequest) {
    setActive(lead);
    setDraftStatus(lead.status);
    setDraftNotes(lead.triage_notes);
  }

  async function quickSetStatus(lead: DemoRequest, status: DemoRequest["status"]) {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); return; }
    try {
      const res = await fetch(`${API_BASE}/demo-requests/${lead.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast(`${lead.school_name} marked ${statusLabel[status]}`, "success");
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)));
      toast("Failed to update status", "error");
    }
  }

  async function saveTriage() {
    if (!active) return;
    setSaving(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setSaving(false); return; }
    try {
      const res = await fetch(`${API_BASE}/demo-requests/${active.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: draftStatus, triage_notes: draftNotes }),
      });
      if (!res.ok) throw new Error();
      setLeads((prev) => prev.map((l) => (l.id === active.id ? { ...l, status: draftStatus, triage_notes: draftNotes } : l)));
      toast("Triage notes saved", "success");
      setActive(null);
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo Requests"
        subtitle={loading ? "Loading…" : `${leads.length} request${leads.length !== 1 ? "s" : ""} submitted from the public site`}
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
            placeholder="Search by school, principal, city or email…"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option>All Status</option>
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {filtered.length} of {leads.length} requests
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <th className="px-5 py-3">School</th>
                  <th className="px-5 py-3">City / Students</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Preferred Slot</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Received</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <TableRowSkeleton rows={6} columns={7} withAvatar />
              </tbody>
            </table>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-red-500">{fetchError}</p>
            <button onClick={load} className="text-xs font-semibold text-primary underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  <th className="px-5 py-3">School</th>
                  <th className="px-5 py-3">City / Students</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Preferred Slot</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Received</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8">
                    <EmptyState
                      title={leads.length === 0 ? "No demo requests yet" : "No requests match"}
                      description={leads.length === 0 ? "Submissions from the public \"Book a Demo\" form will show up here." : "Adjust the search or filters to see more results."}
                      icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
                    />
                  </td></tr>
                ) : (
                  filtered.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + i * 0.03 }}
                      className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${initialsColor(lead.school_name)}`}>
                            {lead.school_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[200px] truncate font-semibold text-[var(--foreground)]">{lead.school_name}</p>
                            <p className="max-w-[200px] truncate text-xs text-[var(--muted-foreground)]">{lead.principal_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                        <p>{lead.city || "—"}</p>
                        <p className="text-xs">{studentRangeLabel[lead.student_range] ?? lead.student_range}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                        <p className="max-w-[180px] truncate">{lead.email_address}</p>
                        <p className="text-xs">{lead.phone_number}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{preferredSlot(lead)}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={lead.status}
                          onChange={(e) => quickSetStatus(lead, e.target.value as DemoRequest["status"])}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold outline-none ${statusClass[lead.status]}`}
                        >
                          {Object.entries(statusLabel).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{formatDate(lead.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 text-xs">
                          <button onClick={() => openLead(lead)} className="inline-flex min-h-8 items-center rounded-md px-2.5 py-1.5 font-semibold text-primary transition-colors hover:bg-primary/10 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary/20">View</button>
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

      {/* Detail / triage drawer */}
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setActive(null)}
          >
            <motion.div
              role="dialog" aria-modal="true"
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">{active.school_name}</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">Submitted {formatDate(active.created_at)}</p>
                </div>
                <button onClick={() => setActive(null)} className="rounded-full p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                </button>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Principal</dt>
                  <dd className="mt-0.5 text-[var(--foreground)]">{active.principal_name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">City</dt>
                  <dd className="mt-0.5 text-[var(--foreground)]">{active.city || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Students</dt>
                  <dd className="mt-0.5 text-[var(--foreground)]">{studentRangeLabel[active.student_range] ?? active.student_range}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Board</dt>
                  <dd className="mt-0.5 text-[var(--foreground)]">{active.school_board || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Phone</dt>
                  <dd className="mt-0.5 text-[var(--foreground)]">{active.phone_number}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Email</dt>
                  <dd className="mt-0.5 truncate text-[var(--foreground)]">{active.email_address}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Preferred Slot</dt>
                  <dd className="mt-0.5 text-[var(--foreground)]">{preferredSlot(active)}</dd>
                </div>
              </dl>

              <div className="mt-5 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Status</label>
                <select
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as DemoRequest["status"])}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  {Object.entries(statusLabel).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Triage Notes</label>
                <textarea
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal notes — call back time, objections, follow-ups…"
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button onClick={() => setActive(null)}
                  className="flex-1 h-10 rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">
                  Cancel
                </button>
                <button onClick={saveTriage} disabled={saving}
                  className="flex-1 h-10 rounded-full bg-gradient-to-r from-primary to-accent text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70">
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
