/*
 * File:    frontend/src/app/(dashboard)/dashboard/principal/academics/page.tsx
 * Purpose: Back-compat redirect — Academics renamed to Class Management.
 * Owner:   Pranav
 */

import { redirect } from "next/navigation";

export default function AcademicsRedirect() {
  redirect("/dashboard/principal/classes");
}
