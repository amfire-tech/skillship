"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  schoolName: string;
  role: string;
  message: string;
}

const initialValues: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  schoolName: "",
  role: "",
  message: "",
};

const roleOptions = [
  { label: "Select role", value: "" },
  { label: "Principal", value: "principal" },
  { label: "Academic Head / Coordinator", value: "academic-head" },
  { label: "Teacher", value: "teacher" },
  { label: "School Owner / Trustee", value: "owner" },
  { label: "Other", value: "other" },
];

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(initialValues);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <motion.div
      id="contact-form"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_60px_-35px_rgba(5,150,105,0.25)] md:p-8"
    >
      {/* Decorative top bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Contact form
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)] md:text-[28px]">
          Tell us about your school
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Share a few details and our team will come back with the right next step.
          Average response within one business day.
        </p>
      </div>

      <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            id="name"
            name="name"
            label="Your name *"
            placeholder="Dr. Priya Sharma"
            value={values.name}
            onChange={handleChange}
            autoComplete="name"
          />
          <Input
            id="email"
            name="email"
            type="email"
            label="Email *"
            placeholder="you@school.edu.in"
            value={values.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            id="phone"
            name="phone"
            type="tel"
            label="Phone *"
            placeholder="+91 98765 43210"
            value={values.phone}
            onChange={handleChange}
            autoComplete="tel"
          />
          <Input
            id="schoolName"
            name="schoolName"
            label="School name *"
            placeholder="Greenfield Public School"
            value={values.schoolName}
            onChange={handleChange}
            autoComplete="organization"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="role" className="block text-sm font-medium text-[var(--foreground)]">
            Your role
          </label>
          <select
            id="role"
            name="role"
            value={values.role}
            onChange={handleChange}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="message" className="block text-sm font-medium text-[var(--foreground)]">
            How can we help? *
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={values.message}
            onChange={handleChange}
            placeholder="Tell us what you are exploring — AI programs, workshops, analytics, or a specific challenge at your school."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col-reverse items-start gap-4 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-primary">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Your details stay confidential — we never share them.
          </p>
          <Button type="submit" size="lg" className="rounded-full px-7 shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5">
            Send message
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
