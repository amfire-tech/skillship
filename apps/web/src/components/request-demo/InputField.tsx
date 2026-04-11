import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, label, id, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="block text-[15px] font-medium leading-6 text-slate-950"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-[52px] w-full rounded-[16px] border border-slate-200 bg-white px-4 text-[15px] text-slate-950 placeholder:text-slate-400",
            "outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10",
            error && "border-danger focus:border-danger focus:ring-danger/10",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error && id ? `${id}-error` : undefined}
          {...props}
        />
        {error && id ? (
          <p id={`${id}-error`} className="text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export { InputField };
