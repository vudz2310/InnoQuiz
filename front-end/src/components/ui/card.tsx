import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  clickable?: boolean;
}

export function Card({
  children,
  clickable = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-[#111827]
        border border-[#E2E8F0] dark:border-slate-800
        text-[#0F172A] dark:text-slate-100
        rounded-2xl
        p-6
        shadow-xs
        transition-all duration-200
        ${clickable ? "hover:border-[#C7D2FE] dark:hover:border-indigo-500 cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

