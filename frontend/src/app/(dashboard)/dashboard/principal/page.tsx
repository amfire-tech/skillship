"use client";

const stats = [
  { label: "Total Students", value: "—", sub: "across all classes", icon: "👥" },
  { label: "Quiz Completion", value: "—%", sub: "this week", icon: "✅" },
  { label: "Active Alerts", value: "—", sub: "at-risk students", icon: "⚠️" },
  { label: "Avg. Score", value: "—%", sub: "school-wide", icon: "📊" },
];

export default function PrincipalDashboard() {
  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Welcome back, Principal
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          School overview — live data connects once Sprint 2 backend lands.
        </p>
      </div>

      {/* Stat cards — T-041 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="mb-3 text-2xl">{s.icon}</div>
            <div className="text-2xl font-bold text-[var(--foreground)]">{s.value}</div>
            <div className="mt-0.5 text-[13px] font-medium text-[var(--foreground)]">{s.label}</div>
            <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent quiz activity */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-[var(--foreground)]">Recent Quiz Activity</h2>
          <div className="space-y-3">
            {["Class 9A — Science Quiz", "Class 10B — Maths Quiz", "Class 8C — English Quiz"].map((q) => (
              <div key={q} className="flex items-center justify-between rounded-xl bg-[var(--muted)]/40 px-4 py-3 text-sm">
                <span className="font-medium text-[var(--foreground)]">{q}</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">Pending data</span>
              </div>
            ))}
          </div>
        </div>

        {/* At-risk alerts — wired to risk_agent in Sprint 7 */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-[var(--foreground)]">At-Risk Alerts</h2>
          <div className="flex flex-col items-center justify-center py-8 text-center text-[var(--muted-foreground)]">
            <span className="text-3xl">🛡️</span>
            <p className="mt-2 text-sm">No alerts — AI risk scan activates Sprint 7.</p>
          </div>
        </div>
      </div>

      {/* Enrollment summary */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-[var(--foreground)]">Enrollment Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="pb-3 pr-4">Class</th>
                <th className="pb-3 pr-4">Teacher</th>
                <th className="pb-3 pr-4">Students</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {["Class 8A", "Class 9B", "Class 10C"].map((cls) => (
                <tr key={cls} className="border-b border-[var(--border)]/50 last:border-0">
                  <td className="py-3 pr-4 font-medium text-[var(--foreground)]">{cls}</td>
                  <td className="py-3 pr-4 text-[var(--muted-foreground)]">—</td>
                  <td className="py-3 pr-4 text-[var(--muted-foreground)]">—</td>
                  <td className="py-3">
                    <span className="rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-[11px] text-[var(--muted-foreground)]">Awaiting API</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
