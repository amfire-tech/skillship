import { Container } from "@/components/ui/Container";
import { WorkshopCard } from "@/components/marketplace/WorkshopCard";
import type { MarketplaceWorkshopItem } from "@/types";

interface MarketplaceGridProps {
  workshops: MarketplaceWorkshopItem[];
}

export function MarketplaceGrid({ workshops }: MarketplaceGridProps) {
  return (
    <section className="pb-20 pt-10 md:pb-24">
      <Container className="px-6 lg:px-8">
        {workshops.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {workshops.map((workshop) => (
              <WorkshopCard key={workshop.id} workshop={workshop} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-white px-8 py-14 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              No workshops match these filters
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
              Try a broader subject or duration to see more options from the marketplace catalog.
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}
