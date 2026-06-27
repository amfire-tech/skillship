"use client";

// File:    frontend/src/app/(dashboard)/layout.tsx
// Purpose: Unified shell for ALL authenticated roles — wraps every protected page
//          with the correct sidebar + topbar. Role-specific access checks happen
//          here so individual pages stay clean.
// Why:     Main architecture uses a single (dashboard) group rather than per-role
//          groups. The sidebar/topbar components handle role-based nav filtering.
// Owner:   Pranav

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { SchoolContextSwitcher } from "@/components/layout/SchoolContextSwitcher";
import { SubAdminSchoolSwitcher } from "@/components/layout/SubAdminSchoolSwitcher";
import { useSubAdminAccess, currentGrant } from "@/store/subAdminAccess";
import { Sidebar, type SidebarNavItem } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { getDefaultRouteForRole } from "@/lib/role-guard";
import type { UserRole } from "@/types";

function PageTransition({ pathname, children, isMobile }: { pathname: string; children: React.ReactNode; isMobile: boolean }) {
  // On phones the blocking `mode="wait"` adds a visible ~0.2s stall before every
  // navigation and the y-translate thrashes the compositor — so on mobile we drop
  // the exit-wait entirely and render an instant, transform-free fade. Desktop
  // keeps the polished slide.
  if (isMobile) {
    return (
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12 }}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="motion-reduce:transition-none motion-reduce:transform-none"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

const ROLE_PREFIX_MAP: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/dashboard/admin", role: "MAIN_ADMIN" },
  { prefix: "/dashboard/sub-admin", role: "SUB_ADMIN" },
  { prefix: "/dashboard/principal", role: "PRINCIPAL" },
  { prefix: "/dashboard/teacher", role: "TEACHER" },
  { prefix: "/dashboard/student", role: "STUDENT" },
];

function getRoleForPath(pathname: string): UserRole | null {
  const match = ROLE_PREFIX_MAP.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  return match?.role ?? null;
}

const ADMIN_SHELL_ROLES: UserRole[] = ["MAIN_ADMIN"];

// First-login students are forced here until they fill in their profile. It
// renders in a focused, sidebar-less layout so they can't wander off first.
const COMPLETE_PROFILE_PATH = "/dashboard/student/complete-profile";

// ── Role nav configs ──────────────────────────────────────────
function icon(d: string) {
  const paths: Record<string, string> = {
    dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    academics: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    quizzes: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20",
    career: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 8v4l3 3",
    reports: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    schools: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01",
    users: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    marketplace: "M3 3h2l.4 2M7 13h10l4-8H5.4M9 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
    analytics: "M18 20V10M12 20V4M6 20v-6",
    content: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v5h5",
    bookmark: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
    planner: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 16l2 2 4-4",
    billing: "M3 7h18v12H3zM3 11h18M7 15h4",
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[d] ?? paths.dashboard} />
    </svg>
  );
}

// A sub-admin's nav is built from the per-school capability grant of the school
// they're currently acting in (from /subadmin-grants/my-access/). Sections the
// super admin hasn't switched on for that school simply don't appear — there is
// no global analytics or revenue here by design. With no grant at all only the
// dashboard shows (the switcher prompts them to get access).
type SubGrant = ReturnType<typeof currentGrant>;
function buildSubAdminNav(grant: SubGrant): SidebarNavItem[] {
  const nav: SidebarNavItem[] = [
    { label: "Assigned Tasks", href: "/dashboard/sub-admin", icon: icon("dashboard") },
  ];
  if (!grant) return nav;
  if (grant.can_manage_school) {
    nav.push({ label: "School Management", href: "/dashboard/sub-admin/schools", icon: icon("schools") });
  }
  if (grant.can_onboard_students || grant.can_onboard_teachers) {
    nav.push({ label: "User Onboarding", href: "/dashboard/sub-admin/onboard", icon: icon("users") });
  }
  if (grant.can_approve_quizzes) {
    nav.push({ label: "Question Bank", href: "/dashboard/sub-admin/question-bank", icon: icon("content") });
    nav.push({ label: "Quiz Creation", href: "/dashboard/sub-admin/quizzes/new", icon: icon("quizzes") });
    nav.push({ label: "Quiz Approval", href: "/dashboard/sub-admin/quizzes", icon: icon("quizzes") });
  }
  nav.push({ label: "School Analytics", href: "/dashboard/sub-admin/analytics", icon: icon("analytics") });
  nav.push({ label: "Reports", href: "/dashboard/sub-admin/reports", icon: icon("reports") });
  return nav;
}

const PRINCIPAL_NAV: SidebarNavItem[] = [
  { label: "School Overview",       href: "/dashboard/principal",                     icon: icon("dashboard") },
  { label: "Today's Teacher",       href: "/dashboard/principal/today-teacher",       icon: icon("planner")   },
  { label: "Teachers Management",   href: "/dashboard/principal/teachers",            icon: icon("users")     },
  { label: "Student Management",    href: "/dashboard/principal/students",            icon: icon("users")     },
  { label: "Class Management",      href: "/dashboard/principal/classes",             icon: icon("academics") },
  { label: "Performance Analytics", href: "/dashboard/principal/analytics",           icon: icon("analytics") },
  { label: "Fees & Payments",       href: "/dashboard/principal/billing",             icon: icon("billing")   },
  { label: "Download Reports",      href: "/dashboard/principal/reports",             icon: icon("reports")   },
  { label: "AI Summary",            href: "/dashboard/principal/ai-summary",          icon: icon("content")   },
];

const TEACHER_NAV: SidebarNavItem[] = [
  { label: "My Classes",          href: "/dashboard/teacher",          icon: icon("academics") },
  { label: "Quiz Management",     href: "/dashboard/teacher/quizzes",  icon: icon("quizzes")   },
  { label: "Student Performance", href: "/dashboard/teacher/students", icon: icon("users")     },
  { label: "Feedback System",     href: "/dashboard/teacher/feedback", icon: icon("content")   },
  { label: "Class Analytics",     href: "/dashboard/teacher/analytics", icon: icon("analytics") },
  { label: "Exam Alerts",         href: "/dashboard/teacher/exam-alerts", icon: icon("reports")  },
  { label: "Reports",             href: "/dashboard/teacher/reports",  icon: icon("reports")   },
  { label: "AI Tools",            href: "/dashboard/teacher/ai-tools", icon: icon("career")    },
];

// Skillship (roaming) teachers get an extra "Daily Log" surface to record what
// they taught each day at each school. A normal SCHOOL teacher never sees it.
const TEACHER_DAILY_LOG_ITEM: SidebarNavItem = {
  label: "Daily Log", href: "/dashboard/teacher/daily-log", icon: icon("planner"),
};

// Skillship teachers also get a "My Profile" surface to set their photo —
// the rest of their identity (school/class/subject) is read from their
// existing schedule, so this page is just the avatar upload.
const TEACHER_PROFILE_ITEM: SidebarNavItem = {
  label: "My Profile", href: "/dashboard/teacher/profile", icon: icon("settings"),
};

function buildTeacherNav(isSkillship: boolean): SidebarNavItem[] {
  if (!isSkillship) return TEACHER_NAV;
  // Insert just after "My Classes" so the schedule + log live together up top.
  return [TEACHER_NAV[0], TEACHER_DAILY_LOG_ITEM, TEACHER_PROFILE_ITEM, ...TEACHER_NAV.slice(1)];
}

const STUDENT_NAV: SidebarNavItem[] = [
  { label: "My Learning",        href: "/dashboard/student",                  icon: icon("dashboard")   },
  { label: "Quiz Attempt",       href: "/dashboard/student/quizzes",          icon: icon("quizzes")     },
  { label: "My Results",         href: "/dashboard/student/results",          icon: icon("reports")     },
  { label: "Rankings",           href: "/dashboard/student/rankings",         icon: icon("analytics")   },
  { label: "Certificates",       href: "/dashboard/student/certificates",     icon: icon("content")     },
  { label: "Progress Analytics", href: "/dashboard/student/progress",         icon: icon("analytics")   },
  { label: "AI Career Pilot",    href: "/dashboard/student/career",           icon: icon("career")      },
  { label: "Saved Roadmaps",     href: "/dashboard/student/roadmaps",         icon: icon("bookmark")    },
  { label: "My Daily Planner",   href: "/dashboard/student/planner",          icon: icon("planner")     },
  { label: "Exam Alerts",        href: "/dashboard/student/exam-alerts",      icon: icon("reports")     },
];

// SUB_ADMIN is intentionally absent — its nav is built per-request from the
// acting school's capability grant (see buildSubAdminNav), not a static list.
const ROLE_NAV: Partial<Record<UserRole, { nav: SidebarNavItem[]; label: string }>> = {
  PRINCIPAL: { nav: PRINCIPAL_NAV, label: "Principal"  },
  TEACHER:   { nav: TEACHER_NAV,   label: "Teacher"    },
  STUDENT:   { nav: STUDENT_NAV,   label: "Student"    },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const refreshAuth = useAuthStore((s) => s.refreshAuth);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Phones get drastically reduced motion: framer-motion's reducedMotion="always"
  // skips transform/layout animation on every descendant motion component (the
  // dashboards have ~270 of them) while keeping cheap opacity fades — the single
  // biggest scroll/navigation smoothness win on real mobile hardware.
  const isMobile = useIsMobile();
  // Sub-admin capability grant for the school they're acting in (null for every
  // other role / before grants load) — gates the sidebar nav below.
  const subGrant = useSubAdminAccess(currentGrant);
  const closeSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setMobileSidebarOpen((v) => !v), []);

  useEffect(() => {
    // Wait for persist middleware to hydrate localStorage before any auth checks.
    if (!hasHydrated) return;

    // On reload: user/isAuthenticated restored from localStorage but accessToken is null.
    // Call refresh once to get a new access token via httpOnly cookie.
    if (isAuthenticated && !accessToken && !refreshAttempted) {
      setRefreshAttempted(true);
      refreshAuth().then((ok) => {
        if (!ok) router.replace("/login");
      });
      return;
    }

    // Not refreshing and no valid session → login.
    // Guard with refreshAttempted: don't redirect before we've had a chance
    // to attempt token refresh (prevents premature redirect on hard reload).
    if ((!isAuthenticated || !user) && refreshAttempted) {
      router.replace("/login");
      return;
    }

    // Wrong role for this path → redirect to own dashboard.
    if (!user) return;
    const requiredRole = getRoleForPath(pathname);
    if (requiredRole && user.role !== requiredRole && user.role !== "MAIN_ADMIN") {
      router.replace(getDefaultRouteForRole(user.role));
      return;
    }

    // First-login students must finish their one-time profile before anything
    // else. Only redirect when the flag is explicitly false (legacy accounts
    // without the field are treated as already complete).
    if (user.role === "STUDENT" && user.profile_completed === false && pathname !== COMPLETE_PROFILE_PATH) {
      router.replace(COMPLETE_PROFILE_PATH);
    }
  }, [hasHydrated, isAuthenticated, accessToken, user, pathname, refreshAttempted, refreshAuth, router]);

  // Block render until: hydrated + either has valid session or refresh was attempted.
  const stillBooting =
    !hasHydrated ||
    (isAuthenticated && !accessToken && !refreshAttempted);

  if (stillBooting || (!isAuthenticated && !refreshAttempted) || (isAuthenticated && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  // First-login profile setup renders without a sidebar/topbar — a focused,
  // distraction-free screen the student must complete before they get the shell.
  if (pathname === COMPLETE_PROFILE_PATH) {
    return (
      <MotionConfig reducedMotion={isMobile ? "always" : "never"}>
        <div className="min-h-screen bg-[var(--muted)]/30">
          <main id="main-content" className="overflow-x-clip p-4 md:p-6 lg:p-8">
            <PageTransition pathname={pathname} isMobile={isMobile}>{children}</PageTransition>
          </main>
        </div>
      </MotionConfig>
    );
  }

  if (ADMIN_SHELL_ROLES.includes(user.role)) {
    return (
      <MotionConfig reducedMotion={isMobile ? "always" : "never"}>
        <div className="dashboard-shell flex min-h-screen bg-[var(--muted)]/30">
          {/* Mobile overlay */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeSidebar} aria-hidden="true" />
          )}
          {/* Sidebar — slides in on mobile, always visible on md+ */}
          <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:relative md:translate-x-0 md:z-auto ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <AdminSidebar onClose={closeSidebar} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminTopbar onMenuClick={toggleSidebar} />
            <main id="main-content" className="min-w-0 flex-1 overflow-x-clip p-4 md:p-6 lg:p-8">
              <PageTransition pathname={pathname} isMobile={isMobile}>{children}</PageTransition>
            </main>
          </div>
          <CommandPalette />
        </div>
      </MotionConfig>
    );
  }

  const roleConfig = ROLE_NAV[user.role as UserRole];
  const isSubAdmin = user.role === "SUB_ADMIN";
  const isSkillshipTeacher = user.role === "TEACHER" && user.teacher_type === "SKILLSHIP";
  if (roleConfig || isSubAdmin) {
    const navItems = isSubAdmin
      ? buildSubAdminNav(subGrant)
      : user.role === "TEACHER"
      ? buildTeacherNav(isSkillshipTeacher)
      : roleConfig!.nav;
    const roleLabel = isSubAdmin ? "Sub Admin" : roleConfig!.label;
    return (
      <MotionConfig reducedMotion={isMobile ? "always" : "never"}>
        <div className="dashboard-shell flex min-h-screen bg-[var(--muted)]/30">
          {/* Mobile overlay */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeSidebar} aria-hidden="true" />
          )}
          {/* Sidebar — slides in on mobile, always visible on md+ */}
          <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:relative md:translate-x-0 md:z-auto ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <Sidebar navItems={navItems} roleLabel={roleLabel} onClose={closeSidebar} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <Header onMenuClick={toggleSidebar} />
            <main id="main-content" className="min-w-0 flex-1 overflow-x-clip p-4 md:p-6 lg:p-8">
              {/* Skillship-teacher school switcher (self-hides for normal teachers) */}
              {user.role === "TEACHER" && (
                <div className="mb-4">
                  <SchoolContextSwitcher />
                </div>
              )}
              {/* Sub-admin territory switcher — sets the X-School-Context for all calls */}
              {isSubAdmin && (
                <div className="mb-4">
                  <SubAdminSchoolSwitcher />
                </div>
              )}
              <PageTransition pathname={pathname} isMobile={isMobile}>{children}</PageTransition>
            </main>
          </div>
          <CommandPalette />
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion={isMobile ? "always" : "never"}>
      <div className="min-h-screen bg-[var(--background)]">
        <main id="main-content" className="overflow-x-clip p-4 md:p-6 lg:p-8">
          <PageTransition pathname={pathname} isMobile={isMobile}>{children}</PageTransition>
        </main>
        <CommandPalette />
      </div>
    </MotionConfig>
  );
}
