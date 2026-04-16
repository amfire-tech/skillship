import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "main" | "article";
}

export function Container({
  className,
  as: Component = "div",
  children,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn("mx-auto w-full max-w-container px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </Component>
  );
}
