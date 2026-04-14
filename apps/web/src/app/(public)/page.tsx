import { SystemHero } from "@/components/home/SystemHero";
import { SystemFlow } from "@/components/home/SystemFlow";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { TransformSection } from "@/components/home/TransformSection";
import { Testimonials } from "@/components/home/Testimonials";
import { CTABanner } from "@/components/shared/CTABanner";

export default function HomePage() {
  return (
    <>
      <SystemHero />
      <SystemFlow />
      <ProductShowcase />
      <TransformSection />
      <Testimonials />
      <CTABanner />
    </>
  );
}
