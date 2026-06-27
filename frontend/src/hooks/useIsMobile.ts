/*
 * File:    frontend/src/hooks/useIsMobile.ts
 * Purpose: Reports whether the viewport is phone-sized (<= 768px). Used to gate
 *          expensive motion on mobile so the dashboards stay smooth on real
 *          mid/low-end Android devices.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

/**
 * SSR-safe mobile detector. Renders `false` (desktop) on the server and first
 * client paint to avoid a hydration mismatch, then resolves to the real value
 * on mount and stays in sync via a `matchMedia` listener. Because callers only
 * use it to *reduce* motion, the brief first-paint "desktop" value is harmless.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    // Safari < 14 only supports the deprecated addListener signature.
    if (mql.addEventListener) mql.addEventListener("change", update);
    else mql.addListener(update);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", update);
      else mql.removeListener(update);
    };
  }, []);

  return isMobile;
}
