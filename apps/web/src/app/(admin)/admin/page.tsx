"use client";

import { StatCard } from "@/components/admin/StatCard";
import { LineChartCard } from "@/components/admin/LineChartCard";
import { BarChartCard } from "@/components/admin/BarChartCard";
import { RecentSchoolsTable } from "@/components/admin/RecentSchoolsTable";
import { QuickActions } from "@/components/admin/QuickActions";
import { PlatformHealth } from "@/components/admin/PlatformHealth";

const onboardingData = [
  { label: "Apr", value: 12 },
  { label: "May", value: 18 },
  { label: "Jun", value: 22 },
  { label: "Jul", value: 28 },
  { label: "Aug", value: 31 },
  { label: "Sep", value: 35 },
  { label: "Oct", value: 39 },
  { label: "Nov", value: 43 },
  { label: "Dec", value: 44 },
  { label: "Jan", value: 47 },
  { label: "Feb", value: 49 },
  { label: "Mar", value: 50 },
];

const bookingsData = [
  { label: "Oct", value: 142 },
  { label: "Nov", value: 168 },
  { label: "Dec", value: 95 },
  { label: "Jan", value: 215 },
  { label: "Feb", value: 245 },
  { label: "Mar", value: 210 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Schools"
          value="50+"
          delta={{ value: "+8.2%" }}
          tint="primary"
          delay={0.05}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
            </svg>
          }
        />
        <StatCard
          label="Total Students"
          value="10,000+"
          delta={{ value: "+12.4%" }}
          tint="accent"
          delay={0.1}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Active Teachers"
          value="8,000+"
          delta={{ value: "+5.1%" }}
          tint="violet"
          delay={0.15}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          }
        />
        <StatCard
          label="Monthly Revenue"
          value="₹5,499/mo"
          delta={{ value: "+18.7%" }}
          tint="amber"
          delay={0.2}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3a5 5 0 0 0 0-10" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LineChartCard
          title="Schools Onboarded — Last 12 Months"
          subtitle="Cumulative schools registered on platform"
          data={onboardingData}
        />
        <BarChartCard
          title="Workshop Bookings — Last 6 Months"
          subtitle="Total workshop sessions booked per month"
          data={bookingsData}
        />
      </div>

      {/* Bottom grid */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <RecentSchoolsTable />
        <div className="space-y-4">
          <QuickActions />
          <PlatformHealth />
        </div>
      </div>
    </div>
  );
}
