import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "primary" | "success" | "warning" | "danger" | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-[#EEF2FF] dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40",
  success: "bg-[#ECFDF5] dark:bg-emerald-950/70 text-[#047857] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40",
  warning: "bg-[#FFFBEB] dark:bg-amber-950/70 text-[#B45309] dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40",
  danger: "bg-[#FEF2F2] dark:bg-rose-950/70 text-[#DC2626] dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40",
  neutral: "bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/40",
};

export function Badge({
  children,
  variant = "primary",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1
        px-2.5
        py-1
        rounded-full
        text-xs
        font-semibold
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
