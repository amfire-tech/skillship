"use client";

import { DashboardError } from "@/components/shared/DashboardError";

export default function PrincipalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardError scope="Principal" {...props} />;
}
