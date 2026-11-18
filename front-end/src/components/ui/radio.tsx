import { forwardRef, type InputHTMLAttributes } from "react";

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = "", id, ...props }, ref) => {
    const radioId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <label htmlFor={radioId} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={`
            w-4.5 h-4.5 text-[#4F46E5] dark:text-indigo-500 border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-[#111827]
            focus:ring-[#4F46E5]/20 dark:focus:ring-indigo-950/40 focus:ring-2 cursor-pointer transition-all
            ${className}
          `}
          {...props}
        />
        {label && <span className="text-sm font-medium text-[#0F172A] dark:text-slate-200">{label}</span>}
      </label>
    );
  }
);

Radio.displayName = "Radio";
