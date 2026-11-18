import React, { useState, useRef, useEffect } from "react";
import type { Category } from "../../../types/quiz.types";
import { ChevronDown, Check } from "lucide-react";

interface QuizFilterProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  loading?: boolean;
}

export const QuizFilter: React.FC<QuizFilterProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  loading = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Giới hạn 4 danh mục đầu tiên hiển thị dạng tab nhanh, các danh mục còn lại đưa vào dropdown "Khác ▾"
  const visibleCategories = categories.slice(0, 4);
  const overflowCategories = categories.slice(4);

  const selectedCategoryInOverflow = overflowCategories.find(
    (c) => c.id === selectedCategoryId
  );

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Nút 'Tất cả' */}
      <button
        type="button"
        onClick={() => {
          onSelectCategory("");
          setDropdownOpen(false);
        }}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          selectedCategoryId === ""
            ? "bg-[#4F46E5] text-white shadow-xs"
            : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:text-[#4F46E5] dark:hover:text-indigo-400"
        }`}
      >
        Tất cả
      </button>

      {/* 4 Danh mục phổ biến đầu tiên */}
      {visibleCategories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              onSelectCategory(cat.id);
              setDropdownOpen(false);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isSelected
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:text-[#4F46E5] dark:hover:text-indigo-400"
            }`}
          >
            {cat.name}
          </button>
        );
      })}

      {/* Dropdown "Danh mục khác" nếu có hơn 4 danh mục */}
      {overflowCategories.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategoryInOverflow
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:text-[#4F46E5] dark:hover:text-indigo-400"
            }`}
          >
            <span>{selectedCategoryInOverflow ? selectedCategoryInOverflow.name : "Khác"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-52 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-20 max-h-60 overflow-y-auto animate-in fade-in-50 duration-150">
              {overflowCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#4F46E5] dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="w-16 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      )}
    </div>
  );
};
