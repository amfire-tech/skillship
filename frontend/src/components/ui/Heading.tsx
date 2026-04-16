import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
}

const levelStyles: Record<HeadingLevel, string> = {
  h1: "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
  h2: "text-3xl md:text-4xl font-bold tracking-tight",
  h3: "text-2xl md:text-3xl font-bold",
  h4: "text-xl md:text-2xl font-semibold",
  h5: "text-lg md:text-xl font-semibold",
  h6: "text-base md:text-lg font-semibold",
};

export function Heading({
  as: Component = "h2",
  className,
  children,
  ...props
}: HeadingProps) {
  return (
    <Component
      className={cn(levelStyles[Component], "text-[var(--foreground)]", className)}
      {...props}
    >
      {children}
    </Component>
  );
}
