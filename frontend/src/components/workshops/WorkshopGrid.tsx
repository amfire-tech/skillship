"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { WorkshopCard } from "@/components/workshops/WorkshopCard";
import type { WorkshopItem } from "@/types";

interface WorkshopGridProps {
  workshops: WorkshopItem[];
}

function getVisibleCards(width: number) {
  if (width >= 1280) {
    return 3;
  }

  if (width >= 768) {
    return 2;
  }

  return 1;
}

export function WorkshopGrid({ workshops }: WorkshopGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  const maxIndex = useMemo(
    () => Math.max(0, workshops.length - visibleCards),
    [visibleCards, workshops.length]
  );

  useEffect(() => {
    const handleResize = () => {
      const nextVisibleCards = getVisibleCards(window.innerWidth);
      setVisibleCards(nextVisibleCards);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    const targetCard = cardRefs.current[index];

    if (!container || !targetCard) {
      return;
    }

    container.scrollTo({
      left: targetCard.offsetLeft,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToIndex(activeIndex);
  }, [activeIndex, scrollToIndex]);

  useEffect(() => {
    if (isPaused || maxIndex === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, 3500);

    return () => window.clearInterval(interval);
  }, [isPaused, maxIndex]);

  const handlePrevious = () => {
    setActiveIndex((current) => (current <= 0 ? maxIndex : current - 1));
  };

  const handleNext = () => {
    setActiveIndex((current) => (current >= maxIndex ? 0 : current + 1));
  };

  return (
    <SectionWrapper background="default" className="py-16 md:py-20">
      <div
        id="catalog"
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
            Workshops grid
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)] md:text-3xl">
            Designed for easy browsing
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
            This carousel advances automatically one card at a time so users can
            keep browsing without losing context.
          </p>
        </div>

        {workshops.length > 0 ? (
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Auto-scrolling
            </p>
            <button
              type="button"
              onClick={handlePrevious}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--foreground)] transition-colors hover:border-primary/25 hover:text-primary"
              aria-label="Show previous workshop card"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--foreground)] transition-colors hover:border-primary/25 hover:text-primary"
              aria-label="Show next workshop card"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      {workshops.length > 0 ? (
        <div
          className="mt-10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={containerRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {workshops.map((workshop, index) => (
              <div
                key={workshop.id}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                className="w-[300px] min-w-[300px] snap-start shrink-0 md:w-[320px] md:min-w-[320px] xl:w-[340px] xl:min-w-[340px]"
              >
                <WorkshopCard workshop={workshop} />
              </div>
            ))}
          </div>

          {maxIndex > 0 ? (
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? "w-8 bg-primary"
                        : "w-2.5 bg-[var(--border)] hover:bg-primary/40"
                    }`}
                    aria-label={`Go to workshop slide ${index + 1}`}
                  />
                ))}
              </div>

              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                Slide {activeIndex + 1} of {maxIndex + 1}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 rounded-[32px] border border-dashed border-[var(--border)] bg-[var(--muted)] px-6 py-16 text-center">
          <h3 className="text-xl font-bold text-[var(--foreground)]">
            No workshops match these filters
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
            Try widening the category, difficulty, or class level to browse the
            full Skillship workshop catalog.
          </p>
          <div className="mt-8">
            <Link href="/workshops">
              <Button variant="secondary" className="rounded-full px-8">
                Clear filters
              </Button>
            </Link>
          </div>
        </div>
      )}
    </SectionWrapper>
  );
}
