"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import type { WorkshopCatalogResponse } from "@/types";

const SCROLL_RESTORE_KEY = "skillship-workshops-scroll-y";

interface WorkshopFiltersProps {
  filters: WorkshopCatalogResponse["filters"];
  filterOptions: WorkshopCatalogResponse["filterOptions"];
  filteredCount: number;
  totalCount: number;
  workshops: WorkshopCatalogResponse["workshops"];
}

function FilterSelect({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value?: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
        {label}
      </span>
      <select
        name={name}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
      >
        <option value="">All {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function WorkshopFilters({
  filters,
  filterOptions,
  filteredCount,
  totalCount,
  workshops,
}: WorkshopFiltersProps) {
  const router = useRouter();
  const [category, setCategory] = useState(filters.category ?? "");
  const [difficulty, setDifficulty] = useState(filters.difficulty ?? "");
  const [classLevel, setClassLevel] = useState(filters.classLevel ?? "");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedScroll = window.sessionStorage.getItem(SCROLL_RESTORE_KEY);

    if (!storedScroll) {
      return;
    }

    const scrollY = Number(storedScroll);

    window.sessionStorage.removeItem(SCROLL_RESTORE_KEY);

    if (Number.isNaN(scrollY)) {
      return;
    }

    const restore = () => window.scrollTo({ top: scrollY, behavior: "auto" });

    restore();
    requestAnimationFrame(restore);

    const timeoutId = window.setTimeout(restore, 120);

    return () => window.clearTimeout(timeoutId);
  }, [filters.category, filters.difficulty, filters.classLevel, filteredCount]);

  const hasActiveFilters =
    Boolean(filters.category) || Boolean(filters.difficulty) || Boolean(filters.classLevel);

  const activeFilters = [
    filters.category
      ? filterOptions.categories.find((option) => option.value === filters.category)?.label
      : null,
    filters.difficulty
      ? filterOptions.difficulties.find((option) => option.value === filters.difficulty)?.label
      : null,
    filters.classLevel
      ? filterOptions.classLevels.find((option) => option.value === filters.classLevel)?.label
      : null,
  ].filter(Boolean) as string[];

  const storeScrollPosition = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(SCROLL_RESTORE_KEY, String(window.scrollY));
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    storeScrollPosition();

    const params = new URLSearchParams();

    if (category) {
      params.set("category", category);
    }

    if (difficulty) {
      params.set("difficulty", difficulty);
    }

    if (classLevel) {
      params.set("classLevel", classLevel);
    }

    const query = params.toString();
    const href = query ? `/workshops?${query}` : "/workshops";

    router.replace(href, { scroll: false });
  };

  const clearFilters = () => {
    storeScrollPosition();
    setCategory("");
    setDifficulty("");
    setClassLevel("");
    router.replace("/workshops", { scroll: false });
  };

  return (
    <section aria-label="Workshop filters">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-card md:p-6">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
              Browse workshops
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Find the right workshop faster
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Choose a category, difficulty, or class band. The matching workshops
              update in the carousel below.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm">
              <span className="font-semibold text-[var(--foreground)]">{filteredCount}</span>
              <span className="text-[var(--muted-foreground)]"> of {totalCount} workshops visible</span>
            </div>
            <Link
              href="#catalog"
              className="text-sm font-semibold text-primary transition-colors hover:text-primary-700"
            >
              View results
            </Link>
          </div>
        </div>

        <form
          onSubmit={applyFilters}
          className="mt-5 grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-end"
        >
          <FilterSelect
            label="Category"
            name="category"
            value={category}
            options={filterOptions.categories}
            onChange={setCategory}
          />
          <FilterSelect
            label="Difficulty"
            name="difficulty"
            value={difficulty}
            options={filterOptions.difficulties}
            onChange={setDifficulty}
          />
          <FilterSelect
            label="Class level"
            name="classLevel"
            value={classLevel}
            options={filterOptions.classLevels}
            onChange={setClassLevel}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-[var(--border)] px-6 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-primary/25 hover:text-primary"
            >
              {hasActiveFilters ? "Clear filters" : "Reset"}
            </button>
          </div>
        </form>

        <div className="mt-5 grid gap-4 border-t border-[var(--border)] pt-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Active filters
            </p>
            {activeFilters.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="info" className="px-3 py-1 text-xs">
                    {filter}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                No filters selected. Showing the full workshop catalog.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                Matching workshops
              </p>
              <Link
                href="#catalog"
                className="text-sm font-semibold text-primary transition-colors hover:text-primary-700"
              >
                Jump to cards
              </Link>
            </div>

            {workshops.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {workshops.slice(0, 4).map((workshop) => (
                  <span
                    key={workshop.id}
                    className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)]"
                  >
                    {workshop.title}
                  </span>
                ))}
                {workshops.length > 4 ? (
                  <span className="inline-flex items-center rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                    +{workshops.length - 4} more
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                No workshops match the current filter combination.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
