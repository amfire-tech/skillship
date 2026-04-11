"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
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
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] md:p-10">
      <div>
        <h2 className="text-[26px] font-bold tracking-[-0.02em] text-slate-950 md:text-[28px]">
          Request a Free Demo
        </h2>
        <p className="mt-2 text-[15px] leading-7 text-slate-600">
          Fill in your school details and we&apos;ll set up a personalized demo for you.
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

        <div className="pt-1">
          <Button
            type="submit"
            size="lg"
            className="h-14 w-full rounded-[18px] text-[17px] font-semibold shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
          >
            Submit Request
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Button>
        </div>

        <p className="text-center text-sm leading-6 text-slate-500">
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
    </div>
  );
}
