"use client";

const myClasses = [
  { name: "Class 9A", subject: "Science", students: "—", nextQuiz: "—" },
  { name: "Class 10B", subject: "Maths", students: "—", nextQuiz: "—" },
  { name: "Class 8C", subject: "English", students: "—", nextQuiz: "—" },
];

const recentActivity = [
  { label: "Science Quiz — Class 9A", status: "Draft", time: "Today" },
  { label: "Maths Quiz — Class 10B", status: "Published", time: "Yesterday" },
  { label: "English Quiz — Class 8C", status: "Archived", time: "3 days ago" },
];

const statusColor: Record<string, string> = {
  Draft: "bg-amber-100 text-amber-700",
  Published: "bg-green-100 text-green-700",
  Archived: "bg-gray-100 text-gray-500",
};

export default function TeacherDashboard() {
  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Welcome back, Teacher
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Your classes and quiz activity — live data in Sprint 2.
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          + New Quiz
        </button>
      </div>

      {/* My classes — T-042 */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-[var(--foreground)]">My Classes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="pb-3 pr-6">Class</th>
                <th className="pb-3 pr-6">Subject</th>
                <th className="pb-3 pr-6">Students</th>
                <th className="pb-3">Next Quiz</th>
              </tr>
            </thead>
            <tbody>
              {myClasses.map((c) => (
                <tr key={c.name} className="border-b border-[var(--border)]/50 last:border-0">
                  <td className="py-3 pr-6 font-medium text-[var(--foreground)]">{c.name}</td>
                  <td className="py-3 pr-6 text-[var(--muted-foreground)]">{c.subject}</td>
                  <td className="py-3 pr-6 text-[var(--muted-foreground)]">{c.students}</td>
                  <td className="py-3 text-[var(--muted-foreground)]">{c.nextQuiz}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent quiz activity */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-[var(--foreground)]">Recent Quiz Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl bg-[var(--muted)]/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">{item.time}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor[item.status]}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Create Quiz", icon: "📝", desc: "Build & publish" },
          { label: "Upload Content", icon: "📁", desc: "PDF or video" },
          { label: "View Analytics", icon: "📈", desc: "Class performance" },
        ].map((a) => (
          <button
            key={a.label}
            type="button"
            className="rounded-2xl border border-[var(--border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 text-2xl">{a.icon}</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{a.label}</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">{a.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
