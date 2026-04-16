// ============================================================
// Seed credentials for frontend preview / demo.
// DO NOT USE IN PRODUCTION.
// Backend team: replace this file's usage in `(auth)/login/page.tsx`
// with a real POST /auth/login call once the Django endpoint is
// available. The shape of `AuthResponse` is already defined in
// `@/types`.
// ============================================================

import type { UserRole } from "@/types";

export interface SeedCredential {
  userId: string;
  password: string;
  role: UserRole;
  name: string;
  email: string;
}

export const seedCredentials: SeedCredential[] = [
  {
    userId: "admin",
    password: "admin123",
    role: "admin",
    name: "Aryan Gupta",
    email: "aryan.gupta@skillship.in",
  },
  {
    userId: "subadmin",
    password: "subadmin123",
    role: "subadmin",
    name: "Neha Verma",
    email: "neha.verma@skillship.in",
  },
  {
    userId: "principal",
    password: "principal123",
    role: "principal",
    name: "Dr. Priya Sharma",
    email: "priya.sharma@school.edu.in",
  },
  {
    userId: "teacher",
    password: "teacher123",
    role: "teacher",
    name: "Rahul Iyer",
    email: "rahul.iyer@school.edu.in",
  },
  {
    userId: "student",
    password: "student123",
    role: "student",
    name: "Ananya Kapoor",
    email: "ananya.kapoor@student.edu.in",
  },
];

export function verifySeedCredential(
  role: UserRole,
  userId: string,
  password: string
): SeedCredential | null {
  const match = seedCredentials.find(
    (c) => c.role === role && c.userId === userId && c.password === password
  );
  return match ?? null;
}
