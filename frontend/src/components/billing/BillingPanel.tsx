/*
 * File:    frontend/src/components/billing/BillingPanel.tsx
 * Purpose: Reusable billing ledger panel. Shows a school's charged / paid /
 *          remaining summary plus the dated list of charges and payments.
 *          MAIN_ADMIN renders it with editable={true} + a schoolId to record
 *          and delete entries; the PRINCIPAL renders it read-only with no
 *          schoolId (the backend derives their own school).
 * Owner:   Pranav
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";

interface Summary {
  total_charged: string;
  total_paid: string;
  remaining: string;
}

interface Entry {
  id: string;
  kind: "CHARGE" | "PAYMENT";
  kind_display: string;
  amount: string;
  occurred_on: string;
  method: string;
  method_display: string;
  note: string;
  created_by_name: string;
}

const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI" },
  { value: "BANK", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
];

export function inr(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BillingPanel({
  schoolId,
  editable = false,
}: {
  schoolId?: string;
  editable?: boolean;
}) {
  const scope = schoolId ? `?school=${schoolId}` : "";

  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-entry form state
  const [adding, setAdding] = useState<"CHARGE" | "PAYMENT" | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ amount: "", occurred_on: today, method: "UPI", note: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) { setError("Session expired."); setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [sRes, eRes] = await Promise.all([
        fetch(`${API_BASE}/billing/entries/summary/${scope}`, { headers }),
        fetch(`${API_BASE}/billing/entries/${scope}`, { headers }),
      ]);
      if (!sRes.ok || !eRes.ok) { setError("Failed to load billing."); setLoading(false); return; }
      setSummary(await sRes.json());
      setEntries(asArray<Entry>(await eRes.json()));
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => { load(); }, [load]);

  function openForm(kind: "CHARGE" | "PAYMENT") {
    setForm({ amount: "", occurred_on: today, method: "UPI", note: "" });
    setAdding(kind);
  }

  async function submit() {
    if (!adding) return;
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { setError("Enter a valid amount."); return; }
    setSaving(true);
    setError(null);
    const token = await getToken();
    if (!token) { setSaving(false); return; }
    const body: Record<string, string> = {
      kind: adding,
      amount: form.amount,
      occurred_on: form.occurred_on,
      note: form.note,
    };
    if (adding === "PAYMENT") body.method = form.method;
    try {
      const res = await fetch(`${API_BASE}/billing/entries/${scope}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setAdding(null);
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(Object.values(data).flat().join(" ") || "Failed to save entry.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this billing entry? This cannot be undone.")) return;
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API_BASE}/billing/entries/${id}/${scope}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) await load();
    else setError("Failed to delete entry.");
  }

  const remaining = Number(summary?.remaining ?? 0);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm dark:bg-[var(--background)]">
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Fees &amp; Payments</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {editable ? "Record what this school was charged and what it has paid." : "What your school has been charged and paid to Skillship."}
          </p>
        </div>
        {editable && (
          <div className="flex gap-2">
            <button type="button" onClick={() => openForm("CHARGE")}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">+ Charge</button>
            <button type="button" onClick={() => openForm("PAYMENT")}
              className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90">+ Payment</button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Charged", value: summary?.total_charged, tone: "text-[var(--foreground)]" },
          { label: "Total Paid", value: summary?.total_paid, tone: "text-emerald-600" },
          { label: "Remaining Due", value: summary?.remaining, tone: remaining > 0 ? "text-red-500" : "text-emerald-600" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.tone}`}>{loading ? "…" : inr(c.value ?? 0)}</p>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-xs text-red-500">{error}</p>}

      {/* Add form */}
      {editable && adding && (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] p-4">
          <p className="mb-3 text-xs font-semibold text-[var(--foreground)]">
            New {adding === "CHARGE" ? "Charge" : "Payment"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--muted-foreground)]">Amount (₹)</span>
              <input type="number" min="0" step="0.01" value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[var(--background)]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--muted-foreground)]">Date</span>
              <input type="date" value={form.occurred_on}
                onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[var(--background)]" />
            </label>
            {adding === "PAYMENT" && (
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[var(--muted-foreground)]">Method</span>
                <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[var(--background)]">
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
              <span className="text-xs text-[var(--muted-foreground)]">Note</span>
              <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder={adding === "CHARGE" ? "e.g. Annual plan" : "e.g. Q1 settlement"}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[var(--background)]" />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setAdding(null)}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
            <button type="button" onClick={submit} disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {saving ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </div>
      )}

      {/* Ledger */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              <th className="py-2 pr-3 font-semibold">Date</th>
              <th className="py-2 pr-3 font-semibold">Type</th>
              <th className="py-2 pr-3 font-semibold">Note</th>
              <th className="py-2 pr-3 text-right font-semibold">Amount</th>
              {editable && <th className="py-2 pl-3" />}
            </tr>
          </thead>
          <tbody>
            {!loading && entries.length === 0 && (
              <tr><td colSpan={editable ? 5 : 4} className="py-6 text-center text-xs text-[var(--muted-foreground)]">No billing entries yet.</td></tr>
            )}
            {entries.map((e) => {
              const isPayment = e.kind === "PAYMENT";
              return (
                <tr key={e.id} className="border-b border-[var(--border)]/60">
                  <td className="py-2.5 pr-3 text-[var(--muted-foreground)]">{fmtDate(e.occurred_on)}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isPayment ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                      {isPayment ? "Payment" : "Charge"}
                    </span>
                    {isPayment && e.method_display && <span className="ml-2 text-xs text-[var(--muted-foreground)]">{e.method_display}</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-[var(--foreground)]">{e.note || "—"}</td>
                  <td className={`py-2.5 pr-3 text-right font-semibold ${isPayment ? "text-emerald-600" : "text-[var(--foreground)]"}`}>
                    {isPayment ? "−" : "+"}{inr(e.amount)}
                  </td>
                  {editable && (
                    <td className="py-2.5 pl-3 text-right">
                      <button type="button" onClick={() => remove(e.id)}
                        className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
