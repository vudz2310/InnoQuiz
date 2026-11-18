import React, { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layouts/Dashboard";
import { useQuizList } from "../hooks/useQuizList";
import { QuizSearchBar } from "../components/QuizSearchBar";
import { QuizFilter } from "../components/QuizFilter";
import { useNotification } from "../../../components/Notification";
import { QuizCard } from "../components/QuizCard";
import { QuizPagination } from "../components/QuizPagination";
import { QuizCardSkeleton } from "../components/QuizCardSkeleton";
import {
  SearchX,
  RotateCcw,
  AlertCircle,
  PlusCircle,
  LayoutGrid,
  Users,
  FileCheck2,
  DoorOpen,
  Sparkles,
  Heart,
  History,
} from "lucide-react";

type ActiveTab = "overview" | "classes" | "tests" | "examRooms";

export const QuizListPage: React.FC = () => {
  const {
    quizzes,
    categories,
    total,
    page,
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
    refetchQuizzes,
  } = useQuizList();

  const { showInfo } = useNotification();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const isFiltering = search.trim() !== "" || selectedCategory !== "";

  // Slice quizzes for sections
  const recentQuizzes = quizzes.slice(0, 4);
  const favoriteQuizzes = quizzes.slice(2, 6);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* 1. Header Toolbar (Studio Bar: Search + Create Quiz CTA) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                Thư viện số HUBT
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Kho Đề Thi & Học Phần Trắc Nghiệm
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search bar */}
            <div className="w-full sm:w-72">
              <QuizSearchBar
                value={search}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm đề thi, môn học..."
              />
            </div>

            {/* Create Quiz Action Button */}
            <Link
              to="/create-quiz"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-500/25 active:scale-95 transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo đề thi</span>
            </Link>
          </div>
        </div>

        {/* 2. Top Navigation Tabs (EduQuiz Studio Style) */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 shadow-2xs border border-indigo-200/60 dark:border-indigo-800/40"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Tổng quan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("classes")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "classes"
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 shadow-2xs border border-indigo-200/60 dark:border-indigo-800/40"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lớp học tập</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tests")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "tests"
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 shadow-2xs border border-indigo-200/60 dark:border-indigo-800/40"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Bài kiểm tra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("examRooms")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "examRooms"
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 shadow-2xs border border-indigo-200/60 dark:border-indigo-800/40"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>Phòng thi</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW (EduQuiz Sectioned Layout) */}
        {activeTab === "overview" && (
          <div className="space-y-10">
            {/* Section A: Truy cập gần đây */}
            {!isFiltering && !loading && recentQuizzes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Truy cập gần đây
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("all-quizzes-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Xem thêm
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentQuizzes.map((quiz) => (
                    <QuizCard key={`recent-${quiz.id}`} quiz={quiz} />
                  ))}
                </div>
              </div>
            )}

            {/* Section B: Đề thi yêu thích & Đề xuất */}
            {!isFiltering && !loading && favoriteQuizzes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                    Đề thi yêu thích & Đề xuất HUBT
                  </h2>
                  <Link
                    to="/favorites"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Xem thêm
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {favoriteQuizzes.map((quiz) => (
                    <QuizCard key={`fav-${quiz.id}`} quiz={quiz} />
                  ))}
                </div>
              </div>
            )}

            {/* Section C: Tất cả đề thi & Lọc chuyên mục */}
            <div id="all-quizzes-section" className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  {isFiltering ? "Kết quả tìm kiếm đề thi" : "Tất cả đề thi trắc nghiệm"}
                </h2>
              </div>

              {/* Scalable Category Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <QuizFilter
                  categories={categories}
                  selectedCategoryId={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  loading={categoriesLoading}
                />

                <div className="flex items-center gap-3">
                  {!loading && (
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Hiển thị <span className="text-slate-900 dark:text-white font-bold">{total}</span> đề thi
                    </span>
                  )}
                  {isFiltering && (
                    <button
                      type="button"
                      onClick={handleResetFilter}
                      className="text-xs font-semibold text-[#4F46E5] dark:text-indigo-400 hover:text-[#4338CA] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Xóa lọc</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ERROR STATE */}
              {error && !loading && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center max-w-md mx-auto my-8">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-red-800 dark:text-red-300 mb-1">
                    Đã xảy ra lỗi
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <button
                    type="button"
                    onClick={refetchQuizzes}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Vui lòng thử lại
                  </button>
                </div>
              )}

              {/* LOADING STATE */}
              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <QuizCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* EMPTY STATE */}
              {!loading && !error && quizzes.length === 0 && (
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto my-8 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                    <SearchX className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    Không tìm thấy đề thi phù hợp
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                    Hãy thử từ khóa tìm kiếm khác hoặc chuyển sang danh mục đề thi khác.
                  </p>
                  {isFiltering && (
                    <button
                      type="button"
                      onClick={handleResetFilter}
                      className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )}

              {/* QUIZ GRID */}
              {!loading && !error && quizzes.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quizzes.map((quiz) => (
                      <QuizCard key={quiz.id} quiz={quiz} />
                    ))}
                  </div>

                  {/* PAGINATION */}
                  <QuizPagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LỚP HỌC TẬP */}
        {activeTab === "classes" && (
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto my-8">
            <Users className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Lớp học phần HUBT
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Bạn chưa tham gia lớp học phần nào. Nhập mã lớp do giảng viên cung cấp để tham gia làm bài tập và kiểm tra định kỳ.
            </p>
            <button
              type="button"
              onClick={() => showInfo("Tính năng lớp học", "Tính năng tham gia lớp học đang được đồng bộ với cổng đào tạo HUBT.")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              + Nhập mã tham gia lớp
            </button>
          </div>
        )}

        {/* TAB 3: BÀI KIỂM TRA */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Danh sách bài kiểm tra học phần (Có tính điểm & hạn chót)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quizzes.map((quiz) => (
                <QuizCard key={`test-${quiz.id}`} quiz={quiz} />
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PHÒNG THI */}
        {activeTab === "examRooms" && (
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto my-8">
            <DoorOpen className="w-12 h-12 text-purple-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Phòng thi trực tuyến HUBT
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Tham gia phòng thi chung với bộ đếm giờ đồng bộ và bảng xếp hạng trực tiếp theo thời gian thực.
            </p>
            <button
              type="button"
              onClick={() => showInfo("Phòng thi trực tuyến", "Phòng thi trực tuyến sẽ mở theo lịch thi học kỳ của trường.")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Vào phòng thi thử nghiệm
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuizListPage;

