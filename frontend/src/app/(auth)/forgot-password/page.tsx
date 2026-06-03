/*
 * File:    frontend/src/app/(auth)/forgot-password/page.tsx
 * Purpose: Password-reset request page. Styling matches the redesigned
 *          login page (cream/dawn background, orange-teal palette, Lucide
 *          icons, brand-gradient CTA). Self-contained — no shared layout.
 * Owner:   Pranav
 */

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { SkillshipLockup } from "@/components/brand/SkillshipMark";

const EASE = [0.16, 1, 0.3, 1] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AmbientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-12 h-80 w-80 rounded-full bg-[var(--orange-500)] opacity-[0.10] blur-3xl animate-hero-drift" style={{ animationDuration: "12s" }} />
      <div className="absolute -right-32 bottom-8 h-96 w-96 rounded-full bg-[var(--teal-500)] opacity-[0.10] blur-3xl animate-hero-drift" style={{ animationDuration: "14s", animationDelay: "1.2s" }} />
    </div>
  );
}

function Wordmark() {
  return (
    <Link href="/" aria-label="Skillship home">
      <SkillshipLockup badgeSize={44} wordmarkSize="lg" />
    </Link>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { document.title = "Reset password — Skillship"; }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed)               { setError("Email address is required."); return; }
    if (!EMAIL_RE.test(trimmed)) { setError("Enter a valid email address."); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        setError("Failed to send reset email. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12"
      style={{ backgroundImage: "var(--gradient-dawn)" }}
    >
      <AmbientOrbs />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative w-full max-w-[440px]"
      >
        <div className="mb-8 flex justify-center">
          <Wordmark />
        </div>

        <div className="overflow-hidden rounded-3xl border border-[color:var(--border-subtle)] bg-white p-8 shadow-medium">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="flex flex-col items-center text-center"
              >
                <div
                  className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-cool"
                  style={{ backgroundImage: "var(--gradient-cool)" }}
                >
                  <CheckCircle2 size={26} strokeWidth={2} />
                </div>
                <h2 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-[var(--ink-primary)]">
                  Check your inbox
                </h2>
                <p className="mt-2 text-[14px] leading-[1.5] text-[var(--ink-secondary)]">
                  If <span className="font-semibold text-[var(--ink-primary)]">{email}</span> is registered,
                  you&apos;ll receive a reset link shortly.
                </p>
                <Link
                  href="/login"
                  className="mt-7 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--teal-600)] transition-colors hover:text-[var(--orange-500)]"
                >
                  <ArrowLeft size={14} strokeWidth={2.2} />
                  Back to sign in
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <h1
                  className="text-center font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--ink-primary)]"
                  style={{ fontSize: "clamp(1.5rem, 2.4vw, 1.875rem)" }}
                >
                  Reset password
                </h1>
                <p className="mt-2 text-center text-[14px] text-[var(--ink-secondary)]">
                  Enter your account email and we&apos;ll send you a reset link.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
                  <div>
                    <label
                      htmlFor="fp-email"
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
                        id="fp-email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="you@school.in"
                        autoComplete="email"
                        className="h-[52px] w-full rounded-2xl border border-[color:var(--border-subtle)] bg-white pl-11 pr-4 text-[15px] text-[var(--ink-primary)] outline-none transition-all duration-200 placeholder:text-[var(--ink-tertiary)] focus:border-[var(--teal-500)] focus:shadow-[0_0_0_4px_rgba(46,182,181,0.12)]"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        role="alert"
                        aria-live="assertive"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-[#E94F37]/20 bg-[#E94F37]/8 px-4 py-3 text-[13px] font-medium text-[#B43A28]"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                    className="group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white shadow-warm transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(243,156,50,0.32)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    style={{ backgroundImage: "var(--gradient-brand)" }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </button>

                  <div className="pt-1 text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
                    >
                      <ArrowLeft size={14} strokeWidth={2} />
                      Back to sign in
                    </Link>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
