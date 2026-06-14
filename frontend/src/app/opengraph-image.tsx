/*
 * File:    frontend/src/app/opengraph-image.tsx
 * Purpose: Site-wide social-share image (og:image + twitter:image).
 * Owner:   Pranav
 *
 * Next.js auto-discovers this file convention and injects the generated 1200x630
 * PNG into <meta property="og:image"> and <meta name="twitter:image"> for every
 * page that doesn't define its own. This REPLACES the stale "idp" image that
 * WhatsApp / Google had cached from the old skillship.in site — the new site
 * previously shipped NO og:image, so platforms fell back to that cache.
 *
 * Runs on the Edge runtime: the Node build of @vercel/og crashes at import on
 * Windows (fileURLToPath on a path.join'd file:// URL), and Edge needs no fs, so
 * the card is composed entirely from divs/text + the brand "S" mark (no embedded
 * bitmap). Rendered once at build time → served as a static asset.
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Skillship — AI-Powered Learning for Indian Schools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          // Satori (Edge @vercel/og) only parses simple gradient syntax, so we
          // use a diagonal linear-gradient with subtle brand tints rather than
          // positioned radial "glows".
          background:
            "linear-gradient(135deg, #16242B 0%, #0F1419 45%, #11201F 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: brand "S" mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 110,
              height: 110,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #F39C32 0%, #2EB6B5 100%)",
              color: "#FFFFFF",
              fontSize: 72,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>
            <span style={{ color: "#F39C32" }}>SKILL</span>
            <span style={{ color: "#2EB6B5" }}>SHIP</span>
          </div>
        </div>

        {/* Middle: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 78, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.05, letterSpacing: -2 }}>
            AI-Powered Learning
          </div>
          <div style={{ fontSize: 38, color: "#C7D0DA", lineHeight: 1.3, maxWidth: 940 }}>
            School management &amp; career guidance for Indian schools — AI &amp; robotics
            workshops for Class 1–12.
          </div>
        </div>

        {/* Bottom: domain + accent bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#2EB6B5" }}>skillship.in</div>
          <div
            style={{
              width: 220,
              height: 12,
              borderRadius: 999,
              background: "linear-gradient(135deg, #F39C32 0%, #2EB6B5 100%)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
