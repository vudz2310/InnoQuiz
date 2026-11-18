import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { teacherApi, type TeacherQuizzesResponse } from "../../../services/api/Teacher.api";
import {
  ClipboardList,
  Search,
  RefreshCw,
  Plus,
  BookOpenCheck,
  Users,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Pagination } from "../../../components/ui/pagination";

export const TeacherQuizzesPage: React.FC = () => {
  const [data, setData] = useState<TeacherQuizzesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadData = async (currentPage = page, currentLimit = limit) => {
    try {
      setLoading(true);
      setError(null);
      const res = await teacherApi.getQuizzes({
        search: search || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        limit: currentLimit,
      });
      setData(res);
    } catch {
      setError("Không thể tải danh sách đề thi của giảng viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
    setPage(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Ngân hàng Đề thi của Giảng viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý, biên soạn và công bố các bài thi trắc nghiệm học phần
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadData(page)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            to="/create-quiz"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo đề thi mới
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-rose-700 dark:text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(page)}
            className="font-semibold underline hover:text-rose-800 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-3">
        <form onSubmit={handleSearchSubmit} className="sm:col-span-8 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề đề thi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Tìm
          </button>
        </form>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
          </select>
        </div>
      </div>

      {/* Quizzes List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 shadow-2xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Đang tải danh sách đề thi...
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 shadow-2xs">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-sm">Bạn chưa có đề thi nào trong mục này.</p>
            <Link
              to="/create-quiz"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo đề thi mới
            </Link>
          </div>
        ) : (
          data.items.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      quiz.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : quiz.status === "DRAFT"
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {quiz.status === "PUBLISHED"
                      ? "Đã xuất bản"
                      : quiz.status === "DRAFT"
                      ? "Bản nháp"
                      : "Lưu trữ"}
                  </span>

                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {quiz.majorScope === "ALL_MAJORS" ? "Tất cả ngành" : "Ngành chỉ định"}
                  </span>

                  {quiz.quizMajors?.map((qm) => (
                    <span
                      key={qm.major.id}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900"
                    >
                      {qm.major.code}
                    </span>
                  ))}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {quiz.title}
                </h3>
                {quiz.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                    {quiz.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <BookOpenCheck className="w-3.5 h-3.5 text-indigo-500" />
                    {quiz._count.questions} câu hỏi
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    {quiz._count.attempts} lượt làm bài
                  </span>
                  {quiz.timeLimit && (
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {quiz.timeLimit} phút
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link
                  to={`/quizzes/${quiz.id}/edit`}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Chỉnh sửa
                </Link>
                <Link
                  to={`/quiz/${quiz.id}`}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  Xem chi tiết <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex justify-end">
          <Pagination
            currentPage={page}
            totalPages={data.totalPages}
            totalItems={data.total}
            pageSize={limit}
            pageSizeOptions={[10, 20, 50, 100]}
            onPageChange={(p) => {
              setPage(p);
              loadData(p, limit);
            }}
            onPageSizeChange={(sz) => {
              setLimit(sz);
              setPage(1);
              loadData(1, sz);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TeacherQuizzesPage;
