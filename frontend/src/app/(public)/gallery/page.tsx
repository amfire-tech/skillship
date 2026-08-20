/*
 * File:    frontend/src/app/(public)/gallery/page.tsx
 * Purpose: Public photo gallery — images a Super Admin has uploaded/published.
 * Owner:   Pranav
 */

import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { PageContainer } from "@/components/layout/PageContainer";
import { getGalleryImages } from "@/services/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from Skillship-powered classrooms, labs, and workshops across our partner schools.",
};

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <section className="py-16 md:py-24">
      <PageContainer className="px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ink-primary)] md:text-4xl">Gallery</h1>
          <p className="mt-3 text-[15px] text-[var(--ink-secondary)]">
            A look inside Skillship-powered classrooms, AI labs, and workshops.
          </p>
        </div>
        <GalleryGrid images={images} />
      </PageContainer>
    </section>
  );
}
