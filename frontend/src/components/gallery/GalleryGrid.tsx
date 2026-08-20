/*
 * File:    frontend/src/components/gallery/GalleryGrid.tsx
 * Purpose: Masonry-style photo grid with a click-to-expand lightbox for the
 *          public /gallery page.
 * Owner:   Pranav
 */

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImageItem } from "@/services/gallery";

export function GalleryGrid({ images }: { images: GalleryImageItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") setActiveIndex((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [activeIndex, images.length]);

  if (images.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-[color:var(--border-subtle)] px-6 py-16 text-center">
        <p className="text-sm text-[var(--ink-secondary)]">No photos published yet — check back soon.</p>
      </div>
    );
  }

  const active = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="group block w-full overflow-hidden rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--card)] transition-shadow duration-300 hover:shadow-warm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.imageUrl}
              alt={img.caption || "Skillship gallery photo"}
              loading="lazy"
              className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {img.caption && (
              <p className="px-4 py-2.5 text-left text-[13px] font-medium text-[var(--ink-secondary)]">{img.caption}</p>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setActiveIndex(null)}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setActiveIndex(null)}
              className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X size={20} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)); }}
                  className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:left-6"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i === null ? i : (i + 1) % images.length)); }}
                  className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:right-6"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            <motion.div
              key={active.id}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85vh] max-w-[90vw] flex-col items-center gap-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.imageUrl}
                alt={active.caption || "Skillship gallery photo"}
                className="max-h-[75vh] w-auto rounded-xl object-contain shadow-2xl"
              />
              {active.caption && <p className="text-sm font-medium text-white/90">{active.caption}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
