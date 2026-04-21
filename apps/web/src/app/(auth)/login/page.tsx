"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { getDefaultRouteForRole } from "@/lib/role-guard";
import type { UserRole } from "@/types";

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Super Admin" },
  { value: "subadmin", label: "Sub Admin" },
  { value: "principal", label: "Principal" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [role, setRole] = useState<UserRole | "">("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showRoleMenu) return;
    function handleClick(e: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showRoleMenu]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!role || !userId || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const selectedRoleLabel = roleOptions.find((r) => r.value === role)?.label ?? role;

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8002/api"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password, role: selectedRoleLabel }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials. Please try again.");
        return;
      }

      login(
        {
          id: data.user.id,
          email: data.user.email ?? "",
          name: data.user.user_id,
          role: role as UserRole,
        },
        data.accessToken,
        data.refreshToken
      );
      router.replace(getDefaultRouteForRole(role as UserRole));
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const selectedRoleLabel = roleOptions.find((r) => r.value === role)?.label;
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--muted)]/40 px-4 py-10">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(5,150,105,0.10),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(13,148,136,0.08),_transparent_55%)]" />
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30"
        style={{ maskImage: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), transparent 70%)" }}
        aria-hidden="true"
      />
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

        {/* Card */}
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white/90 p-7 shadow-[0_30px_80px_-40px_rgba(5,150,105,0.3)] backdrop-blur-xl md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

          <h1 className="text-center text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Login
          </h1>
          <p className="mt-1.5 text-center text-sm text-[var(--muted-foreground)]">
            Welcome back. Sign in to your Skillship account.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5" noValidate>
            {/* Role select */}
            <div className="relative" ref={roleRef}>
              <button
                type="button"
                onClick={() => setShowRoleMenu((v) => !v)}
                className="group flex h-[52px] w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 text-left shadow-sm transition-colors hover:border-primary/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span className={`flex-1 text-[15px] ${selectedRoleLabel ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
                  {selectedRoleLabel ?? "Select Role"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[var(--muted-foreground)] transition-transform ${showRoleMenu ? "rotate-90" : ""}`}>
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>

              {showRoleMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_24px_60px_-20px_rgba(5,150,105,0.25)]"
                >
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setRole(opt.value);
                        setShowRoleMenu(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-primary/5 ${
                        role === opt.value ? "bg-primary/5 font-semibold text-primary" : "text-[var(--foreground)]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {role === opt.value && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* User ID */}
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID"
                autoComplete="username"
                className="h-[52px] w-full rounded-2xl border border-[var(--border)] bg-white pl-14 pr-4 text-[15px] text-[var(--foreground)] shadow-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="h-[52px] w-full rounded-2xl border border-[var(--border)] bg-white pl-14 pr-12 text-[15px] text-[var(--foreground)] shadow-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-primary"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" x2="23" y1="1" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative mt-2 flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(5,150,105,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(5,150,105,0.7)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? "Logging in..." : "Login"}
              {!isLoading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              )}
            </button>

            <div className="pt-1 text-center">
              <Link href="/forgot-password" className="text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-primary">
                Forgot password?
              </Link>
            </div>
          </form>

        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>


      </motion.div>
    </main>
  );
}
