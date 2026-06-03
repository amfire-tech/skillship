/*
 * File:    frontend/src/app/(dashboard)/dashboard/admin/marketplace/page.tsx
 * Purpose: Marketplace Management is not enabled for this deployment. The
 *          client opted out of the self-serve workshop catalog (it needs
 *          packages curated manually), so instead of the live table we show a
 *          short notice pointing them to Amfire to enable it later. The full
 *          implementation lives in git history if it's switched back on.
 * Owner:   Pranav
 */

export default function MarketplaceManagementPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
            <circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" />
          </svg>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          Marketplace Management
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          This feature isn&apos;t enabled on your plan yet. When you&apos;re ready
          to run a workshop catalog, the Amfire team can switch it on and help set
          up your packages.
        </p>

        <a
          href="mailto:contact@amfire.in?subject=Marketplace%20Management%20—%20Skillship"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(255,122,24,0.5)] transition-all hover:-translate-y-0.5"
        >
          Contact Amfire
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16v16H4z" /><path d="m4 6 8 6 8-6" />
          </svg>
        </a>
      </div>
    </div>
  );
}
