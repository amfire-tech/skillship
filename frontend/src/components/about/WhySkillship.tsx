import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Heading } from "@/components/ui/Heading";
import { Card, CardContent } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

const differentiators = [
  {
    eyebrow: "Operational clarity",
    title: "Built for school-wide rollouts",
    description:
      "Move from a single pilot classroom to a full campus program without operational drag.",
    highlight: "Launch small, prove value, scale with confidence.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h7v7H4z" /><path d="M13 4h7v7h-7z" /><path d="M4 13h7v7H4z" /><path d="M17 14v6" /><path d="M14 17h6" />
      </svg>
    ),
  },
  {
    eyebrow: "Decision-ready insight",
    title: "AI that helps schools act, not just observe",
    description:
      "Surface the signals that matter so leaders can spot gaps and growth trends faster.",
    highlight: "Better visibility for teachers, leaders, and parents.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 6-7" />
      </svg>
    ),
  },
  {
    eyebrow: "Outcome-first learning",
    title: "Experiences students actually connect with",
    description:
      "Programs grounded in hands-on learning so students see how AI relates to real careers.",
    highlight: "More relevance, engagement, and long-term confidence.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 6.5 11H12l-1 11 6.5-12H12z" />
      </svg>
    ),
  },
];

export function WhySkillship() {
  return (
    <SectionWrapper
      background="muted"
      aria-label="Why Skillship"
      id="why-skillship"
      className="py-20 md:py-24"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
          Why choose Skillship
        </p>
        <Heading as="h2" className="mt-3 text-2xl md:text-3xl">
          A partner built for modern schools
        </Heading>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
          Thoughtful implementation, strong visibility, and future-ready learning design.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {differentiators.map((diff, index) => (
          <Reveal key={diff.title} delay={index * 100} className="h-full">
            <Card hoverable className="group relative h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.15)]">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                    {diff.icon}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary/70">
                    {diff.eyebrow}
                  </span>
                </div>

                <Heading as="h3" className="mt-5 text-lg font-semibold md:text-xl">
                  {diff.title}
                </Heading>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {diff.description}
                </p>

                <div className="mt-5 rounded-xl bg-primary/5 px-3 py-3 text-xs font-medium text-[var(--foreground)]">
                  {diff.highlight}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </SectionWrapper>
  );
}
