import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(({ className, label, error, ...props }, ref) => {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium text-slate-body">{label}</span>
      )}
      <input
        ref={ref}
        className={cn(
          "h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-admin-indigo focus:ring-2 focus:ring-indigo-100",
          error && "border-red focus:ring-red-100",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red">{error}</span>}
    </label>
  );
});
Input.displayName = "Input";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldProps
>(({ className, label, error, children, ...props }, ref) => {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium text-slate-body">{label}</span>
      )}
      <select
        ref={ref}
        className={cn(
          "h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-admin-indigo focus:ring-2 focus:ring-indigo-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red">{error}</span>}
    </label>
  );
});
Select.displayName = "Select";
