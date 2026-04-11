import type { Metadata } from "next";
import { WorkshopFeatured } from "@/components/workshops/WorkshopFeatured";
import { WorkshopFilters } from "@/components/workshops/WorkshopFilters";
import { WorkshopGrid } from "@/components/workshops/WorkshopGrid";
import { WorkshopHero } from "@/components/workshops/WorkshopHero";
import { CTABanner } from "@/components/shared/CTABanner";
import { PageContainer } from "@/components/layout/PageContainer";
import { getWorkshopCatalog } from "@/services/workshops";

export const metadata: Metadata = {
  title: "Workshops",
  description:
    "Explore Skillship AI, robotics, and coding workshops designed for Indian schools from Class 1 to 12.",
};

interface WorkshopsPageProps {
  searchParams?: {
    category?: string | string[];
    difficulty?: string | string[];
    classLevel?: string | string[];
  };
}

export default function WorkshopsPage({ searchParams = {} }: WorkshopsPageProps) {
  const catalog = getWorkshopCatalog(searchParams);

  return (
    <>
      <WorkshopHero
        featuredWorkshop={catalog.featuredWorkshop}
        totalCount={catalog.totalCount}
      />
      <WorkshopFeatured workshop={catalog.featuredWorkshop} />

      <section className="py-16 md:py-20">
        <PageContainer className="px-6 lg:px-8">
          <WorkshopFilters
            filters={catalog.filters}
            filterOptions={catalog.filterOptions}
            filteredCount={catalog.filteredCount}
            totalCount={catalog.totalCount}
            workshops={catalog.workshops}
          />
        </PageContainer>
      </section>

      <WorkshopGrid workshops={catalog.workshops} />
      <CTABanner />
    </>
  );
}
