/*
 * File:    frontend/src/app/(auth)/login/page.tsx
 * Purpose: Public-side login. Two-panel layout matching the homepage's
 *          cream / orange-teal aesthetic — left panel carries brand + value
 *          props, right panel carries the form.
 *
 *          Role is OPTIONAL. Only school-facing roles (Principal / Teacher /
 *          Student) are shown as cards. Platform staff (Super Admin / Sub Admin)
 *          sign in with email + password alone and are never surfaced in the UI,
 *          so school users can't see those roles exist. When a role IS picked it
 *          is enforced server-side (see accounts/serializers.py::LoginSerializer);
 *          when omitted, the backend authenticates by credentials and returns
 *          the account's real role.
 * Owner:   Pranav
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Users, Sparkles,
  Eye, EyeOff, ArrowRight, Loader2, Mail, Lock, Check, type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getDefaultRouteForRole } from "@/lib/role-guard";
import type { UserRole } from "@/types";
import { SkillshipLockup } from "@/components/brand/SkillshipMark";

const EASE = [0.16, 1, 0.3, 1] as const;

interface RoleOption {
  value: UserRole;
  label: string;
  /** Sub-label shown under the title to disambiguate (e.g. "Platform-level"). */
  hint: string;
  icon: LucideIcon;
  /** Tailwind gradient utility — matches the homepage RoleCards palette. */
  gradient: string;
}

// Only school-facing roles are shown. Platform staff (Super Admin / Sub Admin)
// sign in with email + password alone — they don't pick a role, so school users
// (e.g. principals) never see those roles exist. The backend authenticates them
// by credentials and returns their real role (role is optional server-side).
const ROLES: RoleOption[] = [
  { value: "PRINCIPAL",  label: "Principal",   hint: "School leader",   icon: LineChart,   gradient: "bg-cool-gradient"   },
  { value: "TEACHER",    label: "Teacher",     hint: "Class management",icon: Users,       gradient: "bg-[linear-gradient(135deg,#2EB6B5_0%,#4FB956_100%)]" },
  { value: "STUDENT",    label: "Student",     hint: "Learning",        icon: Sparkles,    gradient: "bg-[linear-gradient(135deg,#4FB956_0%,#F39C32_100%)]" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ──────────────── decorative ambient orbs (matches Hero) ──────────────── */

function AmbientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-12 h-80 w-80 rounded-full bg-[var(--orange-500)] opacity-[0.10] blur-3xl animate-hero-drift" style={{ animationDuration: "12s" }} />
      <div className="absolute -right-32 bottom-8 h-96 w-96 rounded-full bg-[var(--teal-500)] opacity-[0.10] blur-3xl animate-hero-drift" style={{ animationDuration: "14s", animationDelay: "1.2s" }} />
    </div>
  );
}

/* ──────────────── Brand panel (left side on desktop) ──────────────── */

function BrandPanel() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="relative isolate hidden flex-1 overflow-hidden lg:flex"
      style={{ backgroundImage: "var(--gradient-dawn)" }}
    >
      <AmbientOrbs />

      <div className="relative z-10 flex w-full max-w-[520px] flex-col justify-between px-12 py-14 xl:px-16 xl:py-20">
        <Link href="/" className="self-start" aria-label="Skillship home">
          <SkillshipLockup badgeSize={44} wordmarkSize="lg" />
        </Link>

        {/* Hero copy */}
        <div className="my-auto">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]">
            Where fun meets learning
          </p>
          <h2
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2rem, 3.8vw, 3rem)" }}
          >
            One sign-in.<br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              Your whole school.
            </span>
          </h2>
          <p className="mt-5 max-w-[400px] text-[15.5px] leading-[1.6] text-[var(--ink-secondary)]">
            Skillship runs real AI on every quiz, content view, and dashboard.
            Sign in to your role and pick up where you left off.
          </p>

          {/* Mini feature ticks */}
          <ul className="mt-8 space-y-3" role="list">
            {[
              "Adaptive quizzes tuned to each student",
              "AI Career Pilot built into every dashboard",
              "School-grade isolation across every tenant",
            ].map((line, i) => (
              <motion.li
                key={line}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.12, ease: EASE }}
                className="flex items-center gap-3 text-[14px] text-[var(--ink-secondary)]"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white shadow-soft" style={{ backgroundImage: "var(--gradient-cool)" }}>
                  <Check size={12} strokeWidth={2.8} />
                </span>
                {line}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Footer breadcrumb */}
        <p className="text-[12px] text-[var(--ink-tertiary)]">
          Built by <a href="https://www.amfire.in" target="_blank" rel="noreferrer noopener" className="font-semibold underline decoration-[var(--orange-500)]/40 decoration-2 underline-offset-2 hover:text-[var(--ink-secondary)]">amfire</a>
        </p>
      </div>
    </motion.aside>
  );
}

/* ──────────────── Form panel ──────────────── */

interface FormPanelProps { onLogin: (role: UserRole | "", email: string, password: string) => Promise<void>; error: string | null; submitting: boolean; }

function FormPanel({ onLogin, error, submitting }: FormPanelProps) {
  // The UI only ever shows the three SCHOOL roles (Principal / Teacher /
  // Student). Platform staff (Super Admin / Sub Admin) are never surfaced —
  // school users must not see that an oversight layer exists. Admins sign in
  // SILENTLY: they leave the role unpicked and submit with email + password
  // only; the backend authenticates by credentials and returns their real
  // role. So role is OPTIONAL — the Sign-in button is enabled on credentials
  // alone, and a picked role is enforced server-side.
  const [role, setRole] = useState<UserRole | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit =
    EMAIL_RE.test(email.trim()) && password.length >= 1 && !submitting;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    onLogin(role, email.trim(), password);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="relative flex flex-1 items-center justify-center bg-white px-6 py-12 lg:px-12"
    >
      <div className="w-full max-w-[440px]">
        {/* Mobile lockup (brand panel is hidden under lg) */}
        <Link href="/" className="mb-10 inline-block lg:hidden" aria-label="Skillship home">
          <SkillshipLockup badgeSize={40} wordmarkSize="md" />
        </Link>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
          className="font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--ink-primary)]"
          style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
        >
          Welcome back.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
          className="mt-2 text-[15px] text-[var(--ink-secondary)]"
        >
          Sign in to your Skillship account.
        </motion.p>

        <form onSubmit={submit} className="mt-10 space-y-6" noValidate>
          {/* School-role grid. Only Principal / Teacher / Student are ever
              shown — platform admins are intentionally invisible here and sign
              in silently with email + password (no role picked). */}
          <motion.fieldset
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: EASE }}
          >
            <legend className="mb-3 flex items-center justify-between gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
              <span>I am a</span>
              {role && (
                <span className="text-[11px] font-medium text-[var(--teal-600)] normal-case tracking-normal">
                  {ROLES.find((r) => r.value === role)?.label}
                </span>
              )}
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    aria-pressed={active}
                    title={`${r.label} — ${r.hint}`}
                    className={`group relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border text-[10px] font-semibold transition-all duration-300 ease-out-expo ${
                      active
                        ? "border-transparent shadow-medium -translate-y-0.5"
                        : "border-[color:var(--border-subtle)] bg-white text-[var(--ink-secondary)] hover:-translate-y-0.5 hover:border-[var(--teal-500)]/30 hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    {active && (
                      <span aria-hidden className={`absolute inset-0 rounded-2xl ${r.gradient}`} />
                    )}
                    <Icon
                      size={18}
                      strokeWidth={1.8}
                      className={`relative ${active ? "text-white" : ""}`}
                    />
                    <span className={`relative leading-tight ${active ? "text-white" : ""}`}>
                      {r.label.replace(" Admin", "")}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.fieldset>

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42, ease: EASE }}
            className="relative"
          >
            <label
              htmlFor="login-email"
              className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                aria-hidden
                size={16}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-tertiary)]"
              />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.in"
                className="h-[52px] w-full rounded-2xl border border-[color:var(--border-subtle)] bg-white pl-11 pr-4 text-[15px] text-[var(--ink-primary)] outline-none transition-all duration-200 placeholder:text-[var(--ink-tertiary)] focus:border-[var(--teal-500)] focus:shadow-[0_0_0_4px_rgba(46,182,181,0.12)]"
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.5, ease: EASE }}
            className="relative"
          >
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[12px] font-medium text-[var(--teal-600)] transition-colors hover:text-[var(--orange-500)]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock
                aria-hidden
                size={16}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-tertiary)]"
              />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-[52px] w-full rounded-2xl border border-[color:var(--border-subtle)] bg-white pl-11 pr-12 text-[15px] text-[var(--ink-primary)] outline-none transition-all duration-200 placeholder:text-[var(--ink-tertiary)] focus:border-[var(--teal-500)] focus:shadow-[0_0_0_4px_rgba(46,182,181,0.12)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--ink-tertiary)] transition-colors hover:bg-[var(--cream)] hover:text-[var(--ink-primary)]"
              >
                {showPassword ? <EyeOff size={16} strokeWidth={1.8}/> : <Eye size={16} strokeWidth={1.8}/>}
              </button>
            </div>
          </motion.div>

          {/* Error band */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              aria-live="assertive"
              className="rounded-xl border border-[#E94F37]/20 bg-[#E94F37]/8 px-4 py-3 text-[13px] font-medium text-[#B43A28]"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.6, ease: EASE }}
            type="submit"
            disabled={!canSubmit}
            aria-busy={submitting}
            className="group relative inline-flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-[15px] font-semibold text-white shadow-warm transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(243,156,50,0.32)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-warm"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={15} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-10 text-center text-[12px] text-[var(--ink-tertiary)]">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]">Privacy Policy</Link>.
        </p>
      </div>
    </motion.section>
  );
}

/* ──────────────── Page ──────────────── */

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { document.title = "Sign in — Skillship"; }, []);

  async function handleLogin(role: UserRole | "", email: string, password: string) {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.detail || data?.non_field_errors?.[0] || "Invalid credentials. Please try again.");
        return;
      }
      login(data.user, data.access);
      router.replace(getDefaultRouteForRole(data.user.role));
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full overflow-hidden bg-white">
      <BrandPanel />
      <FormPanel onLogin={handleLogin} error={error} submitting={submitting} />
    </main>
  );
}
