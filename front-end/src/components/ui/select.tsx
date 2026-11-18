import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | boolean;
  helperText?: string;
  options?: SelectOption[];
  variant?: "default" | "hubt";
  containerClassName?: string;
  labelClassName?: string;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error = false,
      helperText,
      options,
      variant = "default",
      containerClassName = "",
      labelClassName = "",
      className = "",
      id,
      required,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;
    const selectId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const baseStyles = `
      w-full h-11 px-4 pr-10 rounded-xl bg-white dark:bg-[#111827] border text-sm text-[#0F172A] dark:text-slate-100
      outline-none transition-all duration-200 appearance-none cursor-pointer
      ${
        isError
          ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/10 dark:focus:ring-red-950/40"
          : "border-[#E2E8F0] dark:border-slate-800 hover:border-[#CBD5E1] dark:hover:border-slate-700 focus:border-[#4F46E5] dark:focus:border-indigo-500 focus:ring-2 focus:ring-[#4F46E5]/10 dark:focus:ring-indigo-950/40"
      }
    `;

    const selectElement = (
      <div className="relative w-full flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          className={`
            ${baseStyles}
            disabled:bg-[#F1F5F9] dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed disabled:text-[#94A3B8] dark:disabled:text-slate-500
            ${className}
          `}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="bg-white dark:bg-[#111827] text-[#0F172A] dark:text-slate-100"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-4 h-4 text-[#94A3B8] dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
      </div>
    );

    if (!label && !errorMessage && !helperText) {
      return selectElement;
    }

    return (
      <div className={`flex flex-col space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className={`block text-sm font-semibold text-[#0F172A] dark:text-slate-200 ${labelClassName}`}
          >
            {label}
            {required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}

        {selectElement}

        {errorMessage && (
          <p className="text-xs text-[#EF4444] font-medium">{errorMessage}</p>
        )}

        {!errorMessage && helperText && (
          <p className="text-xs text-[#64748B] font-normal">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
