/*
 * File:    frontend/src/components/home/SocialProof.tsx
 * Purpose: §11 Social Proof — reframed as Skillship's India footprint. A
 *          stylised India map on the left carries avatar "presence" pins at
 *          the cities where Skillship operates (some with a 5★ chip); the
 *          right column is an auto-scrolling stack of school/student reviews
 *          with star ratings and the store (Play / App Store) they came from.
 *
 *          The India map is the official, legally-correct India SVG supplied
 *          by the team (media/india2023High.svg), recoloured for the theme
 *          with borders left exactly as-is and served from
 *          /public/india-map.svg. Pins overlay it via percentage coordinates.
 * Owner:   Pranav (homepage rebuild — India footprint)
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, User } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

type Seed = "warm" | "cool" | "brand" | "fresh";

const SEED_GRADIENT: Record<Seed, string> = {
  warm:  "bg-warmth-gradient",
  cool:  "bg-cool-gradient",
  brand: "bg-brand-gradient",
  fresh: "bg-[linear-gradient(135deg,#4FB956_0%,#2EB6B5_100%)]",
};

/* Presence pins — left/top are % within the square map box, tuned to the
   real India outline (viewBox 1024×1024). */
interface Pin {
  city: string;
  left: number;
  top: number;
  seed: Seed;
  rating?: boolean;
}

const PINS: Pin[] = [
  { city: "Srinagar",  left: 23, top: 10, seed: "cool",  },
  { city: "Amritsar",  left: 24, top: 19, seed: "warm",  rating: true },
  { city: "Delhi",     left: 32, top: 29, seed: "brand", },
  { city: "Jaipur",    left: 27, top: 35, seed: "fresh", rating: true },
  { city: "Lucknow",   left: 44, top: 35, seed: "brand", },
  { city: "Patna",     left: 59, top: 39, seed: "fresh", },
  { city: "Guwahati",  left: 82, top: 38, seed: "cool",  },
  { city: "Bhopal",    left: 32, top: 47, seed: "warm",  },
  { city: "Ahmedabad", left: 16, top: 48, seed: "warm",  },
  { city: "Kolkata",   left: 70, top: 50, seed: "fresh", rating: true },
  { city: "Mumbai",    left: 17, top: 62, seed: "brand", },
  { city: "Bengaluru", left: 33, top: 83, seed: "fresh", },
  { city: "Chennai",   left: 42, top: 82, seed: "warm",  },
];

function MapPin({ pin, index }: { pin: Pin; index: number }) {
  return (
    <div
      className="absolute z-10"
      style={{ left: `${pin.left}%`, top: `${pin.top}%`, transform: "translate(-50%, -100%)" }}
    >
      <div
        className="relative flex items-center gap-1 rounded-full bg-white px-1 py-1 shadow-[0_8px_20px_rgba(15,20,25,0.18)] ring-1 ring-black/5 animate-float-slow"
        style={{ animationDelay: `${(index % 5) * 0.6}s`, animationDuration: `${6 + (index % 4)}s` }}
        title={`Skillship · ${pin.city}`}
      >
        <span className={`grid h-9 w-9 place-items-center rounded-full text-white ${SEED_GRADIENT[pin.seed]}`}>
          <User size={16} strokeWidth={2} />
        </span>
        {pin.rating && (
          <span className="flex items-center gap-0.5 pr-1.5 text-[12px] font-bold text-[var(--ink-primary)]">
            5 <Star size={11} className="fill-[var(--orange-500)] text-[var(--orange-500)]" />
          </span>
        )}
        {/* downward pointer */}
        <span className="absolute -bottom-[5px] left-[18px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-white shadow-[2px_2px_3px_rgba(15,20,25,0.10)]" />
      </div>
    </div>
  );
}

function IndiaMap() {
  // Aspect matches the source viewBox (849.87 × 964) so the rendered map fills
  // the box edge-to-edge and the % pin coordinates line up with the geography.
  return (
    <div className="relative mx-auto aspect-[850/964] w-full max-w-[520px]">
      {/* Legal, official India map (recoloured for the theme; borders untouched).
         eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/india-map.svg"
        alt="Map of India showing the cities where Skillship is present"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      {PINS.map((p, i) => (
        <MapPin key={p.city} pin={p} index={i} />
      ))}
    </div>
  );
}

interface Review {
  quote: string;
  /** Author's role — Principal / Director. */
  role: string;
  school: string;
  city: string;
  seed: Seed;
}

// Real principal / director testimonials from partner schools.
const REVIEWS: Review[] = [
  {
    quote:
      "Skillship Edutech has made technology learning highly interactive and engaging for our students. Through hands-on activities, collaborative projects, AI tools, and robotics challenges, students actively participate in the learning process rather than simply observing it. The curriculum has created an exciting classroom environment where curiosity, creativity, and innovation thrive every day.",
    role: "Principal", school: "Vidyakunj Group of Schools", city: "Surat", seed: "warm",
  },
  {
    quote:
      "Skillship Edutech has empowered our students to move beyond traditional learning and embrace innovation through its AI & Robotics Curriculum. The hands-on projects, real-world applications, and exposure to emerging technologies have sparked curiosity and creativity among our learners. We have witnessed greater student engagement, confidence, and enthusiasm for technology-driven learning.",
    role: "Principal", school: "Jeevanshilp Campus", city: "Kapadwanj", seed: "cool",
  },
  {
    quote:
      "The AI & Robotics Curriculum by Skillship Edutech has transformed the way our students learn and interact with technology. Through engaging projects and hands-on experiences, students have developed essential 21st-century skills such as critical thinking, creativity, collaboration, and problem-solving. We are delighted to see our learners becoming more confident, innovative, and future-ready.",
    role: "Principal", school: "Iqra School", city: "Visnagar", seed: "brand",
  },
  {
    quote:
      "Skillship Edutech has brought innovation and future-ready learning to our classrooms through its AI & Robotics Curriculum. The hands-on, project-based approach has enabled our students to learn by creating, experimenting, and solving real-world challenges. We have seen a noticeable improvement in student engagement, creativity, and confidence, making technology education both meaningful and inspiring.",
    role: "Principal", school: "Trinity School", city: "Talod", seed: "fresh",
  },
  {
    quote:
      "Skillship Edutech's AI & Robotics Curriculum has introduced a new era of experiential learning at our school. Through hands-on projects, innovation-driven activities, and exposure to emerging technologies, our students have developed stronger problem-solving, creativity, and analytical skills. The program has inspired students to explore technology with confidence and enthusiasm while preparing them for the future.",
    role: "Principal", school: "Rishikul International School", city: "Mathura", seed: "warm",
  },
  {
    quote:
      "Skillship Edutech has been a driving force in transforming our school into an AI-driven learning hub. Through the integration of AI-powered educational tools, coding platforms, robotics labs, and future-ready technology programs, our students are now learning in a more innovative, personalized, and technology-rich environment. This transformation has fostered a culture of creativity, digital excellence, and continuous innovation across the school.",
    role: "Principal", school: "Royal EduWorld School", city: "Vadodara", seed: "cool",
  },
  {
    quote:
      "As educators, we have witnessed a remarkable increase in student engagement and curiosity through Skillship Edutech's AI & Robotics Curriculum. The project-based approach encourages students to apply concepts practically, collaborate effectively, and develop critical thinking skills. The curriculum is well-structured, easy to implement, and has brought a new level of innovation and excitement to our classrooms.",
    role: "Director", school: "Sadguru School", city: "Vadodara", seed: "brand",
  },
  {
    quote:
      "Skillship Edutech has been instrumental in our journey toward becoming an AI-enabled school. From AI-powered learning tools and intelligent classroom solutions to hands-on exposure in Artificial Intelligence, Robotics, and Coding, their comprehensive approach has transformed the learning experience for both students and educators. This initiative has helped create a culture of innovation, preparing our students for the opportunities of an AI-driven future.",
    role: "Principal", school: "IDP School", city: "Ahmedabad", seed: "fresh",
  },
  {
    quote:
      "Skillship Edutech has played a key role in transforming our institution into an AI-enabled campus. Through the integration of AI-powered learning tools, robotics education, coding platforms, and future-ready technology infrastructure, our students now experience a more innovative and engaging learning environment. This transformation has strengthened digital literacy across the school and positioned our students to thrive in a technology-driven world.",
    role: "Principal", school: "Shree Ganesh Educational Campus", city: "Ahmedabad", seed: "warm",
  },
  {
    quote:
      "As a Principal, I strongly believe that students learn best when they are encouraged to explore, create, and innovate. Skillship Edutech's AI & Robotics Curriculum has provided our students with exactly that opportunity. The hands-on, future-focused approach has enhanced their creativity, confidence, and problem-solving skills while making technology learning both meaningful and enjoyable. We are pleased with the positive impact the program has had on our school community.",
    role: "Principal", school: "Bluebells School", city: "Ahmedabad", seed: "cool",
  },
  {
    quote:
      "Skillship Edutech's AI & Robotics Curriculum has provided our students with a highly engaging, project-driven learning experience. By working on real-world projects in AI, Robotics, Coding, and IoT, students have strengthened their innovation, critical thinking, and problem-solving abilities. The curriculum effectively bridges the gap between theory and practical application, preparing students for the technologies of tomorrow.",
    role: "Principal", school: "Knowledge High School", city: "Nadiad", seed: "brand",
  },
  {
    quote:
      "The AI & Robotics Curriculum by Skillship Edutech has transformed the way our students engage with technology. Through hands-on learning and practical projects, students have developed critical thinking, creativity, and problem-solving skills while exploring emerging technologies. We appreciate Skillship's dedication to making future-ready education accessible and engaging for our learners.",
    role: "Principal", school: "Knowledge High School", city: "Mahemdabad", seed: "fresh",
  },
  {
    quote:
      "Skillship Edutech's AI & Robotics Curriculum has brought a new dimension to learning at our school. The hands-on activities, innovative projects, and future-focused approach have significantly enhanced student engagement, creativity, and problem-solving skills. We are pleased with the positive impact of the program and highly appreciate Skillship's commitment to delivering quality STEM education.",
    role: "Principal", school: "Knowledge High School", city: "Dholka", seed: "warm",
  },
];

function Stars() {
  return (
    <div className="flex items-center gap-1" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} className="fill-[var(--orange-500)] text-[var(--orange-500)]" />
      ))}
    </div>
  );
}

function ReviewCard({ r, onToggle }: { r: Review; onToggle: (open: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onToggle(next);
  };
  return (
    <article className="card-lift rounded-3xl border border-[color:var(--border-subtle)] bg-[var(--card)] p-6 shadow-soft">
      <header className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-semibold text-white ${SEED_GRADIENT[r.seed]}`}>
          {r.school.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight text-[var(--ink-primary)]">{r.school}</p>
          <p className="text-[12px] text-[var(--ink-tertiary)]">{r.role} · {r.city}</p>
        </div>
      </header>

      <p className={`mt-4 text-[14.5px] leading-[1.6] text-[var(--ink-secondary)] ${expanded ? "" : "line-clamp-3"}`}>
        &ldquo;{r.quote}&rdquo;
      </p>
      <button
        type="button"
        onClick={toggle}
        className="mt-2 text-[13px] font-semibold text-[var(--teal-600)] transition-colors hover:text-[var(--orange-500)]"
      >
        {expanded ? "Read less" : "Read more"}
      </button>

      <div className="mt-4">
        <Stars />
      </div>
    </article>
  );
}

export function SocialProof() {
  const loop = [...REVIEWS, ...REVIEWS];
  // Pause the auto-scroll whenever any card is expanded so the reader can
  // actually read the full review without it sliding away.
  const [openCount, setOpenCount] = useState(0);
  const onToggle = (open: boolean) => setOpenCount((n) => Math.max(0, n + (open ? 1 : -1)));

  return (
    <section className="bg-[var(--bg-warm)]">
      <div className="mx-auto max-w-[1280px] px-6 py-28 md:py-36 lg:px-12">
        {/* Header */}
        <div className="mx-auto max-w-[760px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--teal-600)]"
          >
            Skillship across India
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-4 font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--ink-primary)]"
            style={{ fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)" }}
          >
            Trusted by schools{" "}
            <span className="bg-clip-text text-transparent">across the country.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
            className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.6] text-[var(--ink-secondary)] md:text-[17px]"
          >
            From Srinagar to Chennai — explore where Skillship is live, and hear
            what students and schools say about it.
          </motion.p>
        </div>

        {/* Map + reviews */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* India map */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="lg:col-span-7"
          >
            <IndiaMap />
          </motion.div>

          {/* Auto-scrolling reviews */}
          <div className="lg:col-span-5">
            <div className="review-viewport relative h-[460px] overflow-hidden md:h-[560px]">
              <div
                className="review-track flex flex-col gap-5"
                style={{ animationPlayState: openCount > 0 ? "paused" : undefined }}
              >
                {loop.map((r, i) => (
                  <ReviewCard key={`${r.school}-${r.city}-${i}`} r={r} onToggle={onToggle} />
                ))}
              </div>
              {/* fade edges */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-16"
                style={{ backgroundImage: "linear-gradient(to bottom, var(--bg-warm), transparent)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
                style={{ backgroundImage: "linear-gradient(to top, var(--bg-warm), transparent)" }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .review-track {
          animation: review-scroll 32s linear infinite;
        }
        .review-viewport:hover .review-track {
          animation-play-state: paused;
        }
        @keyframes review-scroll {
          from { transform: translateY(0); }
          to   { transform: translateY(calc(-50% - 0.625rem)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .review-track { animation: none; }
        }
      `}</style>
    </section>
  );
}
