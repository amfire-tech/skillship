import { type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
}

export function SelectField({
  className,
  label,
  id,
  options,
  error,
  ...props
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-[15px] font-medium leading-6 text-slate-950"
      >
        {label}
      </label>
      <select
        id={id}
        className={cn(
          "h-[52px] w-full rounded-[16px] border border-slate-200 bg-white px-4 text-[15px] text-slate-950",
          "outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10",
          error && "border-danger focus:border-danger focus:ring-danger/10",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && id ? (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
