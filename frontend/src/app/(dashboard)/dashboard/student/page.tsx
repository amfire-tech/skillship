"use client";

const upcomingQuizzes = [
  { title: "Science Quiz — Chapter 5", class: "Class 9A", due: "Tomorrow", difficulty: "Medium" },
  { title: "Maths — Algebra Unit Test", class: "Class 9A", due: "In 3 days", difficulty: "Hard" },
  { title: "English — Grammar Quiz", class: "Class 9A", due: "Next week", difficulty: "Easy" },
];

const difficultyColor: Record<string, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

const aiTools = [
  { label: "AI Tutor", icon: "🤖", desc: "Ask anything from your notes", href: "#" },
  { label: "CareerPilot", icon: "🚀", desc: "Explore career paths", href: "#" },
  { label: "Practice Quiz", icon: "🎯", desc: "Adaptive difficulty", href: "#" },
];

export default function StudentDashboard() {
  // Progress ring values — wired to real API in Sprint 2
  const completed = 0;
  const total = 10;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const dash = circ - (pct / 100) * circ;

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Hey, Student 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Keep going — live progress loads once Sprint 2 backend is ready.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress ring — T-043 */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--muted)" strokeWidth="10" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke="var(--color-primary, #059669)"
              strokeWidth="10"
              strokeDasharray={circ}
              strokeDashoffset={dash}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">{pct}%</p>
          <p className="text-sm text-[var(--muted-foreground)]">Quizzes completed</p>
          <p className="text-[11px] text-[var(--muted-foreground)]">{completed}/{total} this term</p>
        </div>

        {/* Upcoming quizzes — T-043 */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-[var(--foreground)]">Upcoming Quizzes</h2>
          <div className="space-y-3">
            {upcomingQuizzes.map((q) => (
              <div key={q.title} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{q.title}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">{q.class} · Due {q.due}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${difficultyColor[q.difficulty]}`}>
                    {q.difficulty}
                  </span>
                  <button type="button" className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90">
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI tools entry — T-043 */}
      <div>
        <h2 className="mb-4 text-[15px] font-semibold text-[var(--foreground)]">AI Tools</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {aiTools.map((t) => (
            <a
              key={t.label}
              href={t.href}
              className="group rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 text-3xl">{t.icon}</div>
              <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-primary">{t.label}</p>
              <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{t.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
