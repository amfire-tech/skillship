"use client";

// Admin Settings — intentionally minimal. The platform owner only needs two
// things here for now: change their own password (verified by current password)
// and switch the theme. Everything else was removed; richer platform settings
// can be added back when the owner asks for them.

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { API_BASE, getToken } from "@/lib/auth";

// ── Change password ─────────────────────────────────────────────────────────
function ChangePasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string; global?: string }>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!current) errs.current = "Enter your current password";
    if (!next) errs.next = "Enter a new password";
    else if (next.length < 8) errs.next = "New password must be at least 8 characters";
    if (confirm !== next) errs.confirm = "Passwords don't match";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    const token = await getToken();
    if (!token) { setErrors({ global: "Session expired — please sign in again." }); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/auth/change-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      if (res.ok || res.status === 204) {
        toast("Password changed successfully", "success");
        setCurrent(""); setNext(""); setConfirm("");
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const fieldErrors: typeof errors = {};
      if (data.current_password) fieldErrors.current = Array.isArray(data.current_password) ? data.current_password[0] : String(data.current_password);
      if (data.new_password) fieldErrors.next = Array.isArray(data.new_password) ? data.new_password[0] : String(data.new_password);
      if (!fieldErrors.current && !fieldErrors.next) fieldErrors.global = data.detail ?? "Couldn't change password.";
      setErrors(fieldErrors);
    } catch {
      setErrors({ global: "Network error. Is the server running?" });
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (err?: string) =>
    `h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${
      err ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--border)] focus:border-primary focus:ring-primary/10"
    } dark:bg-[var(--background)]`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5 md:p-6 dark:bg-[var(--background)]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </span>
        <div>
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Change Password</h3>
          <p className="text-xs text-[var(--muted-foreground)]">Verify your current password, then set a new one.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 max-w-md space-y-4">
        {errors.global && <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{errors.global}</div>}

        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-[var(--muted-foreground)]">Current password</label>
          <input type={show ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={inputCls(errors.current)} />
          {errors.current && <p role="alert" className="text-xs font-medium text-red-500">{errors.current}</p>}
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-[var(--muted-foreground)]">New password</label>
          <input type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={inputCls(errors.next)} />
          {errors.next && <p role="alert" className="text-xs font-medium text-red-500">{errors.next}</p>}
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-[var(--muted-foreground)]">Confirm new password</label>
          <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={inputCls(errors.confirm)} />
          {errors.confirm && <p role="alert" className="text-xs font-medium text-red-500">{errors.confirm}</p>}
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-3.5 w-3.5 rounded border-[var(--border)] accent-[color:var(--primary)]" />
          Show passwords
        </label>

        <button type="submit" disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0">
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </motion.div>
  );
}

// ── Theme ───────────────────────────────────────────────────────────────────
function ThemeCard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const options: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg> },
    { value: "dark", label: "Dark", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="rounded-2xl border border-[var(--border)] bg-white p-5 md:p-6 dark:bg-[var(--background)]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
        </span>
        <div>
          <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">Appearance</h3>
          <p className="text-xs text-[var(--muted-foreground)]">Choose how Skillship looks for you.</p>
        </div>
      </div>

      <div className="mt-5 grid max-w-md grid-cols-2 gap-3">
        {options.map((o) => {
          const active = mounted && theme === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setTheme(o.value)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-semibold transition-all ${
                active
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-primary/30 hover:text-primary"
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  useEffect(() => { document.title = "Settings — Skillship"; }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account security and appearance" />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChangePasswordCard />
        <ThemeCard />
      </div>
    </div>
  );
}
