/*
 * File:    frontend/src/app/(auth)/layout.tsx
 * Purpose: Layout for the (auth) route group — login + forgot-password.
 *          Pass-through; each page owns its own viewport. Theme follows
 *          the user's preference (default dark).
 * Owner:   Pranav
 */

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
