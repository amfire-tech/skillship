import type { StatItem } from "@/types";

const stats: StatItem[] = [
  { value: "500+", label: "Schools" },
  { value: "1,00,000+", label: "Students" },
  { value: "200+", label: "Workshops" },
  { value: "98%", label: "Satisfaction Rate" },
];

export function StatsBar() {
  return (
    <section className="bg-primary">
      <div className="mx-auto grid max-w-container grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4 md:gap-0 md:divide-x md:divide-white/20 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="px-6 text-center">
            <p className="text-3xl font-bold text-white md:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-white/70">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
