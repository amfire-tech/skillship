"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  schoolName: string;
  message: string;
}

const initialValues: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  schoolName: "",
  message: "",
};

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(initialValues);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <Card className="rounded-[28px] border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.18)]">
      <CardContent className="p-6 md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            Contact form
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Tell us about your school
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Share a few details and our team will get back with the right next
            step for your institution.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              id="name"
              name="name"
              label="Name"
              placeholder="Your full name"
              value={values.name}
              onChange={handleChange}
              autoComplete="name"
            />
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="you@school.edu"
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
              label="Phone"
              placeholder="+91 98765 43210"
              value={values.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
            <Input
              id="schoolName"
              name="schoolName"
              label="School Name"
              placeholder="Greenfield Public School"
              value={values.schoolName}
              onChange={handleChange}
              autoComplete="organization"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              value={values.message}
              onChange={handleChange}
              placeholder="Tell us what you are exploring for your students or school."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs leading-5 text-slate-500">
              Submission handling can be connected to your backend or API route next.
            </p>
            <Button type="submit" className="rounded-full px-7">
              Submit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
