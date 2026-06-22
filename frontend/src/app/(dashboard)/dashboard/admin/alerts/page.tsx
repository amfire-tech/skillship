/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/alerts/page.tsx
 * Purpose: Super-admin alert composer — send a dashboard + browser-push alert to
 *          a chosen school's principal and/or teachers (payment reminders,
 *          guidance, or general notices). Posts to /notifications/admin/send/.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";

interface SchoolOpt { id: string; name: string; city?: string }

const CATEGORIES = [
  { value: "PAYMENT", label: "Payment reminder" },
  { value: "GUIDANCE", label: "Guidance" },
  { value: "GENERAL", label: "General notice" },
];

export default function AdminAlertsPage() {
  const toast = useToast();
  const [schools, setSchools] = useState<SchoolOpt[]>([]);
  const [school, setSchool] = useState("");
  const [toPrincipal, setToPrincipal] = useState(true);
  const [toTeacher, setToTeacher] = useState(false);
  const [toStudent, setToStudent] = useState(false);
  const [toSubAdmin, setToSubAdmin] = useState(false);
  const [category, setCategory] = useState("PAYMENT");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { document.title = "Send Alert — Skillship"; }, []);

  const loadSchools = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/schools/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const list = asArray<SchoolOpt>(await res.json());
        setSchools(list);
        if (list[0]) setSchool(list[0].id);
      }
    } catch { /* surfaced on send */ }
  }, []);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  async function send() {
    setError(null);
    const roles = [
      toPrincipal && "PRINCIPAL",
      toTeacher && "TEACHER",
      toStudent && "STUDENT",
      toSubAdmin && "SUB_ADMIN",
    ].filter(Boolean);
    if (!school) { setError("Pick a school."); return; }
    if (roles.length === 0) { setError("Choose at least one recipient group."); return; }
    if (!title.trim()) { setError("Add a title."); return; }
    if (!body.trim()) { setError("Add a message."); return; }

    setSending(true);
    const token = await getToken();
    if (!token) { setError("Session expired."); setSending(false); return; }
    try {
      const res = await fetch(`${API_BASE}/notifications/admin/send/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ school, roles, category, title: title.trim(), body: body.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        toast(`Alert sent to ${data.sent} recipient${data.sent === 1 ? "" : "s"}`, "success");
        setTitle("");
        setBody("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(Object.values(data).flat().join(" ") || "Failed to send alert.");
      }
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setSending(false);
    }
  }

  const inputCls = "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]";

  return (
    <div className="space-y-6">
      <PageHeader title="Send Alert" subtitle="Notify a school's principal, teachers, students or sub-admins — on their dashboard and via browser push" />

      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />
        <div className="space-y-5 p-6 md:p-8">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          {/* School */}
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-[var(--muted-foreground)]">School</label>
            <select value={school} onChange={(e) => setSchool(e.target.value)} className={inputCls}>
              {schools.length === 0 && <option value="">No schools found</option>}
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` · ${s.city}` : ""}</option>)}
            </select>
          </div>

          {/* Recipients */}
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-[var(--muted-foreground)]">Send to</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { on: toPrincipal, set: setToPrincipal, label: "Principal" },
                { on: toTeacher, set: setToTeacher, label: "Teachers" },
                { on: toStudent, set: setToStudent, label: "Students" },
                { on: toSubAdmin, set: setToSubAdmin, label: "Sub-Admins" },
              ].map((r) => (
                <button key={r.label} type="button" onClick={() => r.set(!r.on)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${r.on ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20" : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-primary/30"}`}>
                  {r.on ? "✓ " : ""}{r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-[var(--muted-foreground)]">Type</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Title */}
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-[var(--muted-foreground)]">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
              placeholder={category === "PAYMENT" ? "e.g. Payment reminder — April invoice" : "e.g. Update your class plans"} className={inputCls} />
          </div>

          {/* Message */}
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-[var(--muted-foreground)]">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
              placeholder="Write the alert message…"
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]" />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={send} disabled={sending}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-70">
              {sending ? "Sending…" : "Send Alert"}
            </button>
          </div>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Recipients see this on their dashboard bell immediately, and as a browser notification if they&apos;ve enabled alerts.
          </p>
        </div>
      </div>
    </div>
  );
}
