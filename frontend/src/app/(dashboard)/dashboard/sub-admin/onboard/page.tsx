/*
 * File:    frontend/src/app/(dashboard)/dashboard/sub-admin/onboard/page.tsx
 * Purpose: Sub-admin onboarding — mint blank login credentials for the school
 *          the sub-admin is currently acting in (X-School-Context). No school
 *          picker: the active school is implicit and the backend forces it.
 *          Student vs teacher mode is shown only for the capabilities the super
 *          admin granted for this school. Mirrors the super-admin onboard flow.
 *          Drives: /users/generate-credentials/ (role-aware, capability-gated).
 * Owner:   Pranav
 */

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { apiFetch } from "@/lib/auth";
import { useSubAdminAccess, currentGrant } from "@/store/subAdminAccess";

type Mode = "STUDENT" | "TEACHER";

interface GeneratedRow { index: number; email: string; username: string; password: string }
interface GenerateResult {
  generated_count: number;
  error_count: number;
  school_name: string;
  students: GeneratedRow[];
  errors: { index: number; error: string }[];
}

const MAX_COUNT = 500;

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

export default function SubAdminOnboardPage() {
  const grant = useSubAdminAccess(currentGrant);
  const grants = useSubAdminAccess((s) => s.grants);

  const canStudents = !!grant?.can_onboard_students;
  const canTeachers = !!grant?.can_onboard_teachers;
  const schoolName = grant?.school_name ?? "your current school";

  // Default to whichever mode is granted (students first).
  const [mode, setMode] = useState<Mode>("STUDENT");
  const effectiveMode: Mode = mode === "TEACHER" && canTeachers ? "TEACHER" : "STUDENT";

  const [count, setCount] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);

  const noAccess = useMemo(() => !canStudents && !canTeachers, [canStudents, canTeachers]);

  async function generate() {
    setError(""); setResult(null);
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1) return setError("Enter how many credentials to generate.");
    if (n > MAX_COUNT) return setError(`You can generate at most ${MAX_COUNT} at a time.`);

    setBusy(true);
    try {
      // No `school` in the body — the backend pins it to the acting
      // X-School-Context school (sent automatically once a school is selected).
      const res = await apiFetch(`/users/generate-credentials/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: n, role: effectiveMode }),
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
    const noun = effectiveMode === "TEACHER" ? "Teacher" : "Student";
    const header = ["Sr. No", "Login (email)", "Password", `${noun} name`];
    const lines = result.students.map((s, i) =>
      [String(i + 1), s.email, s.password, ""]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const tag = (result.school_name || schoolName || "school").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `${noun.toLowerCase()}-credentials-${tag}-${result.students.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputCls =
    "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]";

  // Grants still loading.
  if (grants === null) {
    return <div className="h-40 animate-pulse rounded-2xl bg-[var(--muted)]/40" />;
  }

  if (noAccess) {
    return (
      <div className="space-y-6">
        <PageHeader title="Onboard users" subtitle="Generate login credentials for your school." />
        <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-6 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          You don&apos;t have onboarding access for <span className="font-semibold">{schoolName}</span>.
          Ask the super admin to grant student or teacher onboarding for this school
          {grants.length > 1 ? ", or switch to another school above." : "."}
        </div>
      </div>
    );
  }

  const noun = effectiveMode === "TEACHER" ? "teacher" : "student";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboard users"
        subtitle={`Generate login credentials for ${schoolName} in one click, then download the printable sheet.`}
      />

      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(5,150,105,0.2)] dark:bg-[var(--background)]">
        {/* Mode switch — only the granted options appear */}
        {canStudents && canTeachers && (
          <div className="mb-4 inline-flex rounded-xl border border-[var(--border)] p-1">
            {(["STUDENT", "TEACHER"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setResult(null); setError(""); }}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${effectiveMode === m ? "bg-gradient-to-r from-primary to-accent text-white" : "text-[var(--muted-foreground)] hover:text-primary"}`}
              >
                {m === "STUDENT" ? "Students" : "Teachers"}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="grid gap-1.5">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">School</span>
            <div className={`${inputCls} flex items-center font-medium text-[var(--foreground)]`}>{schoolName}</div>
          </div>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">How many {noun} logins</span>
            <input
              type="number" min={1} max={MAX_COUNT} value={count}
              onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 40" className={inputCls}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Each credential is a unique, random login &amp; password — up to {MAX_COUNT} at a time.
          {effectiveMode === "STUDENT"
            ? " Students fill in their own name, roll number and class on first login."
            : " Teacher names can be set later from the admin."}
        </p>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-3">
        <button onClick={generate} disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60">
          {busy ? "Generating…" : `Generate ${noun} credentials`}
        </button>
        {busy && <span className="text-sm text-[var(--muted-foreground)]">Creating accounts…</span>}
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(5,150,105,0.2)] dark:bg-[var(--background)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-bold text-[var(--foreground)]">{result.school_name}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {result.generated_count} {noun} credential{result.generated_count === 1 ? "" : "s"} generated
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
            Passwords are shown once here — download the CSV now and hand one slip to each {noun}.
          </p>
        </motion.div>
      )}
    </div>
  );
}
