import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "cyan" | "orange";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success: "bg-accent-50 text-accent-600 dark:bg-accent/20 dark:text-accent",
  warning: "bg-warning-50 text-amber-700 dark:bg-warning/20 dark:text-warning",
  danger: "bg-danger-50 text-danger-600 dark:bg-danger/20 dark:text-danger",
  info: "bg-primary-50 text-primary-600 dark:bg-primary/20 dark:text-primary",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
  orange: "bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
