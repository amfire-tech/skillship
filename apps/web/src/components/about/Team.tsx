import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Heading } from "@/components/ui/Heading";
import { Card, CardContent } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";

const linkedInHref =
  siteConfig.footer.socials.find((item) => item.label === "LinkedIn")?.href ?? "#";

const teamMembers = [
  {
    name: "Education leadership",
    role: "Curriculum and school transformation",
    description:
      "Shapes programs around how schools actually operate so implementation feels structured, measurable, and easy to champion internally.",
    specialties: ["Pedagogy systems", "Teacher enablement"],
    initials: "EL",
    accent: "from-primary/20 via-primary/10 to-white",
  },
  {
    name: "AI product leadership",
    role: "Platform, automation, and analytics",
    description:
      "Turns complex AI workflows into calm product experiences that schools can adopt quickly without adding unnecessary operational friction.",
    specialties: ["AI tooling", "Insight design"],
    initials: "AP",
    accent: "from-accent/20 via-accent/10 to-white",
  },
  {
    name: "Implementation leadership",
    role: "Partnerships and student outcomes",
    description:
      "Works closely with institutions to translate vision into onboarding, rollout, and long-term program success across campuses.",
    specialties: ["School partnerships", "Program delivery"],
    initials: "IL",
    accent: "from-warning/20 via-warning/10 to-white",
  },
];

export function Team() {
  return (
    <SectionWrapper
      background="default"
      aria-label="Our Team"
      className="relative overflow-hidden py-24 md:py-28"
    >
      <div className="pointer-events-none absolute left-0 top-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl animate-float-delay" />

      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
          Our team
        </p>
        <Heading as="h2" className="mt-4">
          Built by educators, operators, and engineers
        </Heading>
        <p className="mt-4 text-lg text-[var(--muted-foreground)]">
          The Skillship team blends curriculum thinking, AI product design, and
          on-ground implementation so schools feel supported before and after launch.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member, index) => (
          <Reveal key={member.name} delay={index * 120} className="h-full">
            <Card className="group relative h-full overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] transition-all duration-300 hover:-translate-y-2 hover:border-primary/35 hover:shadow-[0_24px_60px_-30px_rgba(37,99,235,0.22)]">
              <CardContent className="flex h-full flex-col p-8 md:p-9">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${member.accent} text-lg font-semibold text-[var(--foreground)] shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105`}
                >
                  {member.initials}
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/70">
                    Founding team
                  </p>
                  <Heading as="h3" className="mt-3 text-2xl">
                    {member.name}
                  </Heading>
                  <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)]">
                    {member.role}
                  </p>
                </div>

                <p className="mt-5 text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                  {member.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {member.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
                      LinkedIn
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Profile placeholder
                    </p>
                  </div>

                  <a
                    href={linkedInHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${member.name} LinkedIn placeholder`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--foreground)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:text-primary"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </a>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </SectionWrapper>
  );
}
