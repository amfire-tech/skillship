export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-[var(--muted)]" />
          <div className="h-4 w-72 rounded-lg bg-[var(--muted)]" />
        </div>
        <div className="h-10 w-32 rounded-full bg-[var(--muted)]" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-[var(--muted)]" />
                <div className="h-7 w-20 rounded-lg bg-[var(--muted)]" />
              </div>
              <div className="h-10 w-10 rounded-xl bg-[var(--muted)]" />
            </div>
            <div className="mt-3 h-3 w-28 rounded bg-[var(--muted)]" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl border border-[var(--border)] bg-white" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] p-5">
          <div className="h-5 w-40 rounded-lg bg-[var(--muted)]" />
        </div>
        <div className="divide-y divide-[var(--border)]/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-8 w-8 rounded-full bg-[var(--muted)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-48 rounded bg-[var(--muted)]" />
                <div className="h-3 w-32 rounded bg-[var(--muted)]" />
              </div>
              <div className="h-6 w-16 rounded-full bg-[var(--muted)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
