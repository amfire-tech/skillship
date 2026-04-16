"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  function handleBack() {
    // If no navigation history, router.back() would leave the site.
    // Fall back to home when history stack is empty.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }
  return (
    <>
      {/* Minimal branded header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label="Skillship home">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-amber-500">SKILL</span>
              <span className="text-teal-600">SHIP</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="mt-5 text-[56px] font-bold leading-none text-red-500/20">403</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">Access denied</h1>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            You don&apos;t have permission to view that page. Contact your administrator if you think this is a mistake.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleBack}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Go back
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
            >
              Go home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
