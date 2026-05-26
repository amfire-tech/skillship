/*
 * File:    frontend/src/app/sitemap.ts
 * Purpose: Auto-generated /sitemap.xml for SEO crawlers.
 * Owner:   Navanish (Phase ship — completes "SEO-optimized public website" line item)
 *
 * Next.js sees this file convention and serves the result at /sitemap.xml.
 * Canonical host comes from NEXT_PUBLIC_SITE_URL via siteConfig — set it on
 * the Vercel / Docker build env so prod and staging emit different hosts.
 *
 * We intentionally do NOT list dashboard, auth, or API routes — they are
 * gated and should not appear in search results.
 */

import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getWorkshopSlugs } from "@/services/workshops";

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface RouteEntry {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

const STATIC_ROUTES: RouteEntry[] = [
  { path: "/",             changeFrequency: "weekly",  priority: 1.0 },
  { path: "/about",        changeFrequency: "monthly", priority: 0.6 },
  { path: "/workshops",    changeFrequency: "weekly",  priority: 0.8 },
  { path: "/marketplace",  changeFrequency: "weekly",  priority: 0.8 },
  { path: "/request-demo", changeFrequency: "monthly", priority: 0.9 },
  { path: "/contact",      changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy",      changeFrequency: "yearly",  priority: 0.3 },
  { path: "/terms",        changeFrequency: "yearly",  priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/+$/, "");
  // lastModified rolls forward on every deploy — a reasonable proxy for
  // "page content was reviewed as part of this build".
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${base}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Workshop detail pages — sourced from the same slug list `/workshops/[slug]`
  // uses for generateStaticParams, so the sitemap and the actual rendered
  // routes stay in lockstep.
  const workshopEntries: MetadataRoute.Sitemap = getWorkshopSlugs().map(({ slug }) => ({
    url: `${base}/workshops/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...workshopEntries];
}
