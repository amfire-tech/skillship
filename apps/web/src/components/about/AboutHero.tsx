import Link from "next/link";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";

const trustSignals = [
  { value: "500+", label: "schools trust Skillship" },
  { value: "1,00,000+", label: "students reached" },
  { value: "98%", label: "partner satisfaction" },
];

export function AboutHero() {
  return (
    <SectionWrapper
      background="default"
      aria-label="About Skillship"
      className="relative overflow-hidden py-24 md:py-32 lg:py-36"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[-8rem] top-8 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float-slow" />
        <div className="absolute right-[-5rem] top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl animate-float-delay" />
        <div
          className="absolute inset-0 bg-grid-pattern opacity-60"
          style={{
            maskImage: "linear-gradient(to bottom, rgba(255,255,255,0.95), transparent)",
          }}
        />
      </div>

      <div className="relative">
        <Reveal className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-[0_12px_30px_-20px_rgba(37,99,235,0.5)] backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Trusted by school leaders building AI-ready classrooms
          </div>
        </Reveal>

        <Reveal delay={100} className="mx-auto mt-8 max-w-4xl text-center">
          <Heading
            as="h1"
            className="text-4xl font-bold tracking-tight md:text-5xl lg:text-[56px] lg:leading-[1.08]"
          >
            Building the operating system for
            <span className="text-primary"> modern, AI-ready schools</span>
          </Heading>
        </Reveal>

        <Reveal delay={180} className="mx-auto mt-6 max-w-2xl text-center">
          <p className="text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            Skillship helps schools turn AI learning from a one-time workshop into
            a complete, measurable student journey with teacher-friendly tools,
            hands-on experiences, and clear outcomes for every stakeholder.
          </p>
        </Reveal>

        <Reveal
          delay={260}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href={siteConfig.cta.href}>
            <Button
              size="lg"
              className="rounded-full px-8 shadow-[0_18px_40px_-18px_rgba(37,99,235,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_-18px_rgba(37,99,235,0.65)] animate-glow-pulse"
            >
              {siteConfig.cta.label}
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

          <Link href="#why-skillship">
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full border-primary/15 bg-white/80 px-8 text-[var(--foreground)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white"
            >
              Why schools switch
            </Button>
          </Link>
        </Reveal>

        <Reveal delay={340} className="mx-auto mt-12 max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-3">
            {trustSignals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-[24px] border border-[var(--border)] bg-white/[0.85] px-6 py-5 text-center shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/20"
              >
                <p className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">
                  {signal.value}
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)]">
                  {signal.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </SectionWrapper>
  );
}
