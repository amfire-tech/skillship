"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { MarketplaceCatalogFilters, MarketplaceCatalogResponse } from "@/types";

interface MarketplaceFiltersProps {
  filters: MarketplaceCatalogFilters;
  filterOptions: MarketplaceCatalogResponse["filterOptions"];
  filteredCount: number;
  totalCount: number;
}

export function MarketplaceFilters({
  filters,
  filterOptions,
  filteredCount,
  totalCount,
}: MarketplaceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeCount = useMemo(() => {
    return [filters.category, filters.difficulty, filters.duration].filter(Boolean).length;
  }, [filters.category, filters.difficulty, filters.duration]);

  function updateParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function resetFilters() {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  return (
    <Card className="rounded-[28px] border-[var(--border)] bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.18)]">
      <CardContent className="space-y-8 p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
              Filter marketplace
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Find the right workshop quickly
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Narrow by subject, delivery level, and session length without leaving the page.
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            Showing <span className="font-semibold text-[var(--foreground)]">{filteredCount}</span> of{" "}
            <span className="font-semibold text-[var(--foreground)]">{totalCount}</span> workshops
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Category
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {filterOptions.categories.map((option) => {
              const active =
                option.value === "all"
                  ? !filters.category
                  : filters.category === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateParam("category", option.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Difficulty
            </span>
            <select
              value={filters.difficulty ?? ""}
              onChange={(event) => updateParam("difficulty", event.target.value)}
              className="mt-3 h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-primary"
            >
              <option value="">All difficulty</option>
              {filterOptions.difficulties.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Duration
            </span>
            <select
              value={filters.duration ?? ""}
              onChange={(event) => updateParam("duration", event.target.value)}
              className="mt-3 h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-primary"
            >
              <option value="">All durations</option>
              {filterOptions.durations.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              onClick={resetFilters}
              className="h-12 rounded-2xl px-5"
              disabled={isPending || activeCount === 0}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
