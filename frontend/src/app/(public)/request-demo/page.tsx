import type { Metadata } from "next";
import { DemoBenefits } from "@/components/request-demo/DemoBenefits";
import { FormCard } from "@/components/request-demo/FormCard";
import { RequestDemoHero } from "@/components/request-demo/RequestDemoHero";
import { WhatHappensNext } from "@/components/request-demo/WhatHappensNext";
import { PageContainer } from "@/components/layout/PageContainer";

export const metadata: Metadata = {
  title: "Request Demo",
  description:
    "Request a personalized Skillship demo for your school and explore AI-powered learning, analytics, and workshop delivery.",
};

export default function RequestDemoPage() {
  return (
    <>
      <RequestDemoHero />
      <WhatHappensNext />

      <section className="py-16 md:py-20">
        <PageContainer className="px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <FormCard />
            <DemoBenefits />
          </div>
        </PageContainer>
      </section>
    </>
  );
}
