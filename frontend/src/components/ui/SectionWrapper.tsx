import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./Container";

interface SectionWrapperProps extends HTMLAttributes<HTMLElement> {
  background?: "default" | "muted" | "primary";
  children: ReactNode;
}

const bgStyles = {
  default: "",
  muted: "bg-[var(--muted)]",
  primary: "bg-primary text-white",
};

export function SectionWrapper({
  className,
  background = "default",
  children,
  ...props
}: SectionWrapperProps) {
  return (
    <section
      className={cn("py-20 md:py-24", bgStyles[background], className)}
      {...props}
    >
      <Container>{children}</Container>
    </section>
  );
}
