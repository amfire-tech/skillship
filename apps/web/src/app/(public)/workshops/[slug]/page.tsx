import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { CTABanner } from "@/components/shared/CTABanner";
import { getWorkshopBySlug, getWorkshopSlugs } from "@/services/workshops";
import type { WorkshopCategory } from "@/types";

const categoryVariants: Record<WorkshopCategory, "info" | "purple" | "cyan"> = {
  ai: "info",
  robotics: "purple",
  coding: "cyan",
};

const categoryLabels: Record<WorkshopCategory, string> = {
  ai: "AI",
  robotics: "Robotics",
  coding: "Coding",
};

interface WorkshopDetailPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return getWorkshopSlugs();
}

export function generateMetadata({
  params,
}: WorkshopDetailPageProps): Metadata {
  const workshop = getWorkshopBySlug(params.slug);

  if (!workshop) {
    return {
      title: "Workshop not found",
    };
  }

  return {
    title: `${workshop.title} Workshop`,
    description: workshop.overview,
  };
}

export default function WorkshopDetailPage({
  params,
}: WorkshopDetailPageProps) {
  const workshop = getWorkshopBySlug(params.slug);

  if (!workshop) {
    notFound();
  }

  return (
    <>
      <SectionWrapper
        background="default"
        className="relative overflow-hidden py-20 md:py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-45" />
        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Badge variant={categoryVariants[workshop.category]}>
              {categoryLabels[workshop.category]}
            </Badge>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl lg:text-[56px] lg:leading-[1.08]">
              {workshop.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] md:text-lg">
              {workshop.overview}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
                {workshop.duration}
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
                {workshop.classRange}
              </div>
            </div>

            <p className="mt-8 text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
              {workshop.description}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/request-demo">
                <Button size="lg" className="rounded-full px-8">
                  Request Demo
                </Button>
              </Link>
              <Link href="/workshops">
                <Button variant="secondary" size="lg" className="rounded-full px-8">
                  Back to Workshops
                </Button>
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--muted)] shadow-card">
            <Image
              src={workshop.image}
              alt={workshop.imageAlt}
              width={900}
              height={640}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper background="muted" className="py-16 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-8 shadow-card">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
              Workshop outcomes
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              What students take away
            </h2>

            <ul className="mt-8 space-y-4">
              {workshop.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </span>
                  <span className="text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
                    {outcome}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-8 shadow-card">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
              Delivery fit
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Built for smooth school execution
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[var(--muted)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Format
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  Instructor-led, classroom friendly
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--muted)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Coverage
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  Mapped to school schedules and age bands
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--muted)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Outcome
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  Clear student engagement and measurable learning
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--muted)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Next step
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  Pair with Skillship analytics and guided rollout
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      <CTABanner />
    </>
  );
}
