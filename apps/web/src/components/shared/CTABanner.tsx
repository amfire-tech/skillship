import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function CTABanner() {
  return (
    <section className="relative overflow-hidden bg-[var(--background)] py-20 md:py-24">

      <div className="relative mx-auto max-w-container px-6 lg:px-8">
        <div className="relative rounded-[32px] border border-white/10 bg-white/5 px-6 py-12 text-center shadow-[0_35px_90px_-45px_rgba(15,23,42,0.75)] backdrop-blur md:px-12 md:py-14">
          <div className="absolute inset-0 rounded-[32px] bg-[linear-gradient(135deg,#064E3B_0%,#059669_55%,#064E3B_100%)]" />
          <div className="absolute inset-0 rounded-[32px] bg-grid-pattern opacity-15" />
          <div className="absolute left-[-5rem] top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-float-slow" />
          <div className="absolute right-[-4rem] bottom-0 h-56 w-56 rounded-full bg-accent/20 blur-3xl animate-float-delay" />

          <div className="relative">
          <Reveal className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80">
              <span className="h-2 w-2 rounded-full bg-accent" />
              500+ schools already trust Skillship
            </div>
          </Reveal>

          <Reveal delay={100} className="mx-auto mt-6 max-w-3xl">
            <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              Ready to transform how your school adopts AI?
            </h2>
          </Reveal>

          <Reveal delay={180} className="mx-auto mt-4 max-w-2xl">
            <p className="text-base leading-relaxed text-white/75 md:text-lg">
              Bring together hands-on learning, teacher-friendly workflows, and
              measurable student outcomes in one premium platform.
            </p>
          </Reveal>

          <Reveal delay={260} className="mt-8">
            <Link href="/request-demo">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full border-0 bg-white px-8 text-primary shadow-[0_20px_40px_-20px_rgba(255,255,255,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/95"
              >
                Get Started Today
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-2"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </Reveal>

          <Reveal delay={340} className="mx-auto mt-6 max-w-2xl">
            <p className="text-sm font-medium text-white/70">
              Onboarding slots for the next school cohort are limited. Join the
              institutions already building stronger AI programs with Skillship.
            </p>
          </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
