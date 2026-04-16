"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { MarketplaceWorkshopItem } from "@/types";

const categoryLabels = {
  ai: "AI",
  robotics: "Robotics",
  coding: "Coding",
  electronics: "Electronics",
  iot: "IoT",
} as const;

const categoryVariants = {
  ai: "info",
  robotics: "purple",
  coding: "cyan",
  electronics: "orange",
  iot: "success",
} as const;

interface WorkshopCardProps {
  workshop: MarketplaceWorkshopItem;
}

export function WorkshopCard({ workshop }: WorkshopCardProps) {
  const toast = useToast();
  return (
    <Card
      hoverable
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[0_18px_50px_-35px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-1"
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b border-[var(--border)] bg-[var(--muted)]">
        <Image
          src={workshop.image}
          alt={workshop.imageAlt}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <CardContent className="flex h-full flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={categoryVariants[workshop.category]}>
            {categoryLabels[workshop.category]}
          </Badge>
          <Badge className="bg-[var(--muted)] text-[var(--card-foreground)]">Skillship</Badge>
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              {workshop.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              {workshop.description}
            </p>
          </div>

          <div className="rounded-2xl bg-primary-50 px-3 py-2 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-600">
              Price
            </p>
            <p className="mt-1 text-lg font-bold text-[var(--foreground)]">
              ₹{workshop.price.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[var(--muted)] p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Duration
            </p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">
              {workshop.duration}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Class range
            </p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">
              {workshop.classRange}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-5">
          {workshop.subscribed ? (
            <div className="inline-flex w-full items-center justify-center rounded-full bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-600">
              Subscribed
            </div>
          ) : (
            <Button onClick={() => toast(`Booking "${workshop.title}"…`, "success")} className="w-full rounded-full">Book Now</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
