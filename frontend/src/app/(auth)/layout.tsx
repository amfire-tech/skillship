import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[var(--muted)] px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <Footer />
    </>
  );
}
