import type { Metadata } from "next";
export const metadata: Metadata = { title: "Sub Admin" };
export default function SubAdminSectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
