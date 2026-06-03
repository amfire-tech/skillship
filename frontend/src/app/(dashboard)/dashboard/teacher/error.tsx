"use client";

import { DashboardError } from "@/components/shared/DashboardError";

export default function TeacherError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardError scope="Teacher" {...props} />;
}
