/*
 * File:    frontend/src/app/(dashboard)/dashboard/teacher/profile/page.tsx
 * Purpose: Skillship (roaming) teacher's profile — the only thing they set
 *          themselves is their photo (so an unfamiliar school's principal can
 *          recognise them on "Today's Teacher"). Everything else — which
 *          school/class/subject they're scheduled for — is read straight from
 *          their existing visit schedule (/assignments/skillship/mine/), never
 *          re-entered here. Skillship teachers only.
 * Owner:   Pranav
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { displayName } from "@/types";

interface MineRow {
  id: string;
  school_name: string;
  klass_label?: string;
  subject?: string;
  weekdays?: number[];
  specific_dates?: string[];
  note?: string;
}

// Downscale the photo to <=600px (an avatar needs far less than a daily-log
// proof photo) and return a compact JPEG data-URL.
function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const max = 600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const isSkillship = user?.role === "TEACHER" && user?.teacher_type === "SKILLSHIP";

  const [photo, setPhoto] = useState<string | null | undefined>(user?.profile_photo);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<MineRow[] | null>(null);

  useEffect(() => { document.title = "My Profile — Skillship"; }, []);
  useEffect(() => { setPhoto(user?.profile_photo); }, [user?.profile_photo]);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/assignments/skillship/mine/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.ok ? asArray<MineRow>(await res.json()) : []);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function savePhoto(dataUrl: string) {
    setError(null);
    setOkMsg(null);
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/auth/profile-photo/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ photo: dataUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.photo?.[0] ?? data?.detail ?? "Could not save your photo. Try again.");
        return;
      }
      const updated = await res.json();
      setPhoto(updated.profile_photo ?? "");
      useAuthStore.getState().setUser(updated);
      setOkMsg(dataUrl ? "Photo updated." : "Photo removed.");
    } catch {
      setError("Network error — could not save your photo.");
    } finally {
      setSaving(false);
    }
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await processImage(file);
      await savePhoto(dataUrl);
    } catch {
      setError("Couldn't process that photo — please try another.");
    } finally {
      setPhotoBusy(false);
    }
  }

  // A normal SCHOOL teacher should never land here (no nav link) — guard anyway.
  if (user && !isSkillship) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center dark:bg-[var(--background)]">
        <p className="text-sm font-medium text-[var(--foreground)]">My Profile is only for Skillship teachers.</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">If you think this is a mistake, contact your Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">My Profile</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Set your photo so a school's principal can recognise you when you visit. Your school, class and subject
          are taken from your visit schedule below — ask your Super Admin if anything there needs changing.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]"
      >
        <div className="flex flex-wrap items-center gap-5">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Profile" className="h-24 w-24 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {user ? displayName(user).slice(0, 1).toUpperCase() : "?"}
            </div>
          )}
          <div className="space-y-2">
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] hover:border-primary/40 hover:text-primary ${photoBusy || saving ? "pointer-events-none opacity-60" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              {photoBusy ? "Processing…" : saving ? "Saving…" : photo ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" onChange={onPickPhoto} className="hidden" disabled={photoBusy || saving} />
            </label>
            {photo && (
              <button type="button" onClick={() => savePhoto("")} disabled={photoBusy || saving} className="block text-xs font-semibold text-red-500 hover:underline disabled:opacity-60">
                Remove photo
              </button>
            )}
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-500/10">{error}</p>}
        {okMsg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 dark:bg-emerald-500/10">{okMsg}</p>}
      </motion.div>

      {/* Schedule, read-only — same data the home "My Teaching Schedule" card shows */}
      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h2 className="text-base font-bold tracking-tight text-[var(--foreground)]">My Schools & Subjects</h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Set by your Super Admin — shown to principals on "Today's Teacher".</p>
        </div>
        <div className="p-4">
          {rows === null ? (
            <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--muted)]/40" />)}</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">No active assignments yet.</div>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="rounded-xl bg-[var(--muted)]/30 p-4">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {r.school_name}{r.klass_label ? ` · ${r.klass_label}` : ""}
                  </p>
                  {r.subject && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Subject: {r.subject}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
