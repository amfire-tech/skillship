import type { Metadata } from "next";
import { BenefitItem } from "@/components/request-demo/BenefitItem";
import { FormCard } from "@/components/request-demo/FormCard";
import { SectionWrapper } from "@/components/request-demo/SectionWrapper";
import { StatsCard } from "@/components/request-demo/StatsCard";

export const metadata: Metadata = {
  title: "Request Demo",
  description:
    "Request a personalized Skillship demo for your school and explore AI-powered learning, analytics, and workshop delivery.",
};

const benefits = [
  "Free 30-day trial for your entire school",
  "AI-powered quiz generation for all subjects",
  "Dedicated SubAdmin to manage your account",
  "Real-time performance analytics dashboards",
  "AI Career Pilot for every student (Class 6–12)",
  "Workshop marketplace with 200+ courses",
  "Bulk student onboarding via CSV upload",
  "Priority support during school hours",
] as const;

const trustStats = [
  { value: "98%", label: "Satisfaction" },
  { value: "1L+", label: "Students" },
  { value: "200+", label: "Workshops" },
] as const;

export default function RequestDemoPage() {
  return (
    <main>
      <SectionWrapper>
        <div className="grid items-start gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <div className="order-2 lg:order-1">
            <div className="max-w-[520px]">
              <h1 className="text-[42px] font-bold tracking-[-0.03em] text-slate-950">
                Why Join Skillship?
              </h1>
              <p className="mt-4 max-w-[480px] text-[18px] leading-9 text-slate-600">
                Over 500 schools across India are already using Skillship to
                deliver AI-powered education. Here&apos;s what you get:
              </p>

              <ul className="mt-9 space-y-4">
                {benefits.map((benefit) => (
                  <BenefitItem key={benefit} text={benefit} />
                ))}
              </ul>

              <div className="mt-11 rounded-[28px] bg-[#2563EB] px-8 py-8 text-white shadow-[0_16px_32px_rgba(37,99,235,0.22)]">
                <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                  500+ Schools Trust Us
                </h2>
                <p className="mt-4 max-w-[420px] text-[17px] leading-8 text-white/85">
                  From CBSE schools in Delhi to ICSE schools in Chennai —
                  Skillship powers AI education across India.
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  {trustStats.map((stat) => (
                    <StatsCard key={stat.label} value={stat.value} label={stat.label} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <FormCard />
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
