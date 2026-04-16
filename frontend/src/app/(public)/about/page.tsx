import { AboutHero } from "@/components/about/AboutHero";
import { StorySection } from "@/components/about/StorySection";
import { SystemView } from "@/components/about/SystemView";
import { TrustSignals } from "@/components/about/TrustSignals";
import { Team } from "@/components/about/Team";
import { CTABanner } from "@/components/shared/CTABanner";

export const metadata = {
  title: "About Us | Skillship",
  description:
    "Skillship is building the intelligence layer for modern Indian schools — connecting quizzes, analytics, and AI career guidance into one live system.",
  openGraph: {
    title: "About Us | Skillship",
    description:
      "The intelligence layer for modern schools — built by educators, operators, and AI engineers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Skillship",
    description: "Building the intelligence layer for modern schools.",
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <StorySection />
      <SystemView />
      <TrustSignals />
      <Team />
      <CTABanner />
    </>
  );
}
