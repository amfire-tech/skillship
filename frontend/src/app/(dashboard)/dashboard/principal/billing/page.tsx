/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/billing/page.tsx
 * Purpose: Principal-facing Fees & Payments page — read-only view of what the
 *          school has been charged by Skillship, what it has paid, and the
 *          outstanding balance. Data comes from the billing ledger API; the
 *          backend scopes it to the principal's own school automatically.
 * Owner:   Pranav
 */

"use client";

import BillingPanel from "@/components/billing/BillingPanel";

export default function PrincipalBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">Fees &amp; Payments</h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Your school&apos;s billing with Skillship — charges raised, payments made, and balance due.
        </p>
      </div>
      <BillingPanel />
    </div>
  );
}
