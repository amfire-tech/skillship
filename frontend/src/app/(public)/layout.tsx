/*
 * File:    frontend/src/app/(public)/layout.tsx
 * Purpose: Public marketing layout — Navbar, page content, Footer.
 *          Theme follows the user's preference (default dark, toggle in
 *          Navbar). Both light and dark palettes are first-class and
 *          contrast-verified — no force-light needed.
 * Owner:   Pranav
 */

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
