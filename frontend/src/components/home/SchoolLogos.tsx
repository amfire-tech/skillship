/*
 * File:    frontend/src/components/home/SchoolLogos.tsx
 * Purpose: "Trusted by schools" strip — an infinite right-to-left marquee of
 *          partner-school logos (the SaaS "logo wall" pattern). Logos sit on
 *          white chips so every brand stays legible on the dark band. The
 *          track renders the set twice and translates -50% for a seamless loop
 *          (see .animate-school-marquee in globals.css). Pauses on hover.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

"use client";

// Real partner-school logos from /public/schools (extensions vary by source).
const LOGOS = [
  "logo-01.jpg", "logo-02.webp", "logo-03.png", "logo-04.jpg", "logo-05.webp",
  "logo-06.webp", "logo-07.webp", "logo-08.webp", "logo-09.webp", "logo-10.webp",
  "logo-11.webp", "logo-12.webp", "logo-13.webp", "logo-14.webp", "logo-15.jpg",
  "logo-16.webp", "logo-17.png", "logo-18.png", "logo-19.jpeg", "logo-20.jpeg",
  "logo-21.jpeg",
];

export function SchoolLogos() {
  return (
    <section className="relative border-y border-white/5 bg-[#0A0F1E] py-14">
      <p className="mb-9 text-center text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-400)]">
        Trusted by schools across India
      </p>

      <div className="marquee-mask relative flex overflow-hidden">
        {/* One track containing the logo set twice → -50% loops seamlessly. */}
        <ul className="animate-school-marquee flex w-max shrink-0 items-center gap-5 pr-5">
          {[...LOGOS, ...LOGOS].map((file, i) => (
            <li
              key={`${file}-${i}`}
              className="flex h-[88px] w-[176px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white px-6 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/schools/${file}`}
                alt="Partner school logo"
                loading="lazy"
                className="max-h-14 w-auto max-w-full object-contain"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
