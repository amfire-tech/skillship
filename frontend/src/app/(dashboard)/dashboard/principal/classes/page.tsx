/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/academics/page.tsx
 * Purpose: Academics management — AcademicYear, Class, Course, Enrollment.
 *          Each tab fetches its list on mount, supports create-and-refresh.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { getToken, API_BASE } from "@/lib/auth";
import { asArray } from "@/lib/api";

type Tab = "years" | "classes" | "courses" | "enrollment";

const TABS: { id: Tab; label: string }[] = [
  { id: "years",      label: "Academic Years" },
  { id: "classes",    label: "Classes" },
  { id: "courses",    label: "Courses" },
  { id: "enrollment", label: "Enrollment" },
];

// ─── Shared bits ─────────────────────────────────────────────────────────────
function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function FormShell({
  children,
  open,
  onToggle,
  description,
  ctaLabel,
}: {
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  description: string;
  ctaLabel: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {open ? "Cancel" : ctaLabel}
        </button>
      </div>
      {open && children}
    </>
  );
}

function TableShell({
  cols,
  loading,
  empty,
  rows,
}: {
  cols: string[];
  loading: boolean;
  empty: string;
  rows: React.ReactNode[];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white dark:bg-[var(--background)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {cols.map((c) => <th key={c} className="px-5 py-3">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-[var(--border)]/50 last:border-0">
                {cols.map((c) => (
                  <td key={c} className="px-5 py-3.5">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--muted)]" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr><td colSpan={cols.length} className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">{empty}</td></tr>
          ) : (
            rows
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Academic Year ────────────────────────────────────────────────────────────
interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

function YearsTab() {
  const [items, setItems] = useState<AcademicYear[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) { setItems([]); return; }
    try {
      const res = await fetch(`${API_BASE}/academics/years/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setItems([]); return; }
      setItems(asArray<AcademicYear>(await res.json()));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { setError("Authentication failed."); setSaving(false); return; }
      const res = await fetch(`${API_BASE}/academics/years/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name, start_date: startDate, end_date: endDate }),
      });
      if (!res.ok) { setError("Failed to create academic year."); return; }
      setName(""); setStartDate(""); setEndDate("");
      setShowForm(false);
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <FormShell
        description="Manage academic years for your school."
        ctaLabel="+ New Year"
        open={showForm}
        onToggle={() => { setShowForm((v) => !v); setError(null); }}
      >
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Add Academic Year</h3>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Name"><input required placeholder="e.g. 2025–26" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
            <Field label="Start Date"><input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} /></Field>
            <Field label="End Date"><input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} /></Field>
          </div>
          <button type="submit" disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving…" : "Save Year"}
          </button>
        </form>
      </FormShell>

      <TableShell
        cols={["Name", "Start", "End", "Status"]}
        loading={items === null}
        empty="No academic years yet."
        rows={(items ?? []).map((y) => (
          <tr key={y.id} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--muted)]/30">
            <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">{y.name}</td>
            <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{fmtDate(y.start_date)}</td>
            <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{fmtDate(y.end_date)}</td>
            <td className="px-5 py-3.5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${y.is_active ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                {y.is_active ? "Active" : "Inactive"}
              </span>
            </td>
          </tr>
        ))}
      />
    </div>
  );
}

// ─── Classes ─────────────────────────────────────────────────────────────────
interface ClassRow {
  id: string;
  name: string;
  academic_year?: string;
  academic_year_name?: string;
  student_count?: number;
}

function ClassesTab() {
  const [items, setItems] = useState<ClassRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) { setItems([]); return; }
    try {
      const res = await fetch(`${API_BASE}/academics/classes/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setItems([]); return; }
      setItems(asArray<ClassRow>(await res.json()));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { setError("Authentication failed."); setSaving(false); return; }
      const res = await fetch(`${API_BASE}/academics/classes/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: sectionName, academic_year: academicYear }),
      });
      if (!res.ok) { setError("Failed to create class."); return; }
      setSectionName(""); setAcademicYear("");
      setShowForm(false);
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <FormShell
        description="Create and manage classrooms. Each class belongs to an academic year."
        ctaLabel="+ New Class"
        open={showForm}
        onToggle={() => { setShowForm((v) => !v); setError(null); }}
      >
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Add Class</h3>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Section Name"><input required placeholder="e.g. Class 9A" value={sectionName} onChange={(e) => setSectionName(e.target.value)} className={inputCls} /></Field>
            <Field label="Academic Year ID"><input required placeholder="Paste year UUID" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className={inputCls} /></Field>
          </div>
          <button type="submit" disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving…" : "Save Class"}
          </button>
        </form>
      </FormShell>

      <TableShell
        cols={["Class", "Academic Year", "Students"]}
        loading={items === null}
        empty="No classes yet."
        rows={(items ?? []).map((c) => (
          <tr key={c.id} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--muted)]/30">
            <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">{c.name}</td>
            <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{c.academic_year_name ?? c.academic_year ?? "—"}</td>
            <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{c.student_count ?? "—"}</td>
          </tr>
        ))}
      />
    </div>
  );
}

// ─── Courses ─────────────────────────────────────────────────────────────────
interface CourseRow {
  id: string;
  name: string;
  code?: string;
  subject?: string;
  teacher_name?: string;
}

function CoursesTab() {
  const [items, setItems] = useState<CourseRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [subject, setSubject] = useState("");

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) { setItems([]); return; }
    try {
      const res = await fetch(`${API_BASE}/academics/courses/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setItems([]); return; }
      setItems(asArray<CourseRow>(await res.json()));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { setError("Authentication failed."); setSaving(false); return; }
      const res = await fetch(`${API_BASE}/academics/courses/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, subject }),
      });
      if (!res.ok) { setError("Failed to create course."); return; }
      setName(""); setCode(""); setSubject("");
      setShowForm(false);
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <FormShell
        description="Define courses offered by your school. Assign teachers from the Users panel."
        ctaLabel="+ New Course"
        open={showForm}
        onToggle={() => { setShowForm((v) => !v); setError(null); }}
      >
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Add Course</h3>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Name"><input required placeholder="e.g. Mathematics" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
            <Field label="Code"><input placeholder="e.g. MATH9" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} /></Field>
            <Field label="Subject"><input placeholder="e.g. Math" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} /></Field>
          </div>
          <button type="submit" disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving…" : "Save Course"}
          </button>
        </form>
      </FormShell>

      <TableShell
        cols={["Course", "Code", "Subject", "Teacher"]}
        loading={items === null}
        empty="No courses yet."
        rows={(items ?? []).map((c) => (
          <tr key={c.id} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--muted)]/30">
            <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">{c.name}</td>
            <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{c.code ?? "—"}</td>
            <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{c.subject ?? "—"}</td>
            <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{c.teacher_name ?? "—"}</td>
          </tr>
        ))}
      />
    </div>
  );
}

// ─── Enrollment ──────────────────────────────────────────────────────────────
interface EnrollmentRow {
  id: string;
  student?: string;
  student_name?: string;
  course?: string;
  course_name?: string;
  class_name?: string;
  enrolled_at?: string;
  created_at?: string;
}

function EnrollmentTab() {
  const [items, setItems] = useState<EnrollmentRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState("");
  const [course, setCourse] = useState("");

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) { setItems([]); return; }
    try {
      const res = await fetch(`${API_BASE}/academics/enrollments/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setItems([]); return; }
      setItems(asArray<EnrollmentRow>(await res.json()));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { setError("Authentication failed."); setSaving(false); return; }
      const res = await fetch(`${API_BASE}/academics/enrollments/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ student, course }),
      });
      if (!res.ok) { setError("Failed to enroll student."); return; }
      setStudent(""); setCourse("");
      setShowForm(false);
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <FormShell
        description="Enroll students into courses."
        ctaLabel="+ New Enrollment"
        open={showForm}
        onToggle={() => { setShowForm((v) => !v); setError(null); }}
      >
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Enroll Student</h3>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Student ID"><input required placeholder="Paste student UUID" value={student} onChange={(e) => setStudent(e.target.value)} className={inputCls} /></Field>
            <Field label="Course ID"><input required placeholder="Paste course UUID" value={course} onChange={(e) => setCourse(e.target.value)} className={inputCls} /></Field>
          </div>
          <button type="submit" disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
            {saving ? "Enrolling…" : "Enroll"}
          </button>
        </form>
      </FormShell>

      <TableShell
        cols={["Student", "Course / Class", "Enrolled On"]}
        loading={items === null}
        empty="No enrollments yet."
        rows={(items ?? []).map((e) => (
          <tr key={e.id} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--muted)]/30">
            <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">{e.student_name ?? e.student ?? "—"}</td>
            <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{e.course_name ?? e.class_name ?? e.course ?? "—"}</td>
            <td className="px-5 py-3.5 text-[var(--muted-foreground)]">{fmtDate(e.enrolled_at ?? e.created_at)}</td>
          </tr>
        ))}
      />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const inputCls =
  "rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:bg-[var(--background)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</label>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AcademicsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("years");

  useEffect(() => {
    document.title = "Academics — Skillship";
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Academics Management</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Manage academic structure — years, classes, courses, and student enrollment.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === t.id
                ? "bg-white shadow-sm text-[var(--foreground)] dark:bg-[var(--background)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "years"      && <YearsTab />}
      {activeTab === "classes"    && <ClassesTab />}
      {activeTab === "courses"    && <CoursesTab />}
      {activeTab === "enrollment" && <EnrollmentTab />}
    </div>
  );
}
