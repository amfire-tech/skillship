import Link from "next/link";

export default function NotFound() {
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
          <p className="text-[120px] font-bold leading-none text-primary/10">404</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">Page not found</h1>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
            >
              Go home
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
            >
              Browse workshops
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
