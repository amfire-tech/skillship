import { type ReactNode } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
}

export function SectionWrapper({ children, className }: SectionWrapperProps) {
  return (
    <section className={cn("py-10 md:py-14 lg:py-16", className)}>
      <PageContainer className="px-6 lg:px-8">{children}</PageContainer>
    </section>
  );
}
