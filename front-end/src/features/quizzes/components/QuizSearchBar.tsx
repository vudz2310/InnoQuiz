import React from "react";
import { Search, X } from "lucide-react";

interface QuizSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const QuizSearchBar: React.FC<QuizSearchBarProps> = ({
  value,
  onChange,
  placeholder = "Tìm kiếm bài thi theo tên, chủ đề...",
}) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8] dark:text-slate-500">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-slate-800 rounded-xl text-xs sm:text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-slate-500 shadow-2xs focus:outline-none focus:border-[#4F46E5] dark:focus:border-indigo-500 focus:ring-3 focus:ring-indigo-50 dark:focus:ring-indigo-950/40 transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#475569] dark:hover:text-slate-300 transition-colors cursor-pointer"
          title="Xóa tìm kiếm"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
