import { Hero } from "@/components/home/Hero";
import { StatsBar } from "@/components/shared/StatsBar";
import { Features } from "@/components/home/Features";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { CTABanner } from "@/components/shared/CTABanner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTABanner />
    </>
  );
}
