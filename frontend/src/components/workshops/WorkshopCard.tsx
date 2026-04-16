import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { WorkshopItem } from "@/types";

const categoryVariants = {
  ai: "info",
  robotics: "purple",
  coding: "cyan",
} as const;

const difficultyVariants = {
  beginner: "success",
  intermediate: "warning",
  advanced: "danger",
} as const;

const categoryLabels = {
  ai: "AI",
  robotics: "Robotics",
  coding: "Coding",
} as const;

const difficultyLabels = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;

interface WorkshopCardProps {
  workshop: WorkshopItem;
}

export function WorkshopCard({ workshop }: WorkshopCardProps) {
  return (
    <Card
      hoverable
      className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-[0_24px_60px_-32px_rgba(15,23,42,0.2)]"
    >
      <div className="relative aspect-[16/6.6] overflow-hidden border-b border-[var(--border)] bg-[var(--muted)]">
        <Image
          src={workshop.image}
          alt={workshop.imageAlt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <CardContent className="flex h-full flex-col p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={categoryVariants[workshop.category]} className="px-2.5 py-0.5 text-[11px]">
            {categoryLabels[workshop.category]}
          </Badge>
          <Badge
            variant={difficultyVariants[workshop.difficulty]}
            className="px-2.5 py-0.5 text-[11px]"
          >
            {difficultyLabels[workshop.difficulty]}
          </Badge>
        </div>

        <h3 className="mt-3 text-[1.25rem] font-bold tracking-tight leading-tight text-[var(--foreground)] md:text-[1.4rem]">
          {workshop.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">
          {workshop.description}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[var(--muted)] p-3">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Duration
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">
              {workshop.duration}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Class range
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">
              {workshop.classRange}
            </dd>
          </div>
        </dl>

        <div className="mt-auto pt-4">
          <Link href={`/workshops/${workshop.slug}`}>
            <Button
              variant="secondary"
              className="h-10 w-full rounded-full border-primary/20 bg-white px-4 text-sm text-[var(--foreground)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35"
            >
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
