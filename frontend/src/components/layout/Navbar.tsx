/*
 * File:    frontend/src/components/layout/Navbar.tsx
 * Purpose: Public marketing nav. Sticky, transparent at top, blur+warm-tint on scroll.
 *          Hosts the Skillship wordmark (orange SKILL + teal SHIP) and the
 *          brand-gradient "Book a Demo" CTA. Light-only — no theme toggle here
 *          because the public site has a single warm palette (skillship_homepage_brief.md §2).
 * Owner:   Pranav (homepage rebuild)
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { SkillshipLockup } from "@/components/brand/SkillshipMark";

const NAV_LINKS = [
  { label: "Platform",    href: "/" },
  { label: "For Schools", href: "/request-demo" },
  { label: "Courses",     href: "/workshops" },
  { label: "About",       href: "/about" },
];

const CTA = { label: "Book a Demo", href: "/request-demo" } as const;

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Avoid hydration mismatch — render an inert placeholder until mounted.
  if (!mounted) {
    return <span aria-hidden className={compact ? "h-9 w-9" : "h-9 w-9 rounded-full border border-[color:var(--border-subtle)]"} />;
  }
  const isDark = (theme ?? resolvedTheme) === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--border-subtle)] bg-[var(--card)] text-[var(--ink-secondary)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--teal-500)]/40 hover:text-[var(--ink-primary)]"
    >
      {isDark ? <Sun size={15} strokeWidth={1.8}/> : <Moon size={15} strokeWidth={1.8}/>}
    </button>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLElement>(null);

  // The homepage hero is an always-dark premium surface. While the navbar is
  // transparent over it (i.e. at the very top of the homepage, before scroll),
  // nav text must be light or it disappears into the dark hero. Once scrolled,
  // the navbar gains its light blurred background, so ink colours apply again.
  const overDark = pathname === "/" && !scrolled;

  // Scroll-state for the transparent → blurred transition (brief §2.1).
  // rAF-throttled: collapse every scroll event into at most one read+update per
  // frame, and only setState when the boolean actually flips — so scrolling
  // never triggers a React re-render storm or layout read per event.
  useEffect(() => {
    let raf = 0;
    let last = false;
    function update() {
      raf = 0;
      const next = window.scrollY > 40;
      if (next !== last) { last = next; setScrolled(next); }
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMobileOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMobileOpen(false); }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={menuRef}
      className={`sticky top-0 z-50 w-full transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ease-out-expo ${
        scrolled
          ? "border-b border-[color:var(--border-subtle)] bg-[var(--background)]/80 backdrop-blur-xl backdrop-saturate-150 shadow-soft"
          : overDark
            ? // Homepage top: sit on the hero's dark surface so the white nav
              // text is legible in BOTH light and dark mode (the sticky navbar
              // is above the hero in flow, so a transparent bar would otherwise
              // show the cream page background in light mode).
              "border-b border-transparent bg-[#0A0F1E]"
            : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-12">
        {/* Canonical brand lockup (badge + SKILLSHIP wordmark) */}
        <Link href="/" aria-label="Skillship home">
          <SkillshipLockup badgeSize={40} wordmarkSize="md" />
        </Link>

        {/* Desktop links — centered */}
        <ul className="hidden items-center gap-9 md:flex" role="list">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-[14px] font-medium tracking-[-0.005em] transition-colors duration-200 ${
                    overDark
                      ? active
                        ? "text-white"
                        : "text-white/75 hover:text-white"
                      : active
                        ? "text-[var(--ink-primary)]"
                        : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTA + Sign-in (desktop) */}
        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className={`text-[14px] font-medium transition-colors ${
              overDark
                ? "text-white/80 hover:text-white"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Sign in
          </Link>
          <Link
            href={CTA.href}
            className="cta-sun group relative inline-flex items-center justify-center rounded-full px-5 py-2.5 text-[14px] font-semibold text-white transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            <span className="relative z-10">{CTA.label}</span>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className={`rounded-lg p-2 md:hidden ${overDark ? "text-white" : "text-[var(--ink-primary)]"}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="7"  x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
          )}
        </button>
      </div>

      {/* Mobile drawer — full-width slide */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mob"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-[color:var(--border-subtle)] bg-[var(--background)]/96 backdrop-blur-xl md:hidden"
          >
            <ul className="mx-auto max-w-[1280px] space-y-1 px-6 py-4" role="list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-xl px-4 py-3 text-[15px] font-medium text-[var(--ink-primary)] transition-colors hover:bg-[var(--cream)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="flex items-center justify-between pt-2">
                <Link
                  href="/login"
                  className="block rounded-xl px-4 py-3 text-[14px] font-medium text-[var(--ink-secondary)]"
                >
                  Sign in
                </Link>
                <ThemeToggle />
              </li>
              <li>
                <Link
                  href={CTA.href}
                  className="cta-sun block rounded-full px-5 py-3 text-center text-[15px] font-semibold text-white shadow-warm"
                  style={{ backgroundImage: "var(--gradient-brand)" }}
                >
                  <span className="relative z-10">{CTA.label}</span>
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
