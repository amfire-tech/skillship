import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 lg:py-36">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-50/60 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm dark:bg-primary/10">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            AI-Powered School Management Platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[56px] lg:leading-[1.1]">
            AI-Powered Learning for{" "}
            <span className="text-primary">Every School</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            Skillship delivers cutting-edge AI and robotics workshops to students from
            Class 1–12 across India. Empower your school with smart quizzes, AI career
            guidance, and deep performance analytics.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={siteConfig.cta.href}>
              <Button size="lg" className="rounded-full px-8">
                {siteConfig.cta.label}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Button>
            </Link>
            <Link href="/workshops">
              <Button variant="secondary" size="lg" className="rounded-full border border-[var(--border)] bg-white px-8 text-[var(--foreground)] hover:bg-gray-50 dark:bg-dark-card dark:hover:bg-dark-card/80">
                View Workshops
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="m9 18 6-6-6-6"/></svg>
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
