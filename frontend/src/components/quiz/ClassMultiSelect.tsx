/*
 * File:    frontend/src/components/quiz/ClassMultiSelect.tsx
 * Purpose: Multi-select for the classes a quiz targets (Class 1–12). The value
 *          is the comma-joined label the backend stores on Quiz.grade, e.g.
 *          "Class 6, Class 7" — students in any listed grade see the quiz.
 * Owner:   Pranav
 */

"use client";

// Class labels are a domain enum (CBSE/ICSE/State) — fixed by Indian school taxonomy.
export const CLASS_LABELS = Array.from({ length: 12 }).map((_, i) => `Class ${i + 1}`);

/** "Class 7, Class 6" → [6, 7] */
function toNumbers(value: string): number[] {
  return Array.from(new Set((value.match(/\d+/g) ?? []).map(Number)))
    .filter((n) => n >= 1 && n <= 12)
    .sort((a, b) => a - b);
}

function toLabel(nums: number[]): string {
  return nums.map((n) => `Class ${n}`).join(", ");
}

/** First class in a multi-class label — for inputs that take a single class. */
export function firstClass(value: string): string {
  const [n] = toNumbers(value);
  return n ? `Class ${n}` : "";
}

export default function ClassMultiSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = toNumbers(value);

  function toggle(n: number) {
    onChange(toLabel(selected.includes(n) ? selected.filter((s) => s !== n) : [...selected, n].sort((a, b) => a - b)));
  }

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {CLASS_LABELS.map((label, i) => {
          const n = i + 1;
          const on = selected.includes(n);
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(n)}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                on
                  ? "border-primary bg-primary text-white"
                  : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-primary dark:bg-[var(--background)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
        <span>
          {selected.length === 0
            ? "Select one or more classes"
            : `${selected.length} class${selected.length > 1 ? "es" : ""} selected`}
        </span>
        <span className="flex gap-3">
          <button type="button" onClick={() => onChange(toLabel(CLASS_LABELS.map((_, i) => i + 1)))} className="font-semibold hover:text-primary">
            Select all
          </button>
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange("")} className="font-semibold hover:text-primary">
              Clear
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
