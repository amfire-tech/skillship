/*
 * File:    frontend/src/components/layout/Footer.tsx
 * Purpose: Public-site footer (skillship_homepage_brief.md §13). Cream
 *          background, 4-column desktop / stacked mobile, restrained type.
 *          The dashboard layouts don't render this footer — only the
 *          (public) layout does — so the cream palette can't leak into
 *          authenticated screens.
 * Owner:   Pranav (homepage rebuild)
 */

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SkillshipLockup } from "@/components/brand/SkillshipMark";

const PLATFORM = [
  { label: "Platform",     href: "/" },
  { label: "For Schools",  href: "/request-demo" },
  { label: "Courses",      href: "/workshops" },
  { label: "Marketplace",  href: "/marketplace" },
  { label: "About",        href: "/about" },
];

// The three pillars of the Skillship ecosystem (see ThreePillars section).
const ECOSYSTEM = [
  { label: "AI & Robotics Labs (IAAS)",  href: "/#iaas-labs" },
  { label: "Teacher Training (TAAS)",    href: "/#pillars" },
  { label: "Learning Software (SAAS)",   href: "/#pillars" },
  { label: "Explore the ecosystem",      href: "/#pillars" },
];

const LEGAL = [
  { label: "Privacy",        href: "/privacy" },
  { label: "Terms",          href: "/terms" },
  { label: "Refund Policy",  href: "/refund-policy" },
];

const SOCIALS = [
  { label: "LinkedIn",  href: "https://www.linkedin.com/company/skillship-edutech/", Icon: Linkedin  },
  { label: "Instagram", href: "https://www.instagram.com/skillship.in/",             Icon: Instagram },
  { label: "Twitter",   href: "https://twitter.com/skillship_",                      Icon: Twitter   },
  { label: "Facebook",  href: "https://www.facebook.com/profile.php?id=61551827170275", Icon: Facebook },
];

export function Footer() {
  return (
    <footer className="bg-[var(--cream-soft)] text-[var(--ink-primary)]" role="contentinfo">
      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" aria-label={`${siteConfig.name} home`}>
              <SkillshipLockup badgeSize={40} wordmarkSize="md" />
            </Link>

            <p className="mt-5 text-[14px] leading-[1.55] text-[var(--ink-secondary)]">
              Where fun meets learning. AI-powered school management for India&apos;s
              next generation of engineers.
            </p>

            <p className="mt-5 text-[12px] text-[var(--ink-tertiary)]">
              Built by{" "}
              <a
                href="https://www.amfire.in"
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-[var(--ink-secondary)] underline decoration-[var(--orange-500)]/40 decoration-2 underline-offset-2 transition-colors hover:text-[var(--ink-primary)]"
              >
                amfire
              </a>
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
              Platform
            </h3>
            <ul className="mt-5 space-y-3" role="list">
              {PLATFORM.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[14px] text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ecosystem — the three Skillship pillars */}
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
              Our Ecosystem
            </h3>
            <ul className="mt-5 space-y-3" role="list">
              {ECOSYSTEM.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[14px] text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-tertiary)]">
              Get in touch
            </h3>
            <ul className="mt-5 space-y-3" role="list">
              <li>
                <a
                  href="mailto:info@skillship.in"
                  className="flex items-center gap-2 text-[14px] text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
                >
                  <Mail size={14} strokeWidth={1.7} />
                  info@skillship.in
                </a>
              </li>
              <li>
                <a
                  href="tel:+919368408577"
                  className="flex items-center gap-2 text-[14px] text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
                >
                  <Phone size={14} strokeWidth={1.7} />
                  +91 93684 08577
                </a>
              </li>
              <li className="flex items-start gap-2 text-[14px] text-[var(--ink-secondary)]">
                <MapPin size={14} strokeWidth={1.7} className="mt-1 shrink-0" />
                Tajganj, Agra, UP 282006
              </li>
            </ul>

            <ul className="mt-6 flex items-center gap-3" role="list" aria-label="Social media">
              {SOCIALS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--border-subtle)] bg-white text-[var(--ink-secondary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--orange-500)]/40 hover:text-[var(--orange-500)]"
                  >
                    <Icon size={15} strokeWidth={1.7} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[color:var(--border-subtle)] pt-8 text-[12px] text-[var(--ink-tertiary)] md:flex-row">
          <p>© {new Date().getFullYear()} Skillship Edutech. All rights reserved.</p>
          <ul className="flex flex-wrap items-center gap-5" role="list">
            {LEGAL.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors hover:text-[var(--ink-primary)]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
