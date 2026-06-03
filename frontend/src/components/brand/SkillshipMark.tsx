/*
 * File:    frontend/src/components/brand/SkillshipMark.tsx
 * Purpose: Canonical Skillship brand mark — used everywhere the logo
 *          appears (Navbar, Footer, Sidebar, Login, Forgot-password).
 *
 *          Sourced from the Skillship Logo PDF:
 *            - Badge:    /public/logo-icon.png (circular SKILLSHIP EDUTECH badge)
 *            - Wordmark: SKILL (orange #F39C32) + SHIP (teal #2EB6B5)
 *
 *          Three exports for the common layouts:
 *            <SkillshipBadge   size={n} />     — just the circular badge
 *            <SkillshipWordmark size="sm|md|lg"/> — just the SKILLSHIP type
 *            <SkillshipLockup ... />            — badge + wordmark side by side
 *
 *          When the brand designer ships a vector SVG of the wordmark
 *          drawn from the actual Fredoka-style letterforms, swap the
 *          Wordmark to use that asset — every callsite picks it up.
 * Owner:   Pranav
 */

import Image from "next/image";

const WORDMARK_SIZES = {
  sm: "text-[16px]",
  md: "text-[19px]",
  lg: "text-[24px]",
  xl: "text-[28px]",
} as const;

type WordmarkSize = keyof typeof WORDMARK_SIZES;

export function SkillshipBadge({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo-icon.png"
      alt="Skillship Edutech"
      width={size}
      height={size}
      priority
      className={`shrink-0 rounded-full bg-black object-contain p-[2px] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SkillshipWordmark({
  size = "md",
  className = "",
}: {
  size?: WordmarkSize;
  className?: string;
}) {
  return (
    <span
      className={`font-semibold leading-none tracking-tight ${WORDMARK_SIZES[size]} ${className}`}
    >
      <span className="text-brand-orange-500">SKILL</span>
      <span className="text-brand-teal-500">SHIP</span>
    </span>
  );
}

export function SkillshipLockup({
  badgeSize = 40,
  wordmarkSize = "md",
  className = "",
  tagline,
}: {
  badgeSize?: number;
  wordmarkSize?: WordmarkSize;
  className?: string;
  /** Optional sub-label rendered under the wordmark (e.g. "Super Admin"). */
  tagline?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SkillshipBadge size={badgeSize} />
      <span className="leading-tight">
        <SkillshipWordmark size={wordmarkSize} />
        {tagline ? (
          <span className="mt-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
