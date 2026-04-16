import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Heading } from "@/components/ui/Heading";
import { Card, CardContent } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

const offerings = [
  {
    title: "AI and robotics workshops",
    description:
      "Hands-on sessions that help students move from curiosity to confident experimentation with real AI and robotics concepts.",
    highlight: "Designed for school timetables, student engagement, and repeatable delivery.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M10 11h4" />
        <path d="M12 7V4" />
        <path d="M12 20v-3" />
        <path d="M17 12h3" />
        <path d="M4 12h3" />
      </svg>
    ),
  },
  {
    title: "AI career guidance",
    description:
      "Personalized pathways that help students connect their interests, strengths, and emerging technology careers with far more clarity.",
    highlight: "Turns exploration into direction with better student and parent confidence.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21 12 3l9 18" />
        <path d="M12 8v6" />
        <path d="M9.5 16h5" />
      </svg>
    ),
  },
  {
    title: "Performance analytics",
    description:
      "Clear dashboards and actionable insight loops for schools, teachers, and parents to understand progress at every level.",
    highlight: "Makes AI programs easier to justify, improve, and scale with evidence.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19h16" />
        <path d="M7 15V9" />
        <path d="M12 15V5" />
        <path d="M17 15v-3" />
      </svg>
    ),
  },
];

export function WhatWeDo() {
  return (
    <SectionWrapper
      background="default"
      aria-label="What We Do"
      className="py-24 md:py-28"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
          What we do
        </p>
        <Heading as="h2" className="mt-4">
          A full stack for AI learning inside schools
        </Heading>
        <p className="mt-4 text-lg text-[var(--muted-foreground)]">
          Skillship combines delivery, guidance, and visibility so schools can
          launch AI programs that feel polished from day one.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {offerings.map((item, index) => (
          <Reveal key={item.title} delay={index * 120} className="h-full">
            <Card
              hoverable
              className="group relative h-full overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01] hover:border-primary/35 hover:shadow-[0_24px_60px_-30px_rgba(5,150,105,0.25)]"
            >
              <CardContent className="p-8 md:p-9">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-3">
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-[var(--muted-foreground)]">
                    0{index + 1}
                  </span>
                </div>

                <Heading as="h3" className="mt-8 text-2xl">
                  {item.title}
                </Heading>
                <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                  {item.description}
                </p>

                <div className="mt-6 rounded-2xl bg-[var(--muted)] px-4 py-4 text-sm font-medium text-[var(--foreground)]">
                  {item.highlight}
                </div>

                <div className="mt-6 inline-flex items-center text-sm font-semibold text-primary transition-transform duration-300 group-hover:translate-x-1">
                  Built for real school adoption
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
                </div>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </SectionWrapper>
  );
}
