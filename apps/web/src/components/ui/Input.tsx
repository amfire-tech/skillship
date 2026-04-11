import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm",
            "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
            "transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error && id ? `${id}-error` : undefined}
          {...props}
        />
        {error && id && (
          <p id={`${id}-error`} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
