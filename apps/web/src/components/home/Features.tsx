import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Heading } from "@/components/ui/Heading";
import { Card, CardContent } from "@/components/ui/Card";
import type { FeatureItem } from "@/types";

const features: FeatureItem[] = [
  {
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M12 2 6.5 11H12l-1 11 6.5-12H12z" />
        </svg>
      </div>
    ),
    title: "AI Career Guidance",
    description:
      "Personalized career roadmaps powered by AI, helping every student find their right path — from JEE to Robotics.",
  },
  {
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100/60 dark:bg-primary/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-700">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/>
        </svg>
      </div>
    ),
    title: "Smart Quizzes",
    description:
      "AI-generated MCQ quizzes with auto-grading, detailed analytics, and instant feedback for every student.",
  },
  {
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent/10">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
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
