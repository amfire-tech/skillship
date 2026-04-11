// Redirect target for role-guard violations.
export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-semibold">403 — Not authorized</h1>
        <p className="mt-2 text-sm opacity-70">
          You don&apos;t have access to that page.
        </p>
      </div>
    </main>
  );
}
