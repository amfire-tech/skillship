/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/onboard/page.tsx
 * Purpose: MAIN_ADMIN "Onboard students" — one-click bulk credential generation.
 *          Pick a school, enter how many logins you need, and the platform mints
 *          that many unique, random STUDENT credentials (no names yet). Download
 *          the printable CSV, hand one slip to each student; the student fills in
 *          their own name / roll / class on first login (then it locks).
 *          Drives: /schools/ (list) + /users/generate-credentials/ (mint).
 * Owner:   Navanish
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { API_BASE, getToken } from "@/lib/auth";

interface SchoolOpt { id: string; name: string }
interface GeneratedStudent { index: number; email: string; username: string; password: string }
interface GenerateResult {
  generated_count: number;
  error_count: number;
  school_name: string;
  students: GeneratedStudent[];
  errors: { index: number; error: string }[];
}

const MAX_COUNT = 500;

/** Fetch every page of a paginated DRF list (MAIN_ADMIN sees all tenants, so we
 *  must page through to reliably list every school). */
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

export default function OnboardStudentsPage() {
  const [schools, setSchools] = useState<SchoolOpt[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [count, setCount] = useState("30");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);

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

  const schoolName = schools.find((s) => s.id === schoolId)?.name ?? "";

  async function generate() {
    setError(""); setResult(null);
    const n = Number(count);
    if (!schoolId) return setError("Select a school.");
    if (!Number.isInteger(n) || n < 1) return setError("Enter how many credentials to generate.");
    if (n > MAX_COUNT) return setError(`You can generate at most ${MAX_COUNT} at a time.`);

    setBusy(true);
    try {
      const token = await getToken();
      if (!token) { setError("Session expired — please sign in again."); return; }

      const res = await fetch(`${API_BASE}/users/generate-credentials/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ school: schoolId, count: n }),
      });
      if (!res.ok && res.status !== 207) throw new Error(await firstError(res));
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    if (!result) return;
    // Last column is intentionally blank — the admin writes each student's name
    // on the printed slip before handing it out.
    const header = ["Sr. No", "Login (email)", "Password", "Student name"];
    const lines = result.students.map((s, i) =>
      [String(i + 1), s.email, s.password, ""]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const tag = (result.school_name || schoolName || "school").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `credentials-${tag}-${result.students.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputCls =
    "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboard students"
        subtitle="Pick a school, generate that many login credentials in one click, and download the printable sheet — students fill in their own details on first login."
      />

      {/* ── Generator ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(5,150,105,0.2)]">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">School</span>
            <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className={inputCls}>
              <option value="">— Select a school —</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">How many credentials</span>
            <input
              type="number" min={1} max={MAX_COUNT} value={count}
              onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 100" className={inputCls}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Each credential is a unique, random login &amp; password. No names or class needed now — up to {MAX_COUNT} at a time.
        </p>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-3">
        <button onClick={generate} disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60">
          {busy ? "Generating…" : "Generate credentials"}
        </button>
        {busy && <span className="text-sm text-[var(--muted-foreground)]">Creating accounts…</span>}
      </div>

      {/* ── Results ── */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(5,150,105,0.2)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-bold text-[var(--foreground)]">{result.school_name}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {result.generated_count} credential{result.generated_count === 1 ? "" : "s"} generated
                {result.error_count > 0 ? ` · ${result.error_count} failed` : ""}
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
                  <th className="px-3 py-2 w-16">Sr. No</th>
                  <th className="px-3 py-2">Login (email)</th>
                  <th className="px-3 py-2">Password</th>
                </tr>
              </thead>
              <tbody>
                {result.students.map((s, i) => (
                  <tr key={s.email} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2 text-[var(--muted-foreground)]">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.email}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {result.errors.map((e, i) => <p key={i}>Row {e.index + 1}: {e.error}</p>)}
            </div>
          )}
          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            Passwords are shown once here — download the CSV now. Hand one slip to each student;
            they set their own name, roll number, class &amp; section on first login.
          </p>
        </motion.div>
      )}
    </div>
  );
}
