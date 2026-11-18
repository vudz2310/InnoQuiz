import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | boolean;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: "default" | "hubt";
  containerClassName?: string;
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error = false,
      helperText,
      leftIcon,
      rightIcon,
      variant = "default",
      containerClassName = "",
      labelClassName = "",
      className = "",
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const isError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const baseStyles = `
      w-full h-11 px-4 rounded-xl bg-white dark:bg-[#111827] border text-sm text-[#0F172A] dark:text-slate-100
      placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 outline-none transition-all duration-200
      ${
        isError
          ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/10 dark:focus:ring-red-950/40"
          : "border-[#E2E8F0] dark:border-slate-800 hover:border-[#CBD5E1] dark:hover:border-slate-700 focus:border-[#4F46E5] dark:focus:border-indigo-500 focus:ring-2 focus:ring-[#4F46E5]/10 dark:focus:ring-indigo-950/40"
      }
    `;

    const inputElement = (
      <div className="relative w-full flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-[#94A3B8] dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          className={`
            ${baseStyles}
            ${leftIcon ? "pl-10" : ""}
            ${rightIcon ? "pr-10" : ""}
            disabled:bg-[#F1F5F9] dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed disabled:text-[#94A3B8] dark:disabled:text-slate-500
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 text-[#94A3B8] dark:text-slate-500 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (!label && !errorMessage && !helperText) {
      return inputElement;
    }

    return (
      <div className={`flex flex-col space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-semibold text-[#0F172A] dark:text-slate-200 ${labelClassName}`}
          >
            {label}
            {required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}

        {inputElement}

        {errorMessage && (
          <p className="text-xs text-[#EF4444] font-medium">
            {errorMessage}
          </p>
        )}

        {!errorMessage && helperText && (
          <p className="text-xs text-[#64748B] font-normal">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
