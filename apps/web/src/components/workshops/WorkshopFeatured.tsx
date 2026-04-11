import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Badge } from "@/components/ui/Badge";
import type { WorkshopItem } from "@/types";

interface WorkshopFeaturedProps {
  workshop: WorkshopItem;
}

export function WorkshopFeatured({ workshop }: WorkshopFeaturedProps) {
  return (
    <SectionWrapper background="muted" className="py-12 md:py-14">
      <div className="grid gap-6 rounded-[32px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-card lg:grid-cols-[1.1fr_1fr] lg:items-center lg:p-8">
        <div>
          <Badge variant="warning" className="px-3 py-1 text-[11px] uppercase tracking-[0.16em]">
            Featured workshop
          </Badge>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-[var(--foreground)] md:text-3xl">
            {workshop.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
            {workshop.overview}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
              {workshop.duration}
            </div>
            <div className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
              {workshop.classRange}
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {workshop.outcomes.slice(0, 2).map((outcome) => (
              <li key={outcome} className="flex gap-3 text-sm text-[var(--muted-foreground)]">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </span>
                <span>{outcome}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link href={`/workshops/${workshop.slug}`}>
              <Button className="rounded-full px-8">View Details</Button>
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--muted)]">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10" />
          <Image
            src={workshop.image}
            alt={workshop.imageAlt}
            width={720}
            height={480}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
