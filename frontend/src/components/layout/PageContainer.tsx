import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-container", className)}
      {...props}
    >
      {children}
    </div>
  );
}
