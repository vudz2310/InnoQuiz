import type { ReactNode } from "react";

export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  helperText,
  required = false,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-[#0F172A]">
          {label}
          {required && <span className="text-[#EF4444] ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-[#EF4444] font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-[#64748B] font-normal">{helperText}</p>}
    </div>
  );
}
