/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/onboard/page.tsx
 * Purpose: MAIN_ADMIN "Onboard a class" — the on-site student onboarding flow.
 *          Pick a school + class (grade/section), paste/enter the roster, and
 *          the platform generates a login + password per student, creates the
 *          accounts (school-scoped), enrols them into the class, and returns a
 *          printable credentials sheet. Drives the existing secure endpoints:
 *            - /academics/years/ + /academics/classes/  (ensure the class)
 *            - /users/onboard-class/                     (create + enrol)
 * Owner:   Navanish
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { API_BASE, getToken } from "@/lib/auth";

interface SchoolOpt { id: string; name: string }
interface StudentRow { first_name: string; last_name: string; admission_number: string }
interface ResultStudent {
  name: string; admission_number: string;
  email: string; username: string; password: string | null;
  status: "created" | "existing"; enrolled: boolean;
}
interface OnboardResult {
  created_count: number; existing_count: number; error_count: number;
  students: ResultStudent[];
  errors: { index: number; name: string; error: string }[];
}

const EMPTY_ROW: StudentRow = { first_name: "", last_name: "", admission_number: "" };

/** Indian academic year for "today" — e.g. Apr 2025 → "2025-26". */
function currentAcademicYear() {
  const now = new Date();
  const y = now.getFullYear();
  const startYear = now.getMonth() + 1 >= 4 ? y : y - 1; // April = month index 3
  const name = `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
  return { name, start_date: `${startYear}-04-01`, end_date: `${startYear + 1}-03-31` };
}

/** Fetch every page of a paginated DRF list (MAIN_ADMIN sees all tenants, so we
 *  must page through to reliably find this school's rows). */
async function fetchAll(url: string, token: string): Promise<any[]> {
  const out: any[] = [];
  let next: string | null = url;
  for (let guard = 0; next && guard < 50; guard++) {
    const res: Response = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    const data = await res.json();
    out.push(...(data.results ?? (Array.isArray(data) ? data : [])));
    next = data.next ?? null;
  }
  return out;
}

async function firstError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data === "string") return data;
    if (data.detail) return String(data.detail);
    const k = Object.keys(data)[0];
    const v = (data as Record<string, unknown>)[k];
    return `${k}: ${Array.isArray(v) ? v[0] : v}`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export default function OnboardClassPage() {
  const [schools, setSchools] = useState<SchoolOpt[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([{ ...EMPTY_ROW }]);
  const [paste, setPaste] = useState("");

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [classLabel, setClassLabel] = useState("");

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

  function updateRow(i: number, key: keyof StudentRow, val: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function addRow() { setRows((prev) => [...prev, { ...EMPTY_ROW }]); }
  function removeRow(i: number) { setRows((prev) => prev.filter((_, idx) => idx !== i) || [{ ...EMPTY_ROW }]); }

  /** Parse the paste box: one student per line, "First Last, AdmissionNo". */
  function importPaste() {
    const parsed: StudentRow[] = paste
      .split("\n").map((l) => l.trim()).filter(Boolean)
      .map((line) => {
        const [namePart, adm = ""] = line.split(",");
        const words = namePart.trim().split(/\s+/);
        const first = words.shift() ?? "";
        return { first_name: first, last_name: words.join(" "), admission_number: adm.trim() };
      })
      .filter((r) => r.first_name);
    if (parsed.length) {
      setRows((prev) => [...prev.filter((r) => r.first_name.trim()), ...parsed]);
      setPaste("");
    }
  }

  /** Find-or-create the school's current academic year + the grade/section class. */
  async function ensureClass(token: string): Promise<string> {
    setStatus("Ensuring academic year & class…");
    const years = (await fetchAll(`${API_BASE}/academics/years/`, token))
      .filter((y) => String(y.school) === schoolId);
    let year = years.find((y) => y.is_current) ?? years[0];
    if (!year) {
      const ay = currentAcademicYear();
      const res = await fetch(`${API_BASE}/academics/years/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...ay, is_current: true, school: schoolId }),
      });
      if (!res.ok) throw new Error(await firstError(res));
      year = await res.json();
    }

    const gradeNum = Number(grade);
    const sec = section.trim().toUpperCase();
    const classes = (await fetchAll(`${API_BASE}/academics/classes/`, token))
      .filter((c) => String(c.school) === schoolId && String(c.academic_year) === String(year.id));
    let klass = classes.find((c) => Number(c.grade) === gradeNum && String(c.section).toUpperCase() === sec);
    if (!klass) {
      const res = await fetch(`${API_BASE}/academics/classes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ academic_year: year.id, grade: gradeNum, section: sec, school: schoolId }),
      });
      if (!res.ok) throw new Error(await firstError(res));
      klass = await res.json();
    }
    setClassLabel(`Grade ${gradeNum}-${sec} · ${year.name}`);
    return klass.id;
  }

  async function onboard() {
    setError(""); setResult(null);
    const cleanRows = rows.filter((r) => r.first_name.trim());
    if (!schoolId) return setError("Select a school.");
    if (!grade || !section.trim()) return setError("Enter the grade and section.");
    if (cleanRows.length === 0) return setError("Add at least one student.");

    setBusy(true);
    try {
      const token = await getToken();
      if (!token) { setError("Session expired — please sign in again."); return; }

      const klass = await ensureClass(token);

      setStatus(`Creating ${cleanRows.length} accounts & enrolling…`);
      const res = await fetch(`${API_BASE}/users/onboard-class/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ school: schoolId, klass, students: cleanRows }),
      });
      if (!res.ok && res.status !== 207) throw new Error(await firstError(res));
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onboarding failed.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  function downloadCsv() {
    if (!result) return;
    const header = ["Name", "Admission No", "Login (email)", "Username", "Password", "Status"];
    const lines = result.students.map((s) =>
      [s.name, s.admission_number, s.email, s.username, s.password ?? "(existing)", s.status]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credentials-${classLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputCls =
    "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboard a class"
        subtitle="Create student logins and enrol a whole class in one go — hand out the printed credentials."
      />

      {/* ── Setup ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(5,150,105,0.2)]">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">School</span>
            <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className={inputCls}>
              <option value="">— Select a school —</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">Grade</span>
            <input value={grade} onChange={(e) => setGrade(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 10" className={inputCls} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">Section</span>
            <input value={section} onChange={(e) => setSection(e.target.value.toUpperCase().slice(0, 4))} placeholder="e.g. A" className={inputCls} />
          </label>
        </div>
      </div>

      {/* ── Roster ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(5,150,105,0.2)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-bold text-[var(--foreground)]">Students</p>
          <span className="text-xs text-[var(--muted-foreground)]">Login email & password are generated automatically</span>
        </div>

        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_140px_36px] gap-2">
              <input value={r.first_name} onChange={(e) => updateRow(i, "first_name", e.target.value)} placeholder="First name" className={inputCls} />
              <input value={r.last_name} onChange={(e) => updateRow(i, "last_name", e.target.value)} placeholder="Last name" className={inputCls} />
              <input value={r.admission_number} onChange={(e) => updateRow(i, "admission_number", e.target.value)} placeholder="Adm. no (opt)" className={inputCls} />
              <button onClick={() => removeRow(i)} aria-label="Remove row" className="grid h-10 w-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-300 hover:text-red-500">×</button>
            </div>
          ))}
        </div>
        <button onClick={addRow} className="mt-3 text-sm font-semibold text-primary hover:underline">+ Add student</button>

        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <p className="mb-2 text-xs font-semibold text-[var(--muted-foreground)]">Or paste a list — one per line: <code>First Last, AdmissionNo</code></p>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={3}
            placeholder={"Aarav Sharma, 23-1042\nDiya Patel"}
            className="w-full rounded-lg border border-[var(--border)] bg-white p-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          <button onClick={importPaste} disabled={!paste.trim()} className="mt-2 text-sm font-semibold text-primary hover:underline disabled:opacity-40">Import pasted students</button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-3">
        <button onClick={onboard} disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60">
          {busy ? "Working…" : "Create logins & enrol"}
        </button>
        {busy && status && <span className="text-sm text-[var(--muted-foreground)]">{status}</span>}
      </div>

      {/* ── Results ── */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(5,150,105,0.2)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-bold text-[var(--foreground)]">{classLabel}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {result.created_count} created · {result.existing_count} already existed · {result.error_count} errors
              </p>
            </div>
            <button onClick={downloadCsv}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 text-sm font-semibold text-primary hover:bg-primary/10">
              Download credentials (CSV)
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]/50 text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Login (email)</th>
                  <th className="px-3 py-2">Password</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.students.map((s, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2 font-medium text-[var(--foreground)]">{s.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.email}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.password ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.status === "created" ? "bg-primary/10 text-primary" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {result.errors.map((e, i) => <p key={i}>Row {e.index + 1} ({e.name}): {e.error}</p>)}
            </div>
          )}
          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            Passwords are shown once here — download the CSV now. To reset a password later, use the user's profile.
          </p>
        </motion.div>
      )}
    </div>
  );
}
