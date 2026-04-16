import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactHero } from "@/components/contact/ContactHero";
import { ContactInfoCard } from "@/components/contact/ContactInfoCard";
import { MarketplaceCTA } from "@/components/marketplace/MarketplaceCTA";
import { PageContainer } from "@/components/layout/PageContainer";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Skillship for school partnerships, workshop planning, and product questions.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />

      <section className="py-16 md:py-20">
        <PageContainer className="px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <ContactForm />
            <ContactInfoCard />
          </div>
        </PageContainer>
      </section>

      <MarketplaceCTA />
    </>
  );
}
