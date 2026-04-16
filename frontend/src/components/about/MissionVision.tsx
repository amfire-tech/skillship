import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/ui/Reveal";

const pillars = [
  {
    kicker: "Our mission",
    title: "Make AI learning practical for every school",
    summary:
      "We help schools adopt future-ready learning in a way that feels simple, measurable, and easy to operationalize.",
    highlight: "Designed to fit real school timelines, teams, and teaching capacity.",
    points: [
      "AI and robotics as everyday learning, not one-off events.",
      "Teacher-friendly tools that improve outcomes without burnout.",
      "Visible progress for leaders, parents, and students.",
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-6-4.35-6-10a4 4 0 0 1 7-2.65A4 4 0 0 1 20 11c0 5.65-8 10-8 10Z" />
      </svg>
    ),
  },
  {
    kicker: "Our vision",
    title: "The default AI layer for K-12 education",
    summary:
      "Every classroom benefits from intelligent guidance, better visibility, and stronger student confidence.",
    highlight: "Innovation that feels embedded, not bolted on.",
    points: [
      "AI that supports curiosity, confidence, and career discovery.",
      "Faster, clearer decisions with data leaders can trust.",
      "A platform that grows from exposure to measurable mastery.",
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 4 7l8 4 8-4-8-4Z" /><path d="m4 13 8 4 8-4" /><path d="m4 19 8 4 8-4" />
      </svg>
    ),
  },
];

export function MissionVision() {
  return (
    <SectionWrapper
      background="muted"
      aria-label="Mission and Vision"
      className="py-20 md:py-24"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
          Mission &amp; Vision
        </p>
        <Heading as="h2" className="mt-3 text-2xl md:text-3xl">
          Why Skillship exists
        </Heading>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
          Helping schools move from interest in AI to repeatable, outcome-driven implementation.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {pillars.map((pillar, index) => (
          <Reveal key={pillar.title} delay={index * 120} className="h-full">
            <article className="group relative flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.15)] md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                    {pillar.kicker}
                  </p>
                  <Heading as="h3" className="mt-2 text-lg md:text-xl">
                    {pillar.title}
                  </Heading>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {pillar.icon}
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {pillar.summary}
              </p>

              <ul className="mt-5 space-y-2.5">
                {pillar.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    </span>
                    <span className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-5">
                <div className="rounded-xl bg-[var(--muted)] px-4 py-3 text-xs font-medium text-[var(--foreground)]">
                  {pillar.highlight}
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </SectionWrapper>
  );
}
