/*
 * File:    frontend/src/services/gallery.ts
 * Purpose: Server-side fetcher for the public /gallery photo grid.
 * Owner:   Navanish (backend) / Pranav (frontend wiring)
 *
 * Hits Django's public gallery endpoint (AllowAny — see
 * backend/apps/gallery/views.py::GalleryImageViewSet), which only returns
 * images a Super Admin has marked is_active=True, already ordered.
 */

export interface GalleryImageItem {
  id: string;
  imageUrl: string;
  caption: string;
}

interface RawGalleryImage {
  id: string;
  image: string;
  caption: string;
}

export async function getGalleryImages(): Promise<GalleryImageItem[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${base}/gallery/?page_size=100`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    const rows: RawGalleryImage[] = data.results ?? data ?? [];
    return rows.map((row) => ({
      id: row.id,
      imageUrl: row.image,
      caption: row.caption,
    }));
  } catch {
    return [];
  }
}
