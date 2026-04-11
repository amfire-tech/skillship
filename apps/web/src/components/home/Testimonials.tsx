import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Heading } from "@/components/ui/Heading";
import { Card, CardContent } from "@/components/ui/Card";
import type { TestimonialItem } from "@/types";

const testimonials: TestimonialItem[] = [
  {
    quote:
      "Skillship has completely transformed how our students engage with technology. The AI career pilot has helped over 200 students identify their ideal career paths. Our quiz completion rate went from 40% to 92% in just 3 months.",
    name: "Dr. Priya Sharma",
    role: "Principal",
    school: "Delhi Public School",
    city: "Bangalore",
  },
  {
    quote:
      "As a school in Tier-2 city, we struggled to provide quality AI education. Skillship made it possible with their workshop content and smart quizzes. The analytics dashboard gives me clear visibility into every student's progress.",
    name: "Mr. Ramesh Kulkarni",
    role: "Principal",
    school: "Vidyanagar High School",
    city: "Pune",
  },
];

const avatarColors = ["bg-primary", "bg-red-500"];

function StarRating() {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="#F59E0B"
          stroke="none"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <SectionWrapper id="testimonials">
      <div className="mx-auto max-w-2xl text-center">
        <Heading as="h2">What Schools Say</Heading>
        <p className="mt-4 text-base text-[var(--muted-foreground)] md:text-lg">
          Trusted by leading schools across India
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2">
        {testimonials.map((t, i) => (
          <Card key={t.name}>
            <CardContent className="p-8">
              <StarRating />

              <blockquote className="mt-6 text-sm leading-relaxed text-[var(--muted-foreground)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColors[i]}`}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {t.name}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t.role} · {t.school}, {t.city}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}
