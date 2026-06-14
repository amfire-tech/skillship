/*
 * File:    frontend/src/app/icon.tsx
 * Purpose: Favicon (<link rel="icon">) used by browsers and Google search.
 * Owner:   Pranav
 *
 * The previous icon was the full circular "Skillship Edutech" badge — at 16-32px
 * its fine text is illegible and its transparent/cream fill reads as a white blob
 * on Google's white results page. This generates a crisp, SOLID brand-gradient
 * mark with a bold "S", legible and on-brand at favicon sizes.
 *
 * Edge runtime: the Node build of @vercel/og crashes at import on Windows
 * (fileURLToPath on a path.join'd file:// URL); Edge avoids that and needs no fs.
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
// 96x96 (a multiple of 48) — Google's favicon crawler prefers a 48px-multiple
// square and may otherwise fall back to a blank globe, which is the "white in
// search" symptom we're fixing. Browsers downscale this to 16/32px cleanly.
export const size = { width: 96, height: 96 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F39C32 0%, #2EB6B5 100%)",
          borderRadius: "50%",
          color: "#FFFFFF",
          fontSize: 64,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
