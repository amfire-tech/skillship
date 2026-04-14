"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/request-demo/InputField";
import { SelectField } from "@/components/request-demo/SelectField";

interface RequestDemoFormState {
  schoolName: string;
  principalName: string;
  city: string;
  studentRange: string;
  phoneNumber: string;
  emailAddress: string;
  schoolBoard: string;
}

const initialState: RequestDemoFormState = {
  schoolName: "",
  principalName: "",
  city: "",
  studentRange: "",
  phoneNumber: "",
  emailAddress: "",
  schoolBoard: "",
};

const studentOptions = [
  { label: "Select range", value: "" },
  { label: "Up to 250 students", value: "up-to-250" },
  { label: "251 to 500 students", value: "251-500" },
  { label: "501 to 1000 students", value: "501-1000" },
  { label: "1000+ students", value: "1000-plus" },
];

const boardOptions = [
  { label: "Select board (optional)", value: "" },
  { label: "CBSE", value: "cbse" },
  { label: "ICSE", value: "icse" },
  { label: "State Board", value: "state-board" },
  { label: "IB", value: "ib" },
  { label: "Cambridge", value: "cambridge" },
];

export function FormCard() {
  const [formState, setFormState] = useState<RequestDemoFormState>(initialState);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <motion.div
      id="demo-form"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_60px_-35px_rgba(5,150,105,0.3)] md:p-10"
    >
      {/* Gradient top bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Demo request
        </div>
        <h2 className="mt-3 text-[26px] font-bold tracking-[-0.02em] text-[var(--foreground)] md:text-[28px]">
          Tell us about your school
        </h2>
        <p className="mt-2 text-[15px] leading-7 text-[var(--muted-foreground)]">
          A specialist from your region will reach out within one business day
          to confirm a time that works.
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            id="schoolName"
            name="schoolName"
            label="School Name *"
            placeholder="e.g., St. Mary's Public School"
            value={formState.schoolName}
            onChange={handleChange}
            autoComplete="organization"
          />
          <InputField
            id="principalName"
            name="principalName"
            label="Principal Name *"
            placeholder="e.g., Dr. Priya Sharma"
            value={formState.principalName}
            onChange={handleChange}
            autoComplete="name"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            id="city"
            name="city"
            label="City *"
            placeholder="e.g., Bengaluru"
            value={formState.city}
            onChange={handleChange}
            autoComplete="address-level2"
          />
          <SelectField
            id="studentRange"
            name="studentRange"
            label="Number of Students *"
            value={formState.studentRange}
            onChange={handleChange}
            options={studentOptions}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            id="phoneNumber"
            name="phoneNumber"
            label="Phone Number *"
            placeholder="+91 98765 43210"
            value={formState.phoneNumber}
            onChange={handleChange}
            autoComplete="tel"
          />
          <InputField
            id="emailAddress"
            name="emailAddress"
            type="email"
            label="Email Address *"
            placeholder="principal@school.edu.in"
            value={formState.emailAddress}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>

        <SelectField
          id="schoolBoard"
          name="schoolBoard"
          label="School Board"
          value={formState.schoolBoard}
          onChange={handleChange}
          options={boardOptions}
        />

        <div className="flex items-center gap-2 rounded-xl bg-[var(--muted)]/60 px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-primary">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-xs text-[var(--muted-foreground)]">
            Your details stay confidential — we never share them with third parties.
          </p>
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            size="lg"
            className="group h-14 w-full rounded-[18px] text-[17px] font-semibold shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
          >
            Submit request
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 transition-transform group-hover:translate-x-1">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </div>

        <p className="text-center text-sm leading-6 text-[var(--muted-foreground)]">
          By submitting, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:text-primary-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:text-primary-700">
            Privacy Policy.
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
