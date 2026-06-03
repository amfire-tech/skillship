/*
 * File:    frontend/src/services/marketplace.ts
 * Purpose: Server-side fetcher for the public /marketplace catalog.
 * Owner:   Navanish (Phase ship — was a 241-line hardcoded array)
 *
 * The Next.js public marketplace page (RSC, no session) calls this with the
 * page's searchParams. We hit the Django backend's public catalog endpoint
 * (AllowAny — see backend/apps/content/views.py::MarketplaceListingViewSet)
 * and map each row to the MarketplaceWorkshopItem shape the existing
 * components (WorkshopCard, MarketplaceGrid, FeaturedStrip) already expect.
 *
 * Filtering is applied client-side after the fetch. With ~5–100 listings
 * that is comfortably fast; if the catalog ever grows past a few hundred,
 * we will push category/difficulty/duration into a server-side filterset.
 *
 * Listings without a `category` value are intentionally omitted from the
 * public catalog: the WorkshopCard hard-depends on category → label / variant
 * lookup tables, and showing a row with no badge would render broken UI.
 * Admins fill the marketing taxonomy fields before flipping `is_active=True`.
 */

import type {
  MarketplaceCatalogFilters,
  MarketplaceCatalogResponse,
  MarketplaceCategory,
  MarketplaceDifficulty,
  MarketplaceDuration,
  MarketplaceWorkshopItem,
  WorkshopFilterOption,
} from "@/types";

const categoryOptions = [
  { label: "All", value: "all" },
  { label: "Robotics", value: "robotics" },
  { label: "AI", value: "ai" },
  { label: "Coding", value: "coding" },
  { label: "Electronics", value: "electronics" },
  { label: "IoT", value: "iot" },
] as const;

const difficultyOptions: WorkshopFilterOption<MarketplaceDifficulty>[] = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const durationOptions: WorkshopFilterOption<MarketplaceDuration>[] = [
  { label: "Under 2 hours", value: "under-2-hours" },
  { label: "Half day", value: "half-day" },
  { label: "Multi-session", value: "multi-session" },
];

const categorySet = new Set(
  categoryOptions.filter((o) => o.value !== "all").map((o) => o.value)
);
const difficultySet = new Set(difficultyOptions.map((o) => o.value));
const durationSet = new Set(durationOptions.map((o) => o.value));

// Raw shape returned by Django's MarketplaceListingSerializer. Fields are
// blank-allowed strings on the backend — we treat "" as missing.
interface BackendListing {
  id: string;
  title: string;
  description: string;
  kind: string;
  price_inr: string;       // DRF DecimalField → string in JSON
  file_url: string;
  cover_image_url: string;
  is_active: boolean;
  featured: boolean;
  category: string;
  difficulty: string;
  duration_key: string;
  duration_label: string;
  class_range: string;
}

const FALLBACK_IMAGE = "/workshops/ai-workshop.svg";

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeFilters(
  filters: Record<string, string | string[] | undefined>
): MarketplaceCatalogFilters {
  const category = firstValue(filters.category);
  const difficulty = firstValue(filters.difficulty);
  const duration = firstValue(filters.duration);
  return {
    category: category && categorySet.has(category as MarketplaceCategory)
      ? (category as MarketplaceCategory) : undefined,
    difficulty: difficulty && difficultySet.has(difficulty as MarketplaceDifficulty)
      ? (difficulty as MarketplaceDifficulty) : undefined,
    duration: duration && durationSet.has(duration as MarketplaceDuration)
      ? (duration as MarketplaceDuration) : undefined,
  };
}

function toWorkshop(row: BackendListing): MarketplaceWorkshopItem | null {
  // The card hard-depends on category for badge styling. Skip listings that
  // have not been fully tagged for the public catalog yet.
  if (!row.category || !categorySet.has(row.category as MarketplaceCategory)) {
    return null;
  }
  // Difficulty / duration are not load-bearing for render — fall back to safe defaults.
  const difficulty = (difficultySet.has(row.difficulty as MarketplaceDifficulty)
    ? row.difficulty : "beginner") as MarketplaceDifficulty;
  const durationKey = (durationSet.has(row.duration_key as MarketplaceDuration)
    ? row.duration_key : "under-2-hours") as MarketplaceDuration;

  return {
    id: row.id,
    slug: row.id,  // backend has no slug field; UUID is unique + stable.
    title: row.title,
    category: row.category as MarketplaceCategory,
    difficulty,
    durationKey,
    duration: row.duration_label || "—",
    classRange: row.class_range || "—",
    description: row.description,
    image: row.cover_image_url || FALLBACK_IMAGE,
    imageAlt: `${row.title} workshop artwork`,
    price: Number(row.price_inr) || 0,
    featured: row.featured,
  };
}

async function fetchCatalog(): Promise<BackendListing[]> {
  // Server-side fetch — happens on each request. Next caches with a short
  // revalidate window so admins editing a listing see updates within a minute,
  // without hammering the backend on every visit.
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
  // Backend pagination caps at 20 by default; bump up via ?page_size=. If the
  // catalog ever grows past that, swap to server-side filtering at the same time.
  const url = `${base}/content/marketplace/?page_size=100`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    // DRF returns {count, next, previous, results: [...]} when paginated.
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    // Backend unreachable (build time, network blip) — render an empty
    // catalog rather than 500. Marketing page should always load.
    return [];
  }
}

export async function getMarketplaceCatalog(
  rawFilters: Record<string, string | string[] | undefined> = {}
): Promise<MarketplaceCatalogResponse> {
  const filters = sanitizeFilters(rawFilters);
  const raw = await fetchCatalog();

  const all: MarketplaceWorkshopItem[] = raw
    .map(toWorkshop)
    .filter((w): w is MarketplaceWorkshopItem => w !== null);

  const workshops = all.filter((w) => {
    if (filters.category && w.category !== filters.category) return false;
    if (filters.difficulty && w.difficulty !== filters.difficulty) return false;
    if (filters.duration && w.durationKey !== filters.duration) return false;
    return true;
  });

  return {
    featuredWorkshops: all.filter((w) => w.featured).slice(0, 3),
    workshops,
    filters,
    filterOptions: {
      categories: [...categoryOptions],
      difficulties: difficultyOptions,
      durations: durationOptions,
    },
    totalCount: all.length,
    filteredCount: workshops.length,
  };
}
