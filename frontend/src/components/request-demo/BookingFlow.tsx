/*
 * File:    frontend/src/components/request-demo/BookingFlow.tsx
 * Purpose: Client-side wrapper that owns the selected date + time slot
 *          for the demo-booking flow. Renders the hero (with embedded
 *          BookingCalendar) and the FormCard side-by-side / stacked, and
 *          smooth-scrolls to the form when the user clicks "Continue to
 *          form" inside the calendar.
 *
 *          We keep this in a small client wrapper rather than promoting
 *          the entire RequestDemoPage to a client component, so the page
 *          can still export `metadata` (Server-Component feature) for SEO.
 * Owner:   Pranav (Skillship demo booking flow)
 */

"use client";

import { useRef, useState } from "react";
import { FormCard } from "@/components/request-demo/FormCard";
import { RequestDemoHero } from "@/components/request-demo/RequestDemoHero";
import { PageContainer } from "@/components/layout/PageContainer";
import { DemoBenefits } from "@/components/request-demo/DemoBenefits";

export function BookingFlow() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const formAnchorRef = useRef<HTMLDivElement>(null);

  function handleContinueToForm() {
    formAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <>
      <RequestDemoHero
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        onSelectDate={setSelectedDate}
        onSelectSlot={setSelectedSlot}
        onContinue={handleContinueToForm}
      />

      <section ref={formAnchorRef} className="py-16 md:py-20">
        <PageContainer className="px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <FormCard
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onClearSelection={() => {
                setSelectedDate(null);
                setSelectedSlot(null);
              }}
            />
            <DemoBenefits />
          </div>
        </PageContainer>
      </section>
    </>
  );
}
