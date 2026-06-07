/*
 * File:    frontend/src/components/request-demo/BookingCalendar.tsx
 * Purpose: Real interactive booking calendar — replaces the static motion.div
 *          mockup that previously sat inside RequestDemoHero. Lets a prospect
 *          pick a date from the next 7 days and a 30-minute slot from a fixed
 *          set (10:30 / 11:30 / 12:30 / 3:00 / 4:00 PM, Asia/Kolkata).
 *
 *          State is owned by the parent (<BookingFlow />) so the same
 *          selection is visible to the form below this card.
 *
 *          The slots and slot values intentionally match the
 *          DemoRequest.TimeSlot choices in backend/apps/leads/models.py so
 *          the POST body validates server-side without translation.
 * Owner:   Pranav (Skillship demo booking flow)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, CalendarDays } from "lucide-react";

export interface BookingCalendarProps {
  /** Selected ISO date (YYYY-MM-DD) or null if nothing picked yet. */
  selectedDate: string | null;
  /** Selected slot value matching backend TimeSlot choices, or null. */
  selectedSlot: string | null;
  onSelectDate: (iso: string) => void;
  onSelectSlot: (value: string) => void;
  /** Called when the user is ready to move to the form below. */
  onContinue: () => void;
}

// Mirrors backend/apps/leads/models.py:DemoRequest.TimeSlot.choices exactly.
const TIME_SLOTS: { value: string; label: string }[] = [
  { value: "10:30", label: "10:30 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "12:30", label: "12:30 PM" },
  { value: "15:00", label: "3:00 PM"  },
  { value: "16:00", label: "4:00 PM"  },
];

interface DateOption {
  iso: string;            // YYYY-MM-DD (local Asia/Kolkata)
  weekday: string;        // "MON"
  dayNum: string;         // "14"
  month: string;          // "Nov"
  isToday: boolean;
}

/** Format a Date as a local YYYY-MM-DD (not UTC). */
function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Build the next `count` days starting tomorrow. */
function buildNextDays(count: number): DateOption[] {
  const wd = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
  const mo = new Intl.DateTimeFormat("en-IN", { month: "short" });

  const todayISO = toLocalISO(new Date());
  const out: DateOption[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      iso: toLocalISO(d),
      weekday: wd.format(d).toUpperCase(),
      dayNum: String(d.getDate()).padStart(2, "0"),
      month: mo.format(d),
      isToday: toLocalISO(d) === todayISO,
    });
  }
  return out;
}

/** Skeleton row while the client mounts (avoids SSR hydration mismatch
 *  since the dates depend on `new Date()`). */
function SkeletonRow() {
  return (
    <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="h-[78px] rounded-xl border border-[var(--border)] bg-[var(--muted)]/40"
        />
      ))}
    </div>
  );
}

export function BookingCalendar({
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  onContinue,
}: BookingCalendarProps) {
  // Defer date construction to after mount — both because `new Date()` is
  // non-deterministic across SSR/CSR and because the user's timezone is
  // only definitive on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dates = useMemo<DateOption[]>(
    () => (mounted ? buildNextDays(7) : []),
    [mounted]
  );

  const canContinue = !!(selectedDate && selectedSlot);
  const slotsEnabled = !!selectedDate;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[0_24px_60px_-30px_rgba(5,150,105,0.35)] md:p-6">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          skillship.in/demo
        </p>
      </div>

      {/* Step 1 — date picker */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Step 1 · Pick a date
            </p>
            <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
              Next 7 days · Asia/Kolkata
            </p>
          </div>
          <CalendarDays size={18} className="text-[var(--muted-foreground)]" />
        </div>

        {mounted ? (
          <div className="mt-4 grid grid-cols-4 gap-2 md:grid-cols-7">
            {dates.map((d, i) => {
              const active = selectedDate === d.iso;
              return (
                <motion.button
                  key={d.iso}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  onClick={() => onSelectDate(d.iso)}
                  aria-pressed={active}
                  aria-label={`Select ${d.weekday} ${d.dayNum} ${d.month}`}
                  className={`group relative rounded-xl border p-2.5 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    active
                      ? "border-primary/50 bg-gradient-to-br from-primary/12 to-accent/10 shadow-[0_8px_22px_-12px_rgba(5,150,105,0.45)]"
                      : "border-[var(--border)] bg-white hover:-translate-y-0.5 hover:border-primary/30"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    {d.weekday}
                  </p>
                  <p
                    className={`mt-0.5 text-lg font-bold leading-none ${
                      active ? "text-primary" : "text-[var(--foreground)]"
                    }`}
                  >
                    {d.dayNum}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                    {d.month}
                  </p>
                  {active && (
                    <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-white shadow-sm">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4">
            <SkeletonRow />
          </div>
        )}
      </div>

      {/* Step 2 — time slot picker */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Step 2 · Pick a time
            </p>
            <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
              30-minute video or voice call
            </p>
          </div>
          <Clock size={18} className="text-[var(--muted-foreground)]" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TIME_SLOTS.map((slot) => {
            const active = selectedSlot === slot.value;
            return (
              <button
                key={slot.value}
                type="button"
                onClick={() => slotsEnabled && onSelectSlot(slot.value)}
                disabled={!slotsEnabled}
                aria-pressed={active}
                className={`flex items-center justify-between rounded-xl border p-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  !slotsEnabled
                    ? "cursor-not-allowed border-[var(--border)] bg-[var(--muted)]/30 opacity-60"
                    : active
                      ? "border-primary/50 bg-primary/5 shadow-[0_8px_22px_-12px_rgba(5,150,105,0.4)]"
                      : "border-[var(--border)] bg-white hover:-translate-y-0.5 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      active
                        ? "bg-gradient-to-br from-primary to-accent text-white"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    <Clock size={15} strokeWidth={2} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {slot.label}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      30 min · Video or voice call
                    </p>
                  </div>
                </div>
                {active && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!slotsEnabled && (
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            Pick a date first to unlock time slots.
          </p>
        )}
      </div>

      {/* Continue CTA — enabled only when both selections made */}
      <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Confirmation within 1 business hour · Free
        </div>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            canContinue
              ? "bg-gradient-to-r from-primary to-accent text-white shadow-[0_12px_28px_-14px_rgba(5,150,105,0.45)] hover:-translate-y-0.5"
              : "cursor-not-allowed bg-[var(--muted)] text-[var(--muted-foreground)]"
          }`}
        >
          Continue to form
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
