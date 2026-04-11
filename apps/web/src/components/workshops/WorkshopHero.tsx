import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import type { WorkshopItem } from "@/types";

interface WorkshopHeroProps {
  featuredWorkshop: WorkshopItem;
  totalCount: number;
}

export function WorkshopHero({
  featuredWorkshop,
  totalCount,
}: WorkshopHeroProps) {
  return (
    <SectionWrapper
      background="default"
      className="relative overflow-hidden py-20 md:py-24 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="pointer-events-none absolute left-[-6rem] top-16 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute right-[-5rem] top-24 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/90 px-4 py-1.5 text-sm font-medium text-primary shadow-[0_12px_30px_-20px_rgba(37,99,235,0.45)]">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Curated for Indian schools from Class 1 to 12
          </div>

          <h1 className="mt-8 text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[56px] lg:leading-[1.08]">
            Explore AI &amp; Robotics Workshops
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            Browse structured Skillship workshops designed for clarity, classroom
            fit, and future-ready outcomes across AI, robotics, and coding.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/request-demo">
              <Button size="lg" className="rounded-full px-8">
                Request Demo
              </Button>
            </Link>
            <Link href="#catalog">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full border-primary/20 bg-white px-8 text-[var(--foreground)]"
              >
                View Workshops
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-[var(--border)] bg-white px-5 py-4 shadow-card">
              <p className="text-2xl font-bold text-[var(--foreground)]">{totalCount}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                curated workshop formats
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-white px-5 py-4 shadow-card">
              <p className="text-2xl font-bold text-[var(--foreground)]">500+</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                schools served nationwide
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-white px-5 py-4 shadow-card">
              <p className="text-2xl font-bold text-[var(--foreground)]">Class 1-12</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                progression-friendly coverage
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)]">
          <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--muted)]">
            <Image
              src={featuredWorkshop.image}
              alt={featuredWorkshop.imageAlt}
              width={900}
              height={640}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/75">
                Most booked this month
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {featuredWorkshop.title}
              </h2>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Featured
            </span>
          </div>

          <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
            {featuredWorkshop.overview}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--muted)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                Duration
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {featuredWorkshop.duration}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--muted)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                Class range
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {featuredWorkshop.classRange}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
