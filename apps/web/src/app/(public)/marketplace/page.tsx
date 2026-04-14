import type { Metadata } from "next";
import { MarketplaceBenefits } from "@/components/marketplace/MarketplaceBenefits";
import { MarketplaceCTA } from "@/components/marketplace/MarketplaceCTA";
import { MarketplaceFeaturedStrip } from "@/components/marketplace/MarketplaceFeaturedStrip";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { PageContainer } from "@/components/layout/PageContainer";
import { getMarketplaceCatalog } from "@/services/marketplace";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse Skillship's AI, robotics, coding, electronics, and IoT workshops for Indian schools.",
};

interface MarketplacePageProps {
  searchParams?: {
    category?: string | string[];
    difficulty?: string | string[];
    duration?: string | string[];
  };
}

export default function MarketplacePage({
  searchParams = {},
}: MarketplacePageProps) {
  const catalog = getMarketplaceCatalog(searchParams);

  return (
    <>
      <MarketplaceHero totalCount={catalog.totalCount} />
      <MarketplaceBenefits />
      <MarketplaceFeaturedStrip workshops={catalog.featuredWorkshops} />

      <section className="pb-10 pt-2">
        <PageContainer className="px-6 lg:px-8">
          <MarketplaceFilters
            filters={catalog.filters}
            filterOptions={catalog.filterOptions}
            filteredCount={catalog.filteredCount}
            totalCount={catalog.totalCount}
          />
        </PageContainer>
      </section>

      <MarketplaceGrid workshops={catalog.workshops} />
      <MarketplaceCTA />
    </>
  );
}
