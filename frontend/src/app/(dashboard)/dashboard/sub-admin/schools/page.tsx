/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/schools/page.tsx
 * Purpose: Sub-admin schools list — search, board/status filters, table with View links.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { API_BASE, getToken } from "@/lib/auth";

interface School {
  id: string;
  name: string;
  board: "CBSE" | "ICSE" | "STATE";
  city: string;
  state: string;
  is_active: boolean;
}

const boardBadge: Record<string, string> = {
  CBSE:  "bg-blue-100 text-blue-700",
  ICSE:  "bg-violet-100 text-violet-700",
  STATE: "bg-amber-100 text-amber-700",
};

const SchoolIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9v.01" />
    <path d="M9 12v.01" />
    <path d="M9 15v.01" />
    <path d="M9 18v.01" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

function SkeletonRow() {
  return (
    <tr>
      <td className="py-3 pr-4"><div className="h-4 w-40 animate-pulse rounded-lg bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-14 animate-pulse rounded-full bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-4 w-32 animate-pulse rounded-lg bg-[var(--muted)]" /></td>
      <td className="py-3 pr-4"><div className="h-5 w-16 animate-pulse rounded-full bg-[var(--muted)]" /></td>
      <td className="py-3"><div className="h-4 w-10 animate-pulse rounded-lg bg-[var(--muted)]" /></td>
    </tr>
  );
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[] | null>(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [boardFilter, setBoardFilter] = useState<"ALL" | "CBSE" | "ICSE" | "STATE">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) { setError(true); return; }
    try {
      const res = await fetch(`${API_BASE}/schools/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(true); return; }
      const data = await res.json();
      setSchools(data.results ?? []);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    document.title = "Schools — Skillship";
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!schools) return null;
    return schools.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
      const matchBoard  = boardFilter === "ALL" || s.board === boardFilter;
      const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? s.is_active : !s.is_active);
      return matchSearch && matchBoard && matchStatus;
    });
  }, [schools, search, boardFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Schools</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Manage schools assigned to your territory
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search by name or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white py-2 pl-9 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-[var(--background)]"
          />
        </div>

        {/* Board filter */}
        <select
          value={boardFilter}
          onChange={(e) => setBoardFilter(e.target.value as typeof boardFilter)}
          className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-[var(--background)]"
        >
          <option value="ALL">All Boards</option>
          <option value="CBSE">CBSE</option>
          <option value="ICSE">ICSE</option>
          <option value="STATE">State Board</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-[var(--background)]"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
        {/* Error */}
        {error && (
          <p className="py-10 text-center text-sm text-[var(--muted-foreground)]">
            Could not load schools — check API connection.
          </p>
        )}

        {/* Table */}
        {!error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="pb-3 pr-4">School Name</th>
                  <th className="pb-3 pr-4">Board</th>
                  <th className="pb-3 pr-4">Location</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered === null ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center py-14 text-center text-[var(--muted-foreground)]">
                        <SchoolIcon />
                        <p className="mt-3 text-sm">No schools found</p>
                        {search || boardFilter !== "ALL" || statusFilter !== "ALL" ? (
                          <p className="mt-1 text-xs">Try adjusting your filters.</p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--muted)]/30">
                      <td className="py-3 pr-4 font-medium text-[var(--foreground)]">{s.name}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${boardBadge[s.board] ?? "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                          {s.board}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[var(--muted-foreground)]">
                        {[s.city, s.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/dashboard/sub-admin/schools/${s.id}`}
                          className="text-[13px] font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
