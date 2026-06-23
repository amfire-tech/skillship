/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/daily-log/page.tsx
 * Purpose: Skillship (roaming) teacher's Daily Log — after each class they pick
 *          a date, type the subject and a description of what they taught, and
 *          submit. The entry is recorded against the school they're currently
 *          working in (X-School-Context) so the Super Admin can see what each
 *          roaming teacher did, where, on which day. Below the form is the
 *          teacher's own recent submissions. Skillship teachers only.
 * Owner:   Pranav
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";

interface LogRow {
  id: string;
  date: string;
  subject: string;
  description: string;
  school_name?: string;
  has_photo?: boolean;
  created_at: string;
}

// Downscale the photo to <=1000px and return a compact JPEG data-URL so the
// upload stays small.
function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function TeacherDailyLogPage() {
  const { user } = useAuth();
  const isSkillship = user?.role === "TEACHER" && user?.teacher_type === "SKILLSHIP";

  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [date, setDate] = useState(todayISO());
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => { document.title = "Daily Log — Skillship"; }, []);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/assignments/teaching-logs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.ok ? asArray<LogRow>(await res.json()) : []);
    } catch {
      setLogs([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setError(null);
    setPhotoBusy(true);
    try {
      const dataUrl = await processImage(file);
      setPhoto(dataUrl);
    } catch {
      setError("Couldn't process that photo — please try another.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function clearPhoto() {
    setPhoto(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    if (!date) {
      setError("Please pick the date.");
      return;
    }
    if (!subject.trim() || !description.trim()) {
      setError("Please fill in both the subject and what you taught.");
      return;
    }
    if (!photo) {
      setError("An attendance photo is required — take or upload one before submitting.");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/assignments/teaching-logs/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          date, subject: subject.trim(), description: description.trim(),
          photo: photo ?? "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setError(data?.detail ?? "Select the school you're working in (top of the page) before submitting.");
        } else {
          setError(data?.subject?.[0] ?? data?.description?.[0] ?? data?.detail ?? "Could not save your log. Try again.");
        }
        return;
      }
      setOkMsg("Saved. Your Super Admin can now see today's class.");
      setSubject("");
      setDescription("");
      setDate(todayISO());
      clearPhoto();
      await load();
    } catch {
      setError("Network error — could not save your log.");
    } finally {
      setSaving(false);
    }
  }

  // A normal SCHOOL teacher should never land here (no nav link) — guard anyway.
  if (user && !isSkillship) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center dark:bg-[var(--background)]">
        <p className="text-sm font-medium text-[var(--foreground)]">The Daily Log is only for Skillship teachers.</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">If you think this is a mistake, contact your Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Daily Log</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          After each class, record what you taught today. Make sure the correct school is selected at the top of the page —
          your entry is logged against that school for the Super Admin.
        </p>
      </div>

      {/* Submission form */}
      <motion.form
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]"
      >
        <div>
          <label htmlFor="log-date" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Date <span className="text-red-500">*</span></label>
          <input
            id="log-date" type="date" value={date} max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full max-w-xs rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-primary dark:bg-[var(--background)]"
          />
        </div>

        <div>
          <label htmlFor="log-subject" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Subject <span className="text-red-500">*</span></label>
          <input
            id="log-subject" type="text" value={subject} placeholder="e.g. Mathematics — Class 9A"
            onChange={(e) => setSubject(e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:border-primary dark:bg-[var(--background)]"
          />
        </div>

        <div>
          <label htmlFor="log-desc" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">What did you teach today? <span className="text-red-500">*</span></label>
          <textarea
            id="log-desc" value={description} rows={5} placeholder="Topics covered, activities done, homework given, anything to note…"
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-y rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-primary dark:bg-[var(--background)]"
          />
        </div>

        {/* Attendance photo (required) */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Attendance photo <span className="font-semibold normal-case text-red-500">*</span>
          </label>

          {photo ? (
            <div className="flex flex-wrap items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="Attendance" className="h-32 w-32 rounded-lg object-cover" />
              <div className="space-y-1.5 text-sm">
                <p className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  Photo attached
                </p>
                <button type="button" onClick={clearPhoto} className="block text-xs font-semibold text-red-500 hover:underline">Remove photo</button>
              </div>
            </div>
          ) : (
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--muted-foreground)] hover:border-primary/40 hover:text-primary ${photoBusy ? "pointer-events-none opacity-60" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              {photoBusy ? "Processing…" : "Take / upload photo"}
              <input type="file" accept="image/*" capture="environment" onChange={onPickPhoto} className="hidden" disabled={photoBusy} />
            </label>
          )}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-500/10">{error}</p>}
        {okMsg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 dark:bg-emerald-500/10">{okMsg}</p>}

        <div className="flex justify-end">
          <button
            type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Submit Today's Log"}
          </button>
        </div>
      </motion.form>

      {/* Recent submissions */}
      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">My Recent Logs</h2>
        </div>
        <div className="p-4">
          {logs === null ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">No logs yet — submit your first one above.</div>
          ) : (
            <ul className="space-y-2">
              {logs.map((l) => (
                <li key={l.id} className="rounded-xl bg-[var(--muted)]/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{l.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      {l.school_name && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{l.school_name}</span>}
                      <span>{fmtDate(l.date)}</span>
                    </div>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{l.description}</p>
                  {l.has_photo && (
                    <div className="mt-2 text-[11px] font-semibold">
                      <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[var(--muted-foreground)]">📷 Photo attached</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
