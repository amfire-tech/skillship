"use client";

import { useEffect } from "react";
import Link from "next/link";

interface PublicErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: PublicErrorProps) {
  useEffect(() => {
    console.error("[Public Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="mt-5 text-xl font-bold text-[var(--foreground)]">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
        {process.env.NODE_ENV === "development" && error.message
          ? error.message
          : "An unexpected error occurred."}
      </p>
      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
