"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

function validate(values: ContactFormValues): Partial<Record<keyof ContactFormValues, string>> {
  const errors: Partial<Record<keyof ContactFormValues, string>> = {};
  if (!values.name.trim()) errors.name = "Name is required.";
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.phone.trim()) errors.phone = "Phone number is required.";
  if (!values.schoolName.trim()) errors.schoolName = "School name is required.";
  if (!values.message.trim()) errors.message = "Please tell us how we can help.";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormValues, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name as keyof ContactFormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsLoading(true);
    // Simulate submission — replace with real API call
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1200);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-white p-8 shadow-[0_24px_60px_-35px_rgba(5,150,105,0.25)] text-center md:p-10"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-[0_16px_30px_-12px_rgba(5,150,105,0.5)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-[var(--foreground)]">Message received!</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          Thank you for reaching out. Our team will get back to you within one business day.
        </p>
        <button
          onClick={() => { setSubmitted(false); setValues(initialValues); }}
          className="mt-6 text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          Send another message
        </button>
      </motion.div>
    );
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
          <div className="space-y-1">
            <Input
              id="name"
              name="name"
              label="Your name *"
              placeholder="e.g. Nikhil Parihar"
              value={values.name}
              onChange={handleChange}
              autoComplete="name"
            />
            <AnimatePresence>
              {errors.name && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500">{errors.name}</motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="space-y-1">
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
            <AnimatePresence>
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500">{errors.email}</motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1">
            <Input
              id="phone"
              name="phone"
              type="tel"
              label="Phone *"
              placeholder="+91 93684 08577"
              value={values.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
            <AnimatePresence>
              {errors.phone && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500">{errors.phone}</motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="space-y-1">
            <Input
              id="schoolName"
              name="schoolName"
              label="School name *"
              placeholder="Greenfield Public School"
              value={values.schoolName}
              onChange={handleChange}
              autoComplete="organization"
            />
            <AnimatePresence>
              {errors.schoolName && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500">{errors.schoolName}</motion.p>
              )}
            </AnimatePresence>
          </div>
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

        <div className="space-y-1">
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
          <AnimatePresence>
            {errors.message && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500">{errors.message}</motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col-reverse items-start gap-4 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-primary">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Your details stay confidential — we never share them.
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="rounded-full px-7 shadow-[0_12px_30px_-12px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                Send message
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
