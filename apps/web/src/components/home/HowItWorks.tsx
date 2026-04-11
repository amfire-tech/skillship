import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Heading } from "@/components/ui/Heading";
import type { StepItem } from "@/types";

const steps: StepItem[] = [
  {
    step: 1,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    ),
    title: "School Joins",
    description:
      "Your school registers on Skillship and gets access to the complete platform — workshops, tools, and analytics.",
  },
  {
    step: 2,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    title: "Teachers Create",
    description:
      "Teachers use AI tools to create quizzes, assign classes, and track student progress in real-time.",
  },
  {
    step: 3,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/><path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z"/></svg>
    ),
    title: "Students Learn",
    description:
      "Students attempt quizzes, explore AI career guidance, and earn certificates as they grow.",
  },
];

export function HowItWorks() {
  return (
    <SectionWrapper background="muted" id="how-it-works">
      <div className="mx-auto max-w-2xl text-center">
        <Heading as="h2">How Skillship Works</Heading>
        <p className="mt-4 text-base text-[var(--muted-foreground)] md:text-lg">
          Three simple steps to transform your school&apos;s learning experience
        </p>
      </div>

      <div className="relative mt-20 grid gap-12 md:grid-cols-3 md:gap-8">
        {/* Connector line (desktop) */}
        <div className="absolute left-[calc(16.66%+28px)] right-[calc(16.66%+28px)] top-7 hidden h-px bg-[var(--border)] md:block" />

        {steps.map((step) => (
          <div key={step.step} className="relative flex flex-col items-center text-center">
            {/* Large faded step number */}
            <span className="absolute -top-4 right-4 text-7xl font-bold text-primary/[0.07] md:right-2 md:text-8xl">
              {String(step.step).padStart(2, "0")}
            </span>

            {/* Step icon in rounded square */}
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary/30 bg-[var(--card)] text-primary">
              {step.icon}
            </div>

            <h3 className="mt-6 text-lg font-bold text-[var(--foreground)]">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
