// Global 404 page.
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-3xl font-semibold">404</h1>
        <p className="mt-2 text-sm opacity-70">Page not found.</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Return home
        </Link>
      </div>
    </main>
  );
}
