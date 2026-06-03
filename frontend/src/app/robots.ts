/*
 * File:    frontend/src/app/robots.ts
 * Purpose: Auto-generated /robots.txt — tells crawlers what to skip + points at the sitemap.
 * Owner:   Navanish (Phase ship — completes "SEO-optimized public website" line item)
 *
 * What we allow:
 *   The public marketing routes (handled implicitly by the lack of a Disallow).
 *
 * What we Disallow:
 *   - /dashboard/*     — every authenticated screen. No reason for a crawler to fetch.
 *   - /login           — login page is functional, not content.
 *   - /forgot-password — same reason.
 *   - /unauthorized    — error route.
 *   - /api/*           — proxy / internal routes; never useful for indexing.
 *   - /_next/*         — Next.js internals.
 *
 * If we ever need a noindex variant per page, add a per-route `metadata.robots`
 * export — this file is just the site-wide policy.
 */

import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/login",
          "/forgot-password",
          "/unauthorized",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
