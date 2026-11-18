import type { HTMLAttributes, ReactNode } from "react";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ children, className = "", ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs">
      <table className={`w-full text-left border-collapse text-sm text-[#334155] dark:text-slate-300 ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-[#F8FAFC] dark:bg-[#0B0F19] border-b border-[#E2E8F0] dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-slate-400 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-[#E2E8F0] dark:divide-slate-800 ${className}`} {...props}>{children}</tbody>;
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}

export function TableRow({ selected = false, children, className = "", ...props }: TableRowProps) {
  return (
    <tr
      className={`
        transition-colors duration-150
        ${selected ? "bg-[#EEF2FF] dark:bg-indigo-950/40" : "hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60"}
        ${className}
      `}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "", ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-5 py-4 text-slate-700 dark:text-slate-300 ${className}`} {...props}>
      {children}
    </td>
  );
}
