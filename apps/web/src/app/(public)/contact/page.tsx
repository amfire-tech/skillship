import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
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
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <PageContainer className="px-6 py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
              Contact Skillship
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Get in Touch
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Connect with our team for workshop planning, partnership questions,
              or a clear walkthrough of how Skillship can support your school.
            </p>
          </div>
        </PageContainer>
      </section>

      <section className="py-14 md:py-16">
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
