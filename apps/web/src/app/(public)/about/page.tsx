import { AboutHero } from "@/components/about/AboutHero";
import { MissionVision } from "@/components/about/MissionVision";
import { WhatWeDo } from "@/components/about/WhatWeDo";
import { WhySkillship } from "@/components/about/WhySkillship";
import { Team } from "@/components/about/Team";
import { StatsBar } from "@/components/shared/StatsBar";
import { CTABanner } from "@/components/shared/CTABanner";

export const metadata = {
  title: "About Us | Skillship",
  description: "Skillship bridges the gap between traditional education and the AI-first future. Discover our mission to empower schools and students.",
  openGraph: {
    title: "About Us | Skillship",
    description: "Skillship bridges the gap between traditional education and the AI-first future.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Skillship",
    description: "Empowering schools and students with AI-first education.",
  }
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <MissionVision />
      <WhatWeDo />
      <WhySkillship />
      <StatsBar />
      <Team />
      <CTABanner />
    </>
  );
}
