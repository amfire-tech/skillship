import type { Metadata } from "next";
export const metadata: Metadata = { title: "Admin Dashboard" };
export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
