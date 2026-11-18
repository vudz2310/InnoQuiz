import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | boolean;
  helperText?: string;
  variant?: "default" | "hubt";
  containerClassName?: string;
  labelClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error = false,
      helperText,
      variant = "default",
      containerClassName = "",
      labelClassName = "",
      className = "",
      id,
      required,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const isError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;
    const textareaId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const baseStyles = `
      w-full p-3.5 rounded-xl bg-white dark:bg-[#111827] border text-sm text-[#0F172A] dark:text-slate-100
      placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 outline-none transition-all duration-200 resize-y min-h-[100px]
      ${
        isError
          ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/10 dark:focus:ring-red-950/40"
          : "border-[#E2E8F0] dark:border-slate-800 hover:border-[#CBD5E1] dark:hover:border-slate-700 focus:border-[#4F46E5] dark:focus:border-indigo-500 focus:ring-2 focus:ring-[#4F46E5]/10 dark:focus:ring-indigo-950/40"
      }
    `;

    const textareaElement = (
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        className={`
          ${baseStyles}
          disabled:bg-[#F1F5F9] dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed disabled:text-[#94A3B8] dark:disabled:text-slate-500
          ${className}
        `}
        {...props}
      />
    );

    if (!label && !errorMessage && !helperText) {
      return textareaElement;
    }

    return (
      <div className={`flex flex-col space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className={`block text-sm font-semibold text-[#0F172A] dark:text-slate-200 ${labelClassName}`}
          >
            {label}
            {required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}

        {textareaElement}

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

Textarea.displayName = "Textarea";
