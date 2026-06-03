/*
 * File:    frontend/src/components/home/PillarNumberBackdrop.tsx
 * Purpose: Giant, faint, orange-lit pillar number (01 / 02 / 03) that HOLDS
 *          in place for the entire pillar section, then hands off to the next
 *          pillar's number. Implemented with position:sticky inside a
 *          full-height absolute layer, so the number pins to the viewport
 *          while its section scrolls past and only leaves when the section
 *          ends — exactly the "hold until this pillar is done" behaviour.
 *
 *          Host requirements: the section must be position:relative and put
 *          its real content in a sibling at z-10 (this layer sits at z-0).
 * Owner:   Pranav (homepage rebuild — pillar wayfinding)
 */

"use client";

export function PillarNumberBackdrop({
  number,
  align = "right",
}: {
  number: string;
  /** Which side the number hugs. */
  align?: "left" | "right";
}) {
  const justify = align === "right" ? "justify-end pr-[3vw]" : "justify-start pl-[3vw]";
  const glowSide = align === "right" ? "right-[3%]" : "left-[3%]";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className={`relative flex w-full ${justify}`}>
          {/* warm light behind the number */}
          <div
            className={`absolute top-1/2 h-[46vh] w-[46vh] -translate-y-1/2 rounded-full opacity-[0.16] blur-[130px] ${glowSide}`}
            style={{ background: "var(--orange-500)" }}
          />
          <span
            className="select-none font-bold leading-none tracking-tighter text-[var(--orange-500)] opacity-[0.10]"
            style={{ fontSize: "clamp(15rem, 38vw, 44rem)" }}
          >
            {number}
          </span>
        </div>
      </div>
    </div>
  );
}
