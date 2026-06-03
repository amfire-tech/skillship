/*
 * File:    frontend/src/app/(public)/page.tsx
 * Purpose: Public marketing homepage. Rebuilt to tell the AI School Program
 *          story from the Skillship catalogue:
 *
 *            Hero            — Build an AI School (the category claim) +
 *                              real impact numbers folded into the footer bar
 *            ThePromise      — "We rebuilt the foundation." (tension)
 *            ThreePillars    — IAAS · TAAS · SAAS (the spine)
 *            IAASLabs        — Pillar 1: 8 advanced labs
 *            TAASTraining    — Pillar 2: 8 training services
 *            CareerPilot     ┐
 *            AdaptiveQuiz    ├ Pillar 3: SaaS in action
 *            QuestionGenerator┘
 *            HardwareShowcase— Award-winning products (after the 3 pillars)
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
import { SchoolLogos } from "@/components/home/SchoolLogos";
import { ThePromise } from "@/components/home/ThePromise";
import { ThreePillars } from "@/components/home/ThreePillars";
import { IAASLabs } from "@/components/home/IAASLabs";
import { TAASTraining } from "@/components/home/TAASTraining";
import { HardwareShowcase } from "@/components/home/HardwareShowcase";
import { CareerPilot } from "@/components/home/CareerPilot";
import { AdaptiveQuiz } from "@/components/home/AdaptiveQuiz";
import { QuestionGenerator } from "@/components/home/QuestionGenerator";
import { CareerRoadmap } from "@/components/home/CareerRoadmap";
import { SkillsShowcase } from "@/components/home/SkillsShowcase";
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
      <SchoolLogos />
      <ThePromise />
      <ThreePillars />
      {/* The three pillars run consecutively so the reader walks 1 → 2 → 3
          without losing the thread; the giant pillar number on each marks
          where they are. The award-winning hardware showcase follows AFTER
          all three pillars. */}
      <IAASLabs />
      <TAASTraining />
      <div id="saas-software">
        <CareerPilot />
        <AdaptiveQuiz />
        <QuestionGenerator />
        <CareerRoadmap />
      </div>
      <HardwareShowcase />
      <SkillsShowcase />
      <RoleCards />
      <BenefitsForAll />
      <ImpactGallery />
      <SocialProof />
      <PricingAnchor />
      <FinalCTA />
    </>
  );
}
