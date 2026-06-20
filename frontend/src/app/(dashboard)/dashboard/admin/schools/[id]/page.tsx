"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import BillingPanel from "@/components/billing/BillingPanel";
import { API_BASE, getToken } from "@/lib/auth";
import { fileToLogoDataUrl, ACCEPTED_LOGO_TYPES } from "@/lib/logo";

interface ApiSchool {
  id: string;
  name: string;
  slug: string;
  board: string;
  city: string;
  state: string;
  address: string;
  plan: string;
  is_active: boolean;
  logo: string;
  created_at: string;
  updated_at: string;
}

const boardLabel: Record<string, string> = { CBSE: "CBSE", ICSE: "ICSE", STATE: "State Board" };
const planLabel: Record<string, string> = { CORE: "Core", AGENTIC: "Agentic" };

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>
  </div>
);

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [school, setSchool] = useState<ApiSchool | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", board: "", city: "", state: "", address: "", logo: "" });
  const [saving, setSaving] = useState(false);
  const [logoErr, setLogoErr] = useState<string | null>(null);

  async function handleLogoPick(file?: File) {
    if (!file) return;
    setLogoErr(null);
    try {
      const dataUrl = await fileToLogoDataUrl(file);
      setForm((f) => ({ ...f, logo: dataUrl }));
    } catch (err) {
      setLogoErr(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = await getToken();
    if (!token) { setFetchError("Session expired."); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/schools/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setFetchError(res.status === 404 ? "School not found." : "Failed to load school."); setLoading(false); return; }
      const data: ApiSchool = await res.json();
      setSchool(data);
      setForm({ name: data.name, board: data.board, city: data.city, state: data.state, address: data.address, logo: data.logo ?? "" });
    } catch {
      setFetchError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!school) return;
    setSaving(true);
    const token = await getToken();
    if (!token) { setSaving(false); return; }
    try {
      const res = await fetch(`${API_BASE}/schools/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated: ApiSchool = await res.json();
        setSchool(updated);
        setForm({ name: updated.name, board: updated.board, city: updated.city, state: updated.state, address: updated.address, logo: updated.logo ?? "" });
        setEditing(false);
        setLogoErr(null);
        toast("School updated", "success");
      } else {
        const data = await res.json();
        const msg = Object.values(data).flat().join(" ");
        toast(msg || "Failed to save changes", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-[var(--muted-foreground)]">
        <svg className="mr-2 animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Loading school…
      </div>
    );
  }

  if (fetchError || !school) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-red-500">{fetchError ?? "School not found."}</p>
        <Link href="/dashboard/admin/schools" className="text-xs font-semibold text-primary underline">Back to Schools</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        {school.logo && (
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={school.logo} alt={`${school.name} logo`} className="h-full w-full object-contain" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{school.name}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">School ID: {id} · <Link href="/dashboard/admin/schools" className="text-primary hover:underline">All Schools</Link></p>
        </div>
        <div className="ml-auto flex gap-2">
          {editing ? (
            <>
              <button type="button" onClick={() => { setEditing(false); setLogoErr(null); setForm({ name: school.name, board: school.board, city: school.city, state: school.state, address: school.address, logo: school.logo ?? "" }); }}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={save} disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Edit School</button>
          )}
        </div>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Plan", value: planLabel[school.plan] ?? school.plan },
          { label: "Board", value: boardLabel[school.board] ?? school.board },
          { label: "Status", value: school.is_active ? "Active" : "Inactive" },
          { label: "Added", value: new Date(school.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
            <p className="mt-1 text-base font-bold text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-[var(--foreground)]">School Details</h2>
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              { k: "name" as const, label: "School Name" },
              { k: "board" as const, label: "Board", select: [{ value: "CBSE", label: "CBSE" }, { value: "ICSE", label: "ICSE" }, { value: "STATE", label: "State Board" }] },
              { k: "city" as const, label: "City" },
              { k: "state" as const, label: "State" },
              { k: "address" as const, label: "Address" },
            ]).map(({ k, label, select }) => (
              <div key={k} className={`flex flex-col gap-1 ${k === "name" || k === "address" ? "sm:col-span-2" : ""}`}>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</label>
                {select ? (
                  <select value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                    {select.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : (
                  <input value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                )}
              </div>
            ))}

            {/* School logo */}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">School Logo</label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]/30">
                  {form.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logo} alt="School logo preview" className="h-full w-full object-contain" />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[var(--muted-foreground)]"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-[var(--border)] bg-white px-4 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-primary/40 hover:text-primary">
                      {form.logo ? "Change Logo" : "Upload Logo"}
                      <input type="file" accept={ACCEPTED_LOGO_TYPES} className="hidden"
                        onChange={(e) => handleLogoPick(e.target.files?.[0])} />
                    </label>
                    {form.logo && (
                      <button type="button" onClick={() => { setForm((f) => ({ ...f, logo: "" })); setLogoErr(null); }}
                        className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)]">Shown to this school&apos;s students, teachers &amp; principal · PNG/JPG/WEBP/SVG, under ~500 KB</p>
                </div>
              </div>
              {logoErr && <p role="alert" className="text-xs font-medium text-red-500">{logoErr}</p>}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="School Name" value={school.name} />
            <Field label="Board" value={boardLabel[school.board] ?? school.board} />
            <Field label="Plan" value={planLabel[school.plan] ?? school.plan} />
            <Field label="City" value={school.city} />
            <Field label="State" value={school.state} />
            <Field label="Address" value={school.address} />
          </div>
        )}
      </div>

      {/* Billing ledger — record charges & payments, track outstanding dues */}
      <BillingPanel schoolId={id} editable />
    </div>
  );
}
