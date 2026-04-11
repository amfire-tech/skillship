import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";

interface MarketplaceHeroProps {
  totalCount: number;
}

export function MarketplaceHero({ totalCount }: MarketplaceHeroProps) {
  return (
    <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <Container className="px-6 py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <Badge variant="info" className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Curated for Indian schools
          </Badge>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Workshop Marketplace
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Browse ready-to-book AI, robotics, coding, electronics, and IoT
            workshops designed for clear classroom delivery, strong engagement,
            and measurable school outcomes.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2">
              {totalCount} live workshop programs
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2">
              Class 3 to 12 coverage
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2">
              School-ready pricing
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
