import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { ChevronDown, Search, X, Check, AlertCircle } from "lucide-react";

// Hàm chuẩn hóa tiếng Việt để tìm kiếm không dấu
function removeVietnameseTones(str: string): string {
  if (!str) return "";
  let s = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[đĐ]/g, "d");
  return s.toLowerCase().trim();
}

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  count?: number;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | boolean;
  disabled?: boolean;
  required?: boolean;
  icon?: ReactNode;
  emptyMessage?: string;
  size?: "sm" | "md" | "lg";
  allowClear?: boolean;
  className?: string;
  containerClassName?: string;
}

export function SearchableSelect({
  label,
  placeholder = "Chọn một mục...",
  searchPlaceholder = "Nhập để tìm kiếm...",
  options,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  icon,
  emptyMessage = "Không tìm thấy kết quả phù hợp.",
  size = "md",
  allowClear = true,
  className = "",
  containerClassName = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  // Tìm option đang được chọn
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Lọc options theo từ khóa tìm kiếm thông minh (hỗ trợ có dấu, không dấu, badge, sublabel, mã)
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.trim().toLowerCase();
    const queryNoTone = removeVietnameseTones(query);

    return options.filter((opt) => {
      const label = opt.label.toLowerCase();
      const labelNoTone = removeVietnameseTones(opt.label);
      const subLabel = opt.subLabel?.toLowerCase() || "";
      const subLabelNoTone = removeVietnameseTones(opt.subLabel || "");
      const badge = opt.badge?.toLowerCase() || "";
      const badgeNoTone = removeVietnameseTones(opt.badge || "");
      const val = opt.value.toLowerCase();

      return (
        label.includes(query) ||
        labelNoTone.includes(queryNoTone) ||
        subLabel.includes(query) ||
        subLabelNoTone.includes(queryNoTone) ||
        badge.includes(query) ||
        badgeNoTone.includes(queryNoTone) ||
        val.includes(query)
      );
    });
  }, [options, searchQuery]);

  // Reset highlight khi danh sách lọc thay đổi
  useEffect(() => {
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions]);

  // Tự động focus vào ô tìm kiếm khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      if (onBlur) onBlur();
    }
  }, [isOpen]);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        highlightedIndex >= 0 &&
        highlightedIndex < filteredOptions.length &&
        !filteredOptions[highlightedIndex].disabled
      ) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    }
  };

  // Kích thước classes
  const sizeClasses = {
    sm: "min-h-[34px] px-2.5 py-1.5 text-xs rounded-xl",
    md: "min-h-[42px] px-3.5 py-2 text-xs sm:text-sm rounded-xl",
    lg: "min-h-[48px] px-4 py-2.5 text-sm sm:text-base rounded-2xl",
  }[size];

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative flex flex-col space-y-1.5 w-full ${containerClassName}`}
    >
      {/* Label */}
      {label && (
        <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${sizeClasses} text-left font-medium transition-all duration-150 flex items-center justify-between gap-2 border cursor-pointer outline-none ${
          disabled
            ? "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60"
            : isError
            ? "bg-white dark:bg-[#111827] border-rose-500 text-rose-600 focus:ring-2 focus:ring-rose-500/20"
            : isOpen
            ? "bg-white dark:bg-[#111827] border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-600/15 dark:ring-indigo-500/20"
            : "bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100"
        } ${className}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && (
            <span className="text-slate-400 dark:text-slate-500 shrink-0">
              {icon}
            </span>
          )}

          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.badge && (
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
              <span className="truncate text-slate-900 dark:text-white font-semibold">
                {selectedOption.label}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && allowClear && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""
            }`}
          />
        </div>
      </button>

      {/* Error text */}
      {errorMessage && (
        <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Ô tìm kiếm nhanh */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {options.length > 0 && (
              <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-400 font-medium">
                <span>
                  {filteredOptions.length === options.length
                    ? `Tổng ${options.length} lựa chọn`
                    : `Tìm thấy ${filteredOptions.length} / ${options.length} mục`}
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Xem tất cả
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Danh sách Options */}
          <div ref={listRef} className="max-h-60 overflow-y-auto p-1.5 space-y-1 divide-y-0">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Search className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1.5" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {emptyMessage}
                </p>
                {searchQuery && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Thử tìm với từ khóa khác như tên hoặc mã số...
                  </p>
                )}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                        : isHighlighted
                        ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white"
                        : "text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold shrink-0 border ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{opt.label}</div>
                        {opt.subLabel && (
                          <div className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                            {opt.subLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.count !== undefined && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                          {opt.count}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
