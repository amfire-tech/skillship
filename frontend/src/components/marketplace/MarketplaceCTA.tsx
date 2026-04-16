import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function MarketplaceCTA() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--muted)] py-20">
      <Container className="px-6 lg:px-8">
        <div className="rounded-[32px] border border-[var(--border)] bg-white px-8 py-12 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.18)] md:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            Need a tailored plan?
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
            Request a demo for your school or district
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
            We will help you shortlist the right workshop mix, pricing model,
            and rollout plan for your classrooms.
          </p>
          <div className="mt-8">
            <Link href="/request-demo">
              <Button size="lg" className="rounded-full px-8">
                Request Demo
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
