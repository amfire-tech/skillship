"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setIsLoading(true);
    // Simulate — replace with real API call
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1200);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--muted)]/40 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(5,150,105,0.10),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(13,148,136,0.08),_transparent_55%)]" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_8px_20px_-8px_rgba(5,150,105,0.5)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="text-lg font-bold tracking-tight text-[var(--foreground)]">Skillship</p>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white/90 p-7 shadow-[0_30px_80px_-40px_rgba(5,150,105,0.3)] backdrop-blur-xl md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_12px_24px_-10px_rgba(5,150,105,0.5)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl font-bold text-[var(--foreground)]">Check your inbox</h2>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  If <span className="font-semibold text-[var(--foreground)]">{email}</span> is registered, you'll receive a reset link shortly.
                </p>
                <Link
                  href="/login"
                  className="mt-6 text-sm font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Back to login
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-center text-2xl font-bold tracking-tight text-[var(--foreground)]">
                  Reset password
                </h1>
                <p className="mt-1.5 text-center text-sm text-[var(--muted-foreground)]">
                  Enter your account email and we'll send you a reset link.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-3.5" noValidate>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="h-[52px] w-full rounded-2xl border border-[var(--border)] bg-white pl-14 pr-4 text-[15px] text-[var(--foreground)] shadow-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative mt-2 flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.6)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </button>

                  <div className="pt-1 text-center">
                    <Link href="/login" className="text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-primary">
                      Back to login
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
