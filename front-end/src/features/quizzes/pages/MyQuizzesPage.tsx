import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/Dashboard";
import { quizApi } from "../../../services/api/Quiz.api";
import { uploadApi } from "../../../services/api/Upload.api";
import { useNotification } from "../../../components/Notification";
import type { Quiz } from "../../../types/quiz.types";
import { getMediaUrl } from "../../../utils/media";
import defaultCover from "../../../assets/images/khodethi.png";
import {
  Plus,
  Edit3,
  Trash2,
  Send,
  Eye,
  Clock,
  FileQuestion,
  Loader2,
  AlertCircle,
  Image,
  FileText,
  Search,
  LayoutGrid,
  List,
  GraduationCap,
} from "lucide-react";

type TabFilter = "ALL" | "PUBLISHED" | "DRAFT";

export const MyQuizzesPage: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const { showSuccess, showError } = useNotification();
  const isDeletingRef = useRef(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [currentTab, setCurrentTab] = useState<TabFilter>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Image load error tracking
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Modal xác nhận xóa
  const [deleteModalQuiz, setDeleteModalQuiz] = useState<Quiz | null>(null);

  // Quick Cover Upload state
  const [coverModalQuiz, setCoverModalQuiz] = useState<Quiz | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const fetchMyQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quizApi.getMyQuizzes({ limit: 100 });
      setQuizzes(data?.items || []);
    } catch (err: unknown) {
      console.error("Lỗi khi tải danh sách đề thi của tôi:", err);
      setError("Không thể tải danh sách đề thi của bạn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyQuizzes();
  }, [fetchMyQuizzes]);

  // Xóa Quiz
  const handleConfirmDelete = async () => {
    if (!deleteModalQuiz || isDeletingRef.current) return;
    const targetQuiz = deleteModalQuiz;
    const targetId = targetQuiz.id;

    try {
      isDeletingRef.current = true;
      setActionLoadingId(targetId);
      await quizApi.deleteQuiz(targetId);
      setQuizzes((prev) => prev.filter((q) => q.id !== targetId));
      showSuccess("Đã xóa bài thi", `Đã xóa bài thi "${targetQuiz.title}" thành công.`);
      setDeleteModalQuiz(null);
    } catch (err: unknown) {
      const apiError = err as { response?: { status?: number; data?: { message?: string; code?: string } } };
      // Nếu backend trả 404 (đã bị xóa rồi) thì vẫn xử lý như xóa thành công
      if (apiError.response?.status === 404) {
        setQuizzes((prev) => prev.filter((q) => q.id !== targetId));
        showSuccess("Đã xóa bài thi", `Đã xóa bài thi "${targetQuiz.title}" thành công.`);
        setDeleteModalQuiz(null);
      } else {
        showError("Lỗi xóa bài thi", apiError.response?.data?.message || "Không thể xóa bài thi này");
      }
    } finally {
      setActionLoadingId(null);
      isDeletingRef.current = false;
    }
  };

  // Publish nhanh từ danh sách
  const handlePublish = async (quiz: Quiz) => {
    try {
      setActionLoadingId(quiz.id);
      await quizApi.publishQuiz(quiz.id);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quiz.id ? { ...q, status: "PUBLISHED" } : q)),
      );
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      showError("Lỗi xuất bản", apiError.response?.data?.message || "Không thể xuất bản bài thi");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick cover file upload handler
  const handleQuickCoverUpload = async (file: File) => {
    if (!coverModalQuiz) return;
    try {
      setUploadingCover(true);
      const res = await uploadApi.uploadQuizCover(coverModalQuiz.id, file);
      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === coverModalQuiz.id
            ? { ...q, coverUrl: res.coverUrl, coverKey: res.coverKey }
            : q,
        ),
      );
      setCoverModalQuiz((prev) =>
        prev
          ? { ...prev, coverUrl: res.coverUrl, coverKey: res.coverKey }
          : null,
      );
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      showError("Lỗi tải ảnh bìa", apiError.response?.data?.message || "Không thể tải lên ảnh bìa.");
    } finally {
      setUploadingCover(false);
    }
  };

  // Filtered quizzes
  const filteredQuizzes = quizzes.filter((q) => {
    const matchSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.description &&
        q.description.toLowerCase().includes(search.toLowerCase())) ||
      (q.category &&
        q.category.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    if (currentTab === "PUBLISHED") return q.status === "PUBLISHED";
    if (currentTab === "DRAFT") return q.status === "DRAFT";
    return true;
  });

  const publishedCount = quizzes.filter((q) => q.status === "PUBLISHED").length;
  const draftCount = quizzes.filter((q) => q.status === "DRAFT").length;
  const totalQuestions = quizzes.reduce(
    (acc, q) => acc + (q._count?.questions ?? 0),
    0,
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* 1. Header Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                Quản lý học liệu HUBT
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Đề thi của tôi
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/converter"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Import từ PDF / Word</span>
            </Link>

            <Link
              to="/create-quiz"
              className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề thi mới</span>
            </Link>
          </div>
        </div>

        {/* 2. Overview Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Tổng số đề thi
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {quizzes.length}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
            {/* <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Đã xuất bản</p> */}
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {publishedCount}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 shadow-2xs">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Bản nháp
            </p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
              {draftCount}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 shadow-2xs">
            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
              Tổng số câu hỏi
            </p>
            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
              {totalQuestions}
            </p>
          </div>
        </div>

        {/* 3. Filter Tabs & Search & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-200/90 dark:border-slate-800">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(
              [
                { key: "ALL", label: "Tất cả đề thi", count: quizzes.length },
                {
                  key: "PUBLISHED",
                  label: "Đã xuất bản",
                  count: publishedCount,
                },
                { key: "DRAFT", label: "Bản nháp", count: draftCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCurrentTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  currentTab === tab.key
                    ? "bg-[#4F46E5] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    currentTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search + View switcher */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Lọc đề thi của tôi..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 bg-white dark:bg-[#111827]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Đang tải danh sách bài thi của bạn...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center max-w-md mx-auto my-8">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-red-800 dark:text-red-300 mb-1">
              Đã xảy ra lỗi
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400 mb-4">
              {error}
            </p>
            <button
              type="button"
              onClick={fetchMyQuizzes}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredQuizzes.length === 0 && (
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {search
                ? "Không tìm thấy đề thi phù hợp"
                : "Bạn chưa tạo đề thi nào"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {search
                ? "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc."
                : "Bắt đầu sáng tạo ngân hàng đề trắc nghiệm chuẩn học phần HUBT ngay hôm nay."}
            </p>
            <Link
              to="/create-quiz"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề thi ngay</span>
            </Link>
          </div>
        )}

        {/* 4. GRID VIEW (EduQuiz Studio Cards) */}
        {!loading &&
          !error &&
          filteredQuizzes.length > 0 &&
          viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredQuizzes.map((quiz) => {
                const isPublished = quiz.status === "PUBLISHED";
                const isActionLoading = actionLoadingId === quiz.id;
                const questionCount =
                  quiz._count?.questions ?? quiz.questions?.length ?? 0;

                const formattedCover = getMediaUrl(quiz.coverUrl);
                const hasCover = Boolean(
                  formattedCover && !failedImages[quiz.id],
                );

                return (
                  <div
                    key={quiz.id}
                    className="group flex flex-col justify-between bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div>
                      {/* Top: 16:9 Thumbnail with quick cover upload trigger */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-900 group/cover">
                        <img
                          src={hasCover ? formattedCover : defaultCover}
                          alt={quiz.title}
                          onError={() =>
                            setFailedImages((prev) => ({
                              ...prev,
                              [quiz.id]: true,
                            }))
                          }
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Category Badge on Cover */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-slate-950/70 backdrop-blur-md text-white shadow-xs border border-white/20">
                            <GraduationCap className="w-3 h-3 text-emerald-400" />
                            {quiz.category?.name || "Học phần HUBT"}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3 z-10 ">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider backdrop-blur-md shadow-xs ${
                              isPublished
                                ? "bg-emerald-600/90 text-white"
                                : "bg-amber-600/90 text-white"
                            }`}
                          >
                            {isPublished ? "Đã xuất bản" : "Bản nháp"}
                          </span>
                        </div>

                        {/* Quick Cover Change Button overlay */}
                        <button
                          type="button"
                          onClick={() => setCoverModalQuiz(quiz)}
                          className="absolute bottom-2.5 right-2.5 z-10 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer"
                          title="Đổi ảnh bìa đề thi"
                        >
                          <Image className="w-3.5 h-3.5" />
                          <span>Đổi ảnh bìa</span>
                        </button>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5">
                        <h3
                          onClick={() => navigate(`/quiz/${quiz.id}`)}
                          className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1 mb-2 cursor-pointer"
                        >
                          {quiz.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Tạo lúc:{" "}
                            {new Date(quiz.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold mb-3">
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                            <span className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[11px] font-black text-amber-700 dark:text-amber-300">
                              ?
                            </span>
                            <span>{questionCount} câu hỏi</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {quiz.timeLimit ? `${quiz.timeLimit}p` : "Tự do"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Xem bài thi */}
                        <button
                          type="button"
                          onClick={() => navigate(`/quiz/${quiz.id}`)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Xem trước đề thi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Sửa đề thi */}
                        <button
                          type="button"
                          onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}
                          className="px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-[#4F46E5] dark:text-indigo-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Chỉnh sửa đề thi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        {/* Xuất bản (Nếu là nháp) */}
                        {!isPublished && (
                          <button
                            type="button"
                            onClick={() => handlePublish(quiz)}
                            disabled={isActionLoading}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            title="Xuất bản đề thi này"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>Xuất bản</span>
                          </button>
                        )}
                      </div>

                      {/* Xóa */}
                      <button
                        type="button"
                        onClick={() => setDeleteModalQuiz(quiz)}
                        disabled={isActionLoading}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                        title="Xóa đề thi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {/* 5. LIST VIEW */}
        {!loading &&
          !error &&
          filteredQuizzes.length > 0 &&
          viewMode === "list" && (
            <div className="space-y-3">
              {filteredQuizzes.map((quiz) => {
                const isPublished = quiz.status === "PUBLISHED";
                const isActionLoading = actionLoadingId === quiz.id;
                const formattedCover = getMediaUrl(quiz.coverUrl);
                const hasCover = Boolean(
                  formattedCover && !failedImages[quiz.id],
                );

                return (
                  <div
                    key={quiz.id}
                    className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Tiny Cover */}
                      <div
                        onClick={() => setCoverModalQuiz(quiz)}
                        className="w-20 h-14 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 cursor-pointer relative group/thumb"
                      >
                        <img
                          src={hasCover ? formattedCover : defaultCover}
                          alt=""
                          onError={() =>
                            setFailedImages((prev) => ({
                              ...prev,
                              [quiz.id]: true,
                            }))
                          }
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          Đổi ảnh
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              isPublished
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {isPublished ? "Đã xuất bản" : "Bản nháp"}
                          </span>
                          {quiz.category && (
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                              {quiz.category.name}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            • Tạo:{" "}
                            {new Date(quiz.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </div>

                        <h3
                          onClick={() => navigate(`/quiz/${quiz.id}`)}
                          className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors truncate cursor-pointer"
                        >
                          {quiz.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{quiz._count?.questions ?? 0} câu hỏi</span>
                          <span>•</span>
                          <span>
                            {quiz.timeLimit
                              ? `${quiz.timeLimit} phút`
                              : "Không giới hạn"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300 cursor-pointer"
                        title="Xem bài thi"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}
                        className="px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        title="Chỉnh sửa đề thi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>

                      {!isPublished && (
                        <button
                          type="button"
                          onClick={() => handlePublish(quiz)}
                          disabled={isActionLoading}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Xuất bản</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeleteModalQuiz(quiz)}
                        disabled={isActionLoading}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Xóa đề thi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {/* MODAL 1: ĐỔI ẢNH BÌA NHANH CHO ĐỀ THI */}
        {coverModalQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-indigo-600" />
                  Cập nhật ảnh bìa đề thi
                </h3>
                <button
                  type="button"
                  onClick={() => setCoverModalQuiz(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕ Đóng
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Đề thi:{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {coverModalQuiz.title}
                  </strong>
                </p>

                {/* Cover Preview */}
                <div className="relative aspect-[16/8] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 mb-4">
                  {coverModalQuiz.coverUrl &&
                  !failedImages[`modal-${coverModalQuiz.id}`] ? (
                    <img
                      src={getMediaUrl(coverModalQuiz.coverUrl)}
                      alt="Cover preview"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [`modal-${coverModalQuiz.id}`]: true,
                        }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center text-white gap-1">
                      <Image className="w-10 h-10 opacity-70" />
                      <span className="text-xs font-bold">
                        Chưa có ảnh bìa tùy chỉnh
                      </span>
                    </div>
                  )}
                </div>

                <input
                  ref={quickFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  disabled={uploadingCover}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleQuickCoverUpload(file);
                    e.target.value = "";
                  }}
                />

                <button
                  type="button"
                  onClick={() => quickFileInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {uploadingCover ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang tải ảnh
                      lên và nén WebP...
                    </>
                  ) : (
                    <>
                      <Image className="w-4 h-4" /> Tải lên ảnh bìa mới từ máy
                      tính
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: XÁC NHẬN XÓA ĐỀ THI */}
        {deleteModalQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bạn có chắc muốn xóa đề thi này?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Đề thi{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    "{deleteModalQuiz.title}"
                  </span>{" "}
                  cùng toàn bộ câu hỏi sẽ bị xóa vĩnh viễn khỏi hệ thống.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalQuiz(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={Boolean(actionLoadingId) || isDeletingRef.current}
                  className="px-4.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoadingId ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    "Xác nhận xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyQuizzesPage;
