/*
 * File:    frontend/src/app/apple-icon.tsx
 * Purpose: Apple touch icon (<link rel="apple-touch-icon">) for iOS home-screen
 *          bookmarks and some link-preview surfaces.
 * Owner:   Pranav
 *
 * Same solid brand-gradient mark as the favicon, at the 180x180 Apple expects.
 * Edge runtime for the same reason as icon.tsx (Windows-safe @vercel/og build).
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          color: "#FFFFFF",
          fontSize: 120,
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
