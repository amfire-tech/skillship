// ============================================================
// Auth Route Group Layout
// Minimal layout for login/register/forgot-password pages.
// No navbar or footer — clean, focused auth experience.
// ============================================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--muted)] px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
