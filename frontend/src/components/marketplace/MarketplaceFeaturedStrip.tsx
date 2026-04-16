import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Card, CardContent } from "@/components/ui/Card";
import type { MarketplaceWorkshopItem } from "@/types";

interface MarketplaceFeaturedStripProps {
  workshops: MarketplaceWorkshopItem[];
}

export function MarketplaceFeaturedStrip({
  workshops,
}: MarketplaceFeaturedStripProps) {
  return (
    <section className="py-12 md:py-14">
      <Container className="px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
              Featured workshops
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Most requested by partner schools
            </h2>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {workshops.map((workshop) => (
            <Card
              key={workshop.id}
              className="overflow-hidden rounded-[26px] border-[var(--border)] bg-white"
            >
              <div className="relative aspect-[16/8.8] border-b border-[var(--border)] bg-[var(--muted)]">
                <Image
                  src={workshop.image}
                  alt={workshop.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 28vw, 100vw"
                  className="object-cover"
                />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="info">Featured</Badge>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    ₹{workshop.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <h3 className="mt-4 text-xl font-bold tracking-tight text-[var(--foreground)]">
                  {workshop.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {workshop.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
