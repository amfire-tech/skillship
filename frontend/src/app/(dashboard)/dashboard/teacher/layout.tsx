import type { Metadata } from "next";
export const metadata: Metadata = { title: "Teacher" };
export default function TeacherSectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
