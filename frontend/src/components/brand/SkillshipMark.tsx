/*
 * File:    frontend/src/components/brand/SkillshipMark.tsx
 * Purpose: Canonical Skillship brand mark — used everywhere the logo
 *          appears (Navbar, Footer, Sidebar, Login, Forgot-password).
 *
 *          The wordmark is the REGISTERED trademark logotype, served as a
 *          vector asset extracted from the official Skillship Logo PDF (the
 *          rounded "Fredoka-style" letterforms — SKILL orange + SHIP teal).
 *          Do NOT re-typeset it in a web font; legal requires the exact mark.
 *
 *          Assets in /public/brand (transparent, tight-cropped vectors):
 *            - skillship-wordmark.svg          SKILLSHIP only (works on any bg)
 *            - skillship-lockup-on-dark.svg     + white tagline  (dark surfaces)
 *            - skillship-lockup-on-light.svg    + ink tagline    (light surfaces)
 *
 *          The wordmark colours (orange/teal) read on light AND dark, so the
 *          plain wordmark needs only one file. The tagline is white in the
 *          official art, so a light-surface variant recolours ONLY the tagline
 *          (the sole white in the artwork) to ink — the letterforms are
 *          untouched.
 *
 *          Three exports:
 *            <SkillshipBadge   size={n} />            — circular badge only
 *            <SkillshipWordmark size="sm|md|lg|xl"/>  — trademark wordmark
 *            <SkillshipLockup ... />                  — badge + wordmark,
 *                                                       optional brand tagline
 *                                                       or a role sub-label
 * Owner:   Pranav
 */

import Image from "next/image";

/** Display height (px) of the wordmark letterforms per size token. */
const WORDMARK_HEIGHTS = {
  sm: 18,
  md: 22,
  lg: 28,
  xl: 32,
} as const;

type WordmarkSize = keyof typeof WORDMARK_HEIGHTS;

/* The lockup (wordmark + tagline) is taller than the bare wordmark by this
   ratio — straight from the two assets' viewBoxes (77.44 / 50.08) — so the
   wordmark reads at the SAME size whether or not the tagline is shown. */
const LOCKUP_RATIO = 77.44 / 50.08;

/** Which tagline variant to use. `auto` follows the theme (.dark); use the
 *  explicit tones on surfaces whose colour is fixed regardless of theme. */
type Tone = "auto" | "dark" | "light";

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
  const h = WORDMARK_HEIGHTS[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/skillship-wordmark.svg"
      alt="SKILLSHIP"
      style={{ height: h, width: "auto" }}
      className={`block w-auto select-none ${className}`}
      draggable={false}
    />
  );
}

/** The wordmark + "# Where Fun Meets Learning" tagline lockup image. */
function BrandTagline({ heightPx, tone }: { heightPx: number; tone: Tone }) {
  const onLight = "/brand/skillship-lockup-on-light.svg"; // ink tagline
  const onDark = "/brand/skillship-lockup-on-dark.svg"; // white tagline
  const style = { height: heightPx, width: "auto" } as const;

  if (tone === "dark") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={onDark} alt="SKILLSHIP — Where Fun Meets Learning" style={style} className="block w-auto select-none" draggable={false} />;
  }
  if (tone === "light") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={onLight} alt="SKILLSHIP — Where Fun Meets Learning" style={style} className="block w-auto select-none" draggable={false} />;
  }
  // auto: swap with the theme — ink tagline in light mode, white in dark mode.
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={onLight} alt="SKILLSHIP — Where Fun Meets Learning" style={style} className="block w-auto select-none dark:hidden" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={onDark} alt="" aria-hidden="true" style={style} className="hidden w-auto select-none dark:block" draggable={false} />
    </>
  );
}

export function SkillshipLockup({
  badgeSize = 40,
  wordmarkSize = "md",
  className = "",
  subLabel,
  brandTagline = false,
  tone = "auto",
}: {
  badgeSize?: number;
  wordmarkSize?: WordmarkSize;
  className?: string;
  /** Optional sub-label rendered under the wordmark (e.g. "Super Admin"). */
  subLabel?: string;
  /** Show the official "# Where Fun Meets Learning" tagline under the wordmark. */
  brandTagline?: boolean;
  /** Tagline colour mode — `auto` follows the theme; see Tone. */
  tone?: Tone;
}) {
  const wmHeight = WORDMARK_HEIGHTS[wordmarkSize];

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SkillshipBadge size={badgeSize} />
      {brandTagline ? (
        <BrandTagline heightPx={Math.round(wmHeight * LOCKUP_RATIO)} tone={tone} />
      ) : (
        <span className="inline-flex flex-col justify-center leading-tight">
          <SkillshipWordmark size={wordmarkSize} />
          {subLabel ? (
            <span className="mt-1 text-[11px] font-medium text-[var(--muted-foreground)]">
              {subLabel}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
