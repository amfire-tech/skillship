import type { Metadata } from "next";
export const metadata: Metadata = { title: "Principal" };
export default function PrincipalSectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
