import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[#4F46E5]
    text-white
    hover:bg-[#4338CA]
    active:bg-[#3730A3]
    shadow-xs
  `,

  secondary: `
    bg-[#EEF2FF] dark:bg-indigo-950/60
    text-[#4F46E5] dark:text-indigo-300
    hover:bg-[#E0E7FF] dark:hover:bg-indigo-900/80
    active:bg-[#C7D2FE] dark:active:bg-indigo-800
  `,

  outline: `
    border border-[#E2E8F0] dark:border-slate-800
    bg-white dark:bg-[#111827]
    text-[#334155] dark:text-slate-200
    hover:bg-[#F8FAFC] dark:hover:bg-slate-800
    hover:border-[#CBD5E1] dark:hover:border-slate-700
  `,

  ghost: `
    text-[#475569] dark:text-slate-300
    hover:bg-[#F1F5F9] dark:hover:bg-slate-800
    hover:text-[#0F172A] dark:hover:text-white
  `,

  danger: `
    bg-[#EF4444]
    text-white
    hover:bg-[#DC2626]
    shadow-xs
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs rounded-lg font-semibold",
  md: "h-10 px-4.5 text-sm rounded-xl font-semibold",
  lg: "h-12 px-6 text-base rounded-xl font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        font-semibold
        transition-all
        duration-200
        outline-none
        focus:ring-2
        focus:ring-[#4F46E5]/20
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}