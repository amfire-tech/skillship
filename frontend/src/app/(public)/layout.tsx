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
      {/* Animated site background — slow orange-gradient grid living behind
          every public page. Shows through wherever a section isn't fully
          opaque (section seams, translucent dark surfaces, the hero). */}
      <div className="site-bg" aria-hidden />
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
