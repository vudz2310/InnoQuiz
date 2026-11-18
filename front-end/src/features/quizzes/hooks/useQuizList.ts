import { useState, useEffect, useCallback } from "react";
import { quizApi } from "../../../services/api/Quiz.api";
import { categoryApi } from "../../../services/api/Category.api";
import type { Quiz, Category } from "../../../types/quiz.types";
import { useDebounce } from "../../../hooks/useDebounce";

export const useQuizList = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(9);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce<string>(search, 400);

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Tải danh sách Categories khi mount
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await categoryApi.getCategories();
        if (isMounted) {
          setCategories(data);
        }
      } catch (err: unknown) {
        console.error("Lỗi khi tải danh mục:", err);
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Tải danh sách Quizzes khi page, debouncedSearch, hoặc selectedCategory thay đổi
  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quizApi.getQuizzes({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        categoryId: selectedCategory || undefined,
      });

      if (data) {
        setQuizzes(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err: unknown) {
      console.error("Lỗi khi tải danh sách bài thi:", err);
      setError("Không thể tải danh sách bài thi.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Handler: Thay đổi search -> reset về trang 1
  const handleSearchChange = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  // Handler: Chọn category -> reset về trang 1
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  // Handler: Đổi trang
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handler: Xóa toàn bộ bộ lọc
  const handleResetFilter = () => {
    setSearch("");
    setSelectedCategory("");
    setPage(1);
  };

  return {
    quizzes,
    categories,
    total,
    page,
    limit,
    totalPages,
    search,
    selectedCategory,
    loading,
    categoriesLoading,
    error,
    handleSearchChange,
    handleSelectCategory,
    handlePageChange,
    handleResetFilter,
    refetchQuizzes: fetchQuizzes,
  };
};
