import React from "react";
import { Pagination } from "../../../components/ui/pagination";

interface QuizPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export const QuizPagination: React.FC<QuizPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) return null;

  return (
    <div className="flex justify-center sm:justify-end mt-8">
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

export default QuizPagination;
