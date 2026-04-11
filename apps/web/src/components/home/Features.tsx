import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Heading } from "@/components/ui/Heading";
import { Card, CardContent } from "@/components/ui/Card";
import type { FeatureItem } from "@/types";

const features: FeatureItem[] = [
  {
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </div>
    ),
    title: "AI Career Guidance",
    description:
      "Personalized career roadmaps powered by AI, helping every student find their right path — from JEE to Robotics.",
  },
  {
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
    ),
    title: "Smart Quizzes",
    description:
      "AI-generated MCQ quizzes with auto-grading, detailed analytics, and instant feedback for every student.",
  },
  {
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
        </svg>
      </div>
    ),
    title: "Performance Analytics",
    description:
      "Deep insights into school, class, and individual student performance with charts, trends, and AI summaries.",
  },
];

export function Features() {
  return (
    <SectionWrapper id="features">
      <div className="mx-auto max-w-2xl text-center">
        <Heading as="h2">
          Built for Modern Education
        </Heading>
        <p className="mt-4 text-base text-[var(--muted-foreground)] md:text-lg">
          Everything your school needs to deliver world-class AI education
        </p>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} hoverable>
            <CardContent className="p-8">
              {feature.icon}
              <h3 className="mt-6 text-lg font-bold text-[var(--foreground)]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
