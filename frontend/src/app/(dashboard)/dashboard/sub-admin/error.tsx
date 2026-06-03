"use client";

import { DashboardError } from "@/components/shared/DashboardError";

export default function SubAdminError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardError scope="Sub-Admin" {...props} />;
}
