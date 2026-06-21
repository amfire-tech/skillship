"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { TableRowSkeleton } from "@/components/ui/TableRowSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { API_BASE, getToken } from "@/lib/auth";
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
  assigned_teacher_name?: string | null;
  profile_completed?: boolean;
  is_active: boolean;
  ai_enabled?: boolean;
  date_joined: string;
}

interface SchoolOpt { id: string; name: string }
interface TeacherOpt { id: string; name: string }
interface StudentStats { total: number; activated: number; generated: number; assigned: number; unassigned: number }

type Activation = "all" | "activated" | "generated";

const PAGE_SIZE = 50;

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

/** Page through a paginated DRF list (used for the small /schools/ + teachers lists). */
async function fetchAll(url: string, token: string): Promise<any[]> {
  const out: any[] = [];
  let next: string | null = url;
  for (let guard = 0; next && guard < 50; guard++) {
    const res: Response = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) break;
    const data = await res.json();
    out.push(...(data.results ?? (Array.isArray(data) ? data : [])));
    next = data.next ?? null;
  }
  return out;
}

function displayName(u: { first_name: string; last_name: string; username: string }) {
  return `${u.first_name} ${u.last_name}`.trim() || u.username;
}

export default function UserManagementPage() {
  const toast = useToast();
  const router = useRouter();

  const [schools, setSchools] = useState<SchoolOpt[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeRole, setActiveRole] = useState<Role>("STUDENT");
  const [activation, setActivation] = useState<Activation>("all");
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [schoolId, setSchoolId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmSuspend, setConfirmSuspend] = useState<ApiUser | null>(null);

  // Bulk teacher assignment (Students view, school selected).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [teachers, setTeachers] = useState<TeacherOpt[]>([]);
  const [assignTo, setAssignTo] = useState("");
  const [assigning, setAssigning] = useState(false);

  const bulkMode = activeRole === "STUDENT" && !!schoolId;

  useEffect(() => { document.title = "User Management — Skillship"; }, []);

  // Load the (small) school list once for the filter dropdown.
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const list = await fetchAll(`${API_BASE}/schools/`, token);
        setSchools(list.map((s) => ({ id: s.id, name: s.name })));
      } catch { /* leave empty */ }
    })();
  }, []);

  // Load the selected school's teachers (for the assign dropdown).
  useEffect(() => {
    if (!bulkMode) { setTeachers([]); return; }
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const list = await fetchAll(`${API_BASE}/users/?role=TEACHER&school=${schoolId}&page_size=100`, token);
        const schoolTeachers = list.map((t) => ({ id: t.id, name: displayName(t) || t.email }));
        // Skillship teachers have no school, so they're absent above. Add the
        // ones ACTIVELY assigned to this school (the backend accepts them).
        let skillship: TeacherOpt[] = [];
        try {
          const ssRes = await fetch(`${API_BASE}/assignments/skillship/?school=${schoolId}&active=true`, { headers: { Authorization: `Bearer ${token}` } });
          if (ssRes.ok) {
            const sd = await ssRes.json();
            const seen = new Set<string>();
            skillship = (sd.results ?? sd ?? [])
              .filter((a: { teacher: string }) => (seen.has(a.teacher) ? false : (seen.add(a.teacher), true)))
              .map((a: { teacher: string; teacher_name: string }) => ({ id: a.teacher, name: `${a.teacher_name} (Skillship)` }));
          }
        } catch { /* skillship list optional */ }
        setTeachers([...schoolTeachers, ...skillship]);
      } catch { setTeachers([]); }
    })();
  }, [bulkMode, schoolId]);

  // Student activation / assignment counts for the sub-filter chips. Recomputed
  // whenever the Students tab is active or the school filter changes.
  useEffect(() => {
    if (activeRole !== "STUDENT") { setStats(null); return; }
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const url = `${API_BASE}/users/student-stats/${schoolId ? `?school=${schoolId}` : ""}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { if (!cancelled) setStats(null); return; }
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch { if (!cancelled) setStats(null); }
    })();
    return () => { cancelled = true; };
  }, [activeRole, schoolId]);

  // Debounce the search box → committed search term (and reset to page 1).
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setSelected(new Set());
    const token = await getToken();
    if (!token) { setFetchError("Session expired. Please log in again."); setLoading(false); return; }
    const qs = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (activeRole !== "all") qs.set("role", activeRole);
    if (schoolId) qs.set("school", schoolId);
    if (search) qs.set("search", search);
    if (activeRole === "STUDENT" && activation !== "all") qs.set("activation", activation);
    try {
      const res = await fetch(`${API_BASE}/users/?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setFetchError("Failed to load users."); setLoading(false); return; }
      const data = await res.json();
      setUsers(data.results ?? []);
      setCount(data.count ?? (data.results?.length ?? 0));
    } catch {
      setFetchError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [activeRole, schoolId, search, page, activation]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function selectRole(value: Role) { setActiveRole(value); setActivation("all"); setPage(1); }
  function selectSchool(value: string) { setSchoolId(value); setPage(1); }
  function selectActivation(value: Activation) { setActivation(value); setPage(1); }

  const studentIdsOnPage = useMemo(
    () => users.filter((u) => u.role === "STUDENT").map((u) => u.id),
    [users],
  );
  const allSelected = bulkMode && studentIdsOnPage.length > 0 && studentIdsOnPage.every((id) => selected.has(id));

  function toggleRow(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected((prev) => {
      if (studentIdsOnPage.every((id) => prev.has(id))) return new Set();
      return new Set(studentIdsOnPage);
    });
  }

  // Select EVERY student matching the current filter (across all pages), not
  // just the 50 on screen. Fetches an ids-only list so a 5k-student school
  // doesn't pull 5k serialized rows.
  const [selectingAll, setSelectingAll] = useState(false);
  async function selectAllMatching() {
    setSelectingAll(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setSelectingAll(false); return; }
    const qs = new URLSearchParams();
    if (schoolId) qs.set("school", schoolId);
    if (search) qs.set("search", search);
    if (activation !== "all") qs.set("activation", activation);
    try {
      const res = await fetch(`${API_BASE}/users/student-ids/?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast("Couldn't select all. Try again.", "error"); return; }
      const data = await res.json();
      setSelected(new Set<string>(data.ids ?? []));
    } catch {
      toast("Network error while selecting all", "error");
    } finally {
      setSelectingAll(false);
    }
  }

  async function assignTeacher() {
    if (selected.size === 0) return;
    setAssigning(true);
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); setAssigning(false); return; }
    try {
      const res = await fetch(`${API_BASE}/users/assign-teacher/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teacher: assignTo || null, students: Array.from(selected) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body?.detail ?? body?.students?.[0] ?? `Assign failed (${res.status})`, "error");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (assignTo) {
        const who = teachers.find((t) => t.id === assignTo)?.name ?? "teacher";
        const newly = data.assigned_count ?? 0;
        const already = data.already_assigned ?? 0;
        const msg = already > 0
          ? `${newly} assigned to ${who}${newly === 0 ? " (all were already assigned)" : `, ${already} already assigned`}`
          : `${newly} student(s) → ${who}`;
        toast(msg, already > 0 && newly === 0 ? "info" : "success");
      } else {
        toast(`${data.unassigned_count ?? 0} student(s) unassigned`, "info");
      }
      await loadUsers();
    } catch {
      toast("Network error", "error");
    } finally {
      setAssigning(false);
    }
  }

  async function toggleAi(user: ApiUser) {
    const next = !(user.ai_enabled ?? true);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ai_enabled: next } : u));
    const token = await getToken();
    if (!token) { toast("Session expired", "error"); return; }
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ai_enabled: next }),
      });
      if (!res.ok) throw new Error();
      toast(`AI ${next ? "enabled" : "disabled"} for ${displayName(user)}`, next ? "success" : "info");
    } catch {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ai_enabled: !next } : u));
      toast("Failed to update AI access", "error");
    }
  }

  async function handleSuspend(user: ApiUser) {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: false }),
      });
      if (!res.ok) { toast("Failed to suspend user. Please try again.", "error"); return; }
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: false } : u));
      toast(`${displayName(user)} suspended`, "error");
    } catch {
      toast("Failed to suspend user", "error");
    } finally {
      setConfirmSuspend(null);
    }
  }

  const schoolName = schools.find((s) => s.id === schoolId)?.name;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const firstRow = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(page * PAGE_SIZE, count);
  const roleNoun = activeRole === "all" ? "user" : roleLabel[activeRole].toLowerCase();
  const colCount = 8 + (bulkMode ? 1 : 0);

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
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-white p-2">
        {roleTabDefs.map((t) => {
          const active = activeRole === t.value;
          return (
            <button
              key={t.value}
              onClick={() => selectRole(t.value)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                active
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)]"
                  : "text-[var(--muted-foreground)] hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* School filter + search */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={schoolId}
          onChange={(e) => selectSchool(e.target.value)}
          className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option value="">All schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="relative min-w-[260px] flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, roll no…"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Activation sub-filter (Students only): generated (not yet activated)
          vs activated, with live counts so the super admin sees both at a glance. */}
      {activeRole === "STUDENT" && (
        <div className="flex flex-wrap items-center gap-2">
          {([
            { value: "all", label: "All students", n: stats?.total },
            { value: "activated", label: "Activated", n: stats?.activated },
            { value: "generated", label: "Generated (pending)", n: stats?.generated },
          ] as { value: Activation; label: string; n?: number }[]).map((c) => {
            const active = activation === c.value;
            return (
              <button
                key={c.value}
                onClick={() => selectActivation(c.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-primary/40 hover:text-primary"
                }`}
              >
                {c.label}
                {typeof c.n === "number" && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-primary/15 text-primary" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                    {c.n.toLocaleString("en-IN")}
                  </span>
                )}
              </button>
            );
          })}
          {stats && (
            <span className="ml-1 text-xs text-[var(--muted-foreground)]">
              · {stats.assigned.toLocaleString("en-IN")} assigned to a teacher, {stats.unassigned.toLocaleString("en-IN")} unassigned
            </span>
          )}
        </div>
      )}

      {/* Count summary + bulk-assign hint */}
      <p className="text-sm text-[var(--muted-foreground)]">
        {loading ? "Loading…" : (
          <>
            <span className="font-semibold text-[var(--foreground)]">{count.toLocaleString("en-IN")}</span>{" "}
            {roleNoun}{count === 1 ? "" : "s"}
            {schoolName ? <> in <span className="font-semibold text-[var(--foreground)]">{schoolName}</span></> : " across all schools"}
            {search ? <> matching “{search}”</> : null}
            {activeRole === "STUDENT" && !schoolId ? <> · pick a school to assign a teacher</> : null}
          </>
        )}
      </p>

      {/* Bulk assign toolbar */}
      {bulkMode && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-semibold text-[var(--foreground)]">{selected.size} selected</span>
          <span className="text-sm text-[var(--muted-foreground)]">→ assign to</span>
          <select
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="">— Unassign (no teacher) —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button
            onClick={assignTeacher} disabled={assigning}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:opacity-60"
          >
            {assigning ? "Assigning…" : "Assign teacher"}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-primary">Clear</button>
          {teachers.length === 0 && <span className="text-xs text-amber-600">No teachers in this school yet — create one first.</span>}
        </div>
      )}

      {/* Cross-page "select all matching" — selection only ever covers the 50 on
          screen until the admin explicitly opts into the whole filtered set. */}
      {bulkMode && allSelected && count > studentIdsOnPage.length && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-sm">
          {selected.size >= count ? (
            <>
              <span className="text-[var(--foreground)]">
                All <span className="font-bold">{count.toLocaleString("en-IN")}</span> students matching this filter are selected.
              </span>
              <button onClick={() => setSelected(new Set())} className="font-semibold text-primary hover:underline">Clear selection</button>
            </>
          ) : (
            <>
              <span className="text-[var(--muted-foreground)]">
                All <span className="font-semibold text-[var(--foreground)]">{studentIdsOnPage.length}</span> on this page are selected.
              </span>
              <button
                onClick={selectAllMatching}
                disabled={selectingAll}
                className="font-semibold text-primary hover:underline disabled:opacity-60"
              >
                {selectingAll ? "Selecting…" : `Select all ${count.toLocaleString("en-IN")} matching this filter`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        {fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-red-500">{fetchError}</p>
            <button onClick={loadUsers} className="text-xs font-semibold text-primary underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  {bulkMode && (
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all students on this page" className="h-4 w-4 rounded border-[var(--border)] text-primary focus:ring-2 focus:ring-primary/30" />
                    </th>
                  )}
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">School</th>
                  <th className="px-5 py-3">Roll No.</th>
                  <th className="px-5 py-3">Assigned Teacher</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">AI Access</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableRowSkeleton rows={8} columns={colCount} withAvatar />
                ) : users.length === 0 ? (
                  <tr><td colSpan={colCount} className="px-5 py-8">
                    <EmptyState
                      title="No users found"
                      description="Try a different role, school, or search — or generate student logins from Onboard Students."
                      icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                    />
                  </td></tr>
                ) : (
                  users.map((u) => {
                    const fullName = displayName(u);
                    const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                    const status = u.is_active ? "Active" : "Suspended";
                    const statusColor = u.is_active
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-red-50 text-red-600 border-red-200";
                    const isStudent = u.role === "STUDENT";
                    return (
                      <tr key={u.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--muted)]/40">
                        {bulkMode && (
                          <td className="px-4 py-3.5">
                            {isStudent ? (
                              <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleRow(u.id)} aria-label={`Select ${fullName}`} className="h-4 w-4 rounded border-[var(--border)] text-primary focus:ring-2 focus:ring-primary/30" />
                            ) : null}
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                              {initials || "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--foreground)]">{fullName}</p>
                              <p className="text-xs text-[var(--muted-foreground)] font-mono">{u.email}</p>
                              {isStudent && (
                                u.profile_completed
                                  ? <span className="mt-1 inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Activated</span>
                                  : <span className="mt-1 inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-500">Generated · pending</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleColor[u.role]}`}>
                            {roleLabel[u.role]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                          {u.school_name ?? (u.role === "MAIN_ADMIN" ? "Platform" : "—")}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{u.admission_number || "—"}</td>
                        <td className="px-5 py-3.5">
                          {isStudent
                            ? (u.assigned_teacher_name
                                ? <span className="text-[var(--foreground)]">{u.assigned_teacher_name}</span>
                                : <span className="text-xs text-amber-600">Unassigned</span>)
                            : <span className="text-xs text-[var(--muted-foreground)]">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {u.role === "MAIN_ADMIN" ? (
                            <span className="text-xs text-[var(--muted-foreground)]">—</span>
                          ) : (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={u.ai_enabled ?? true}
                              aria-label={`AI access for ${fullName}`}
                              title={(u.ai_enabled ?? true) ? "AI enabled — click to disable for this user" : "AI disabled — click to enable for this user"}
                              onClick={() => toggleAi(u)}
                              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${(u.ai_enabled ?? true) ? "bg-gradient-to-r from-primary to-accent" : "bg-slate-300"}`}
                            >
                              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${(u.ai_enabled ?? true) ? "translate-x-4" : "translate-x-0.5"}`} />
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 text-xs">
                            <button onClick={() => router.push(`/dashboard/admin/users/${u.id}`)} className="inline-flex min-h-8 items-center rounded-md px-2.5 py-1.5 font-semibold text-primary transition-colors hover:bg-primary/10">View</button>
                            <button onClick={() => router.push(`/dashboard/admin/users/${u.id}`)} className="inline-flex min-h-8 items-center rounded-md px-2.5 py-1.5 font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-primary">Edit</button>
                            {u.is_active && (
                              <button onClick={() => setConfirmSuspend(u)} className="inline-flex min-h-8 items-center rounded-md px-2.5 py-1.5 font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-red-50 hover:text-red-600">Suspend</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !fetchError && count > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-3 text-sm">
            <span className="text-[var(--muted-foreground)]">
              Showing <span className="font-semibold text-[var(--foreground)]">{firstRow.toLocaleString("en-IN")}–{lastRow.toLocaleString("en-IN")}</span> of {count.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] disabled:opacity-40 hover:border-primary/40 hover:text-primary"
              >
                Previous
              </button>
              <span className="text-xs text-[var(--muted-foreground)]">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] disabled:opacity-40 hover:border-primary/40 hover:text-primary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]"
            >
              <h3 className="text-base font-bold text-[var(--foreground)]">Suspend user?</h3>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold text-[var(--foreground)]">{displayName(confirmSuspend)}</span> will lose access to the platform immediately. You can reinstate them later.
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
