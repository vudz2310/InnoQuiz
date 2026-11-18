import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  className = "",
}) => {
  if (totalPages <= 0 && (!totalItems || totalItems === 0)) {
    return null;
  }

  // Thuật toán hiển thị dải số trang kèm dấu ...
  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: Array<number | string> = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-2.5 px-4 py-3 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 shadow-2xs ${className}`}
    >
      {/* Nút Về trang đầu («) */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        title="Trang đầu"
        aria-label="First page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>

      {/* Nút Trang trước (‹) */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        title="Trang trước"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Danh sách các số trang */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`dots-${idx}`}
                className="flex h-8 w-8 items-center justify-center text-slate-400 select-none font-medium"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl font-medium text-xs transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Nút Trang tiếp theo (›) */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        title="Trang tiếp"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Nút Đến trang cuối (») */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(totalPages)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        title="Trang cuối"
        aria-label="Last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>

      {/* Thông tin Tổng số */}
      {totalItems !== undefined && (
        <span className="font-medium text-slate-600 dark:text-slate-400 px-1 select-none">
          Tổng <strong className="text-blue-600 dark:text-blue-400 font-semibold">{totalItems}</strong>
        </span>
      )}

      {/* Thanh phân cách dọc */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
      )}

      {/* Dropdown Chọn số lượng dòng mỗi trang */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="relative inline-flex items-center">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none cursor-pointer transition-colors"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} dòng mỗi trang
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>
      )}
    </div>
  );
};

export default Pagination;
