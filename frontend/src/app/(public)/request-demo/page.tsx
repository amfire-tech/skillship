/*
 * File:    frontend/src/app/(public)/request-demo/page.tsx
 * Purpose: /request-demo entry. Stays a Server Component so we keep the
 *          `metadata` export for SEO; the interactive booking flow
 *          (calendar + form + shared state) lives in <BookingFlow />.
 */

import type { Metadata } from "next";
import { BookingFlow } from "@/components/request-demo/BookingFlow";
import { WhatHappensNext } from "@/components/request-demo/WhatHappensNext";

export const metadata: Metadata = {
  title: "Book a School Visit · Skillship",
  description:
    "Book a 30-minute walkthrough of the Skillship AI School Program — labs, training, software. We'll show you exactly what the first 90 days of rollout look like for a school like yours.",
};

export default function RequestDemoPage() {
  return (
    <>
      <BookingFlow />
      <WhatHappensNext />
    </>
  );
}
