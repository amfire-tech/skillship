"use client";

import { DashboardError } from "@/components/shared/DashboardError";

export default function StudentError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardError scope="Student" {...props} />;
}
