/*
 * File:    frontend/src/app/(public)/page.tsx
 * Purpose: Public marketing homepage. Rebuilt to tell the AI School Program
 *          story from the Skillship catalogue:
 *
 *            Hero            — Build an AI School (the category claim)
 *            TrustStrip      — Real impact numbers from the catalogue
 *            ThePromise      — "We rebuilt the foundation." (tension)
 *            ThreePillars    — IAAS · TAAS · SAAS (the spine)
 *            IAASLabs        — Pillar 1: 8 advanced labs
 *            TAASTraining    — Pillar 2: 8 training services
 *            HardwareShowcase— Award-winning products (Neobot, 3D, Kit)
 *            CareerPilot     ┐
 *            AdaptiveQuiz    ├ Pillar 3: SaaS in action
 *            QuestionGenerator┘
 *            Marketplace     — The course catalogue (Code4AI lives here)
 *            RoleCards       — Five stakeholders, one login surface
 *            BenefitsForAll  — Schools · Students · Parents
 *            ImpactGallery   — Real classroom photography
 *            SocialProof     — Student testimonials + city marquee
 *            FinalCTA        — Bring the AI School Program to your campus
 *
 *          Section 13 (Footer) is rendered by the (public) layout.
 * Owner:   Pranav (homepage rebuild — Skillship catalogue refresh)
 */

import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ThePromise } from "@/components/home/ThePromise";
import { ThreePillars } from "@/components/home/ThreePillars";
import { IAASLabs } from "@/components/home/IAASLabs";
import { TAASTraining } from "@/components/home/TAASTraining";
import { HardwareShowcase } from "@/components/home/HardwareShowcase";
import { CareerPilot } from "@/components/home/CareerPilot";
import { AdaptiveQuiz } from "@/components/home/AdaptiveQuiz";
import { QuestionGenerator } from "@/components/home/QuestionGenerator";
import { CareerRoadmap } from "@/components/home/CareerRoadmap";
import { Marketplace } from "@/components/home/Marketplace";
import { RoleCards } from "@/components/home/RoleCards";
import { BenefitsForAll } from "@/components/home/BenefitsForAll";
import { ImpactGallery } from "@/components/home/ImpactGallery";
import { SocialProof } from "@/components/home/SocialProof";
import { PricingAnchor } from "@/components/home/PricingAnchor";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <ThePromise />
      <ThreePillars />
      <IAASLabs />
      <TAASTraining />
      <HardwareShowcase />
      <div id="saas-software">
        <CareerPilot />
        <AdaptiveQuiz />
        <QuestionGenerator />
        <CareerRoadmap />
      </div>
      <Marketplace />
      <RoleCards />
      <BenefitsForAll />
      <ImpactGallery />
      <SocialProof />
      <PricingAnchor />
      <FinalCTA />
    </>
  );
}
