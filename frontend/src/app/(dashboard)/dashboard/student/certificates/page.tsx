/*
 * File:    frontend/src/app/(dashboard)/dashboard/student/certificates/page.tsx
 * Purpose: Student certificates list + download.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage } from "@/providers/LanguageProvider";

interface Certificate {
  id: string;
  title?: string;
  quiz_title?: string;
  subject?: string;
  issued_at?: string;
  expires_at?: string;
  score?: number;
  download_url?: string;
  preview_url?: string;
  badge?: "GOLD" | "SILVER" | "BRONZE";
}

function fmtDate(iso?: string) { if (!iso) return "—"; try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; } }

const BADGE_TONE: Record<string, string> = {
  GOLD:   "from-amber-300 to-amber-500",
  SILVER: "from-slate-300 to-slate-500",
  BRONZE: "from-orange-300 to-orange-500",
};

export default function CertificatesPage() {
  const toast = useToast();
  const { t } = useLanguage();
  const [certs, setCerts] = useState<Certificate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      // A certificate exists for an attempt only when the teacher enabled
      // certificates for that quiz AND the student passed it — the backend
      // exposes that as `certificate_available` on each attempt.
      const res = await apiFetch(`/quizzes/attempts/`);
      if (!res.ok) { setError(`Failed (${res.status})`); setCerts([]); return; }
      type Attempt = {
        id: string;
        quiz_title?: string;
        quiz_subject?: string;
        status?: string;
        score_percent?: number | null;
        submitted_at?: string;
        passed?: boolean | null;
        certificate_available?: boolean | null;
      };
      const list = asArray<Attempt>(await res.json());
      const earned: Certificate[] = list
        .filter((a) => a.certificate_available === true)
        .map((a) => ({
          id:         a.id,
          title:      a.quiz_title ? `${a.quiz_title} — Certificate of Achievement` : "Certificate",
          quiz_title: a.quiz_title,
          subject:    a.quiz_subject,
          score:      a.score_percent ?? undefined,
          issued_at:  a.submitted_at,
        }));
      setCerts(earned);
    } catch {
      setError("Network error.");
      setCerts([]);
    }
  }, []);

  useEffect(() => { document.title = "Certificates — Skillship"; }, []);
  useEffect(() => { load(); }, [load]);

  function deriveBadge(c: Certificate): "GOLD" | "SILVER" | "BRONZE" {
    if (c.badge) return c.badge;
    const s = c.score ?? 0;
    if (s >= 90) return "GOLD";
    if (s >= 75) return "SILVER";
    return "BRONZE";
  }

  function fileName(c: Certificate) {
    return `${(c.quiz_title ?? "skillship").replace(/[^a-z0-9]+/gi, "_")}-certificate.pdf`;
  }

  // Certificate PDFs are auth-protected, so we fetch the bytes (Bearer token via
  // apiFetch) and hand the browser a blob rather than a bare <a href>.
  async function fetchCertBlob(c: Certificate): Promise<Blob | null> {
    try {
      const res = await apiFetch(`/quizzes/attempts/${c.id}/certificate/`);
      if (!res.ok) { toast(`Couldn't load certificate (${res.status})`, "error"); return null; }
      return await res.blob();
    } catch {
      toast("Network error", "error");
      return null;
    }
  }

  async function downloadCertificate(c: Certificate) {
    const blob = await fetchCertBlob(c);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName(c);
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  async function viewCertificate(c: Certificate) {
    const blob = await fetchCertBlob(c);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function shareCertificate(c: Certificate) {
    const blob = await fetchCertBlob(c);
    if (!blob) return;
    const file = new File([blob], fileName(c), { type: "application/pdf" });
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: c.title ?? "My Certificate", text: "I earned a certificate on Skillship!" });
      } catch { /* user dismissed the share sheet */ }
      return;
    }
    // No Web Share support (most desktops) — download so they can attach/share it.
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName(c);
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast("Downloaded — you can now share the certificate file", "info");
  }

  const filtered = useMemo(() => {
    if (!certs) return null;
    const q = search.trim().toLowerCase();
    return certs.filter((c) => !q || (c.title ?? c.quiz_title ?? "").toLowerCase().includes(q) || (c.subject ?? "").toLowerCase().includes(q));
  }, [certs, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{t("Certificates")}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{certs === null ? t("Loading…") : `${certs.length} ${t("earned")}`}</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </span>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Search by title or subject…")} className="h-10 w-full max-w-md rounded-full border border-[var(--border)] bg-white pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-[var(--background)]" />
      </div>

      {filtered === null ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-[var(--muted)]/40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("No certificates yet")}
          description={certs?.length === 0 ? t("Pass a published quiz to earn your first certificate.") : t("No matches for that search.")}
          action={certs?.length === 0 ? { label: t("Browse quizzes"), href: "/dashboard/student/quizzes" } : undefined}
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6" /><path d="m9 14 -2 7 5 -3 5 3 -2 -7" /></svg>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => {
            const badge = deriveBadge(c);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.04 * i }}
                className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(5,150,105,0.25)] dark:bg-[var(--background)]"
              >
                <div className={`relative h-32 bg-gradient-to-br ${BADGE_TONE[badge]} p-5 text-white`}>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6" /><path d="m9 14 -2 7 5 -3 5 3 -2 -7" /></svg>
                    </div>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">{badge}</span>
                  </div>
                  {typeof c.score === "number" && <p className="absolute bottom-4 left-5 text-2xl font-bold">{Math.round(c.score)}%</p>}
                </div>
                <div className="space-y-3 p-5">
                  <div>
                    <p className="text-sm font-bold text-[var(--foreground)]">{c.title ?? c.quiz_title ?? t("Skillship Certificate")}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{c.subject ?? ""}{c.subject && c.issued_at ? " · " : ""}{t("Issued")} {fmtDate(c.issued_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadCertificate(c)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 text-xs font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                      {t("Download")}
                    </button>
                    <button type="button" onClick={() => viewCertificate(c)} aria-label="View certificate" title="View" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-primary/30 hover:text-primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                    <button type="button" onClick={() => shareCertificate(c)} aria-label="Share certificate" title="Share" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-primary/30 hover:text-primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
