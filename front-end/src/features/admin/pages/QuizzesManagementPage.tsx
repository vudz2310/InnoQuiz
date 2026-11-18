import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi, type AdminQuizItem, type AdminQuizzesResponse } from "../../../services/api/Admin.api";
import { majorApi } from "../../../services/api/Major.api";
import type { Major } from "../../../types/academic.interface";
import { useNotification } from "../../../components/Notification";
import {
  BookOpenCheck,
  Search,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Pagination } from "../../../components/ui/pagination";
import { SearchableSelect } from "../../../components/ui/searchable-select";

export const QuizzesManagementPage: React.FC = () => {
  const [data, setData] = useState<AdminQuizzesResponse | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [majorFilter, setMajorFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { showSuccess, showError } = useNotification();

  const loadData = async (currentPage = page, currentLimit = limit) => {
    try {
      setLoading(true);
      setError(null);
      const [res, majorList] = await Promise.all([
        adminApi.getAdminQuizzes({
          search: search || undefined,
          status: statusFilter || undefined,
          majorId: majorFilter || undefined,
          page: currentPage,
          limit: currentLimit,
        }),
        majorApi.getAdminMajors(),
      ]);
      setData(res);
      setMajors(majorList);
    } catch {
      setError("Không thể tải danh sách đề thi toàn hệ thống.");
      showError("Lỗi", "Không thể tải danh sách đề thi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
    setPage(1);
  }, [statusFilter, majorFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
    setPage(1);
  };

  const handleToggleStatus = async (quiz: AdminQuizItem) => {
    const nextStatus = quiz.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      setUpdatingId(quiz.id);
      await adminApi.updateQuizStatus(quiz.id, nextStatus);
      showSuccess(
        "Thành công",
        `Đã chuyển trạng thái đề thi sang ${nextStatus === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}.`
      );
      loadData(page);
    } catch {
      showError("Lỗi", "Không thể cập nhật trạng thái đề thi.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Quản lý Ngân hàng Đề thi Toàn hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kiểm duyệt nội dung, quản lý phạm vi chuyên ngành và trạng thái xuất bản
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(page)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
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
        <form onSubmit={handleSearchSubmit} className="sm:col-span-6 flex gap-2">
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

        <div className="sm:col-span-3">
          <SearchableSelect
            size="sm"
            placeholder="-- Tất cả ngành học --"
            searchPlaceholder="Tìm ngành học..."
            value={majorFilter}
            onChange={(val) => {
              setMajorFilter(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "-- Tất cả ngành học --" },
              ...majors.map((m) => ({
                value: m.id,
                label: `${m.code} — ${m.name}`,
                badge: m.code,
                subLabel: m.name,
              })),
            ]}
          />
        </div>

        <div className="sm:col-span-3">
          <SearchableSelect
            size="sm"
            placeholder="-- Tất cả trạng thái --"
            searchPlaceholder="Tìm trạng thái..."
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "-- Tất cả trạng thái --" },
              { value: "PUBLISHED", label: "Đã xuất bản (PUBLISHED)", badge: "PUBLISHED" },
              { value: "DRAFT", label: "Bản nháp (DRAFT)", badge: "DRAFT" },
              { value: "ARCHIVED", label: "Lưu trữ (ARCHIVED)", badge: "ARCHIVED" },
            ]}
          />
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Tên đề thi</th>
                <th className="py-3 px-4">Tác giả / Giảng viên</th>
                <th className="py-3 px-4">Phạm vi ngành</th>
                <th className="py-3 px-4 text-center">Câu hỏi</th>
                <th className="py-3 px-4 text-center">Lượt làm</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách đề thi...
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <BookOpenCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    Không tìm thấy đề thi nào phù hợp.
                  </td>
                </tr>
              ) : (
                data.items.map((quiz) => (
                  <tr
                    key={quiz.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block max-w-xs truncate">
                        {quiz.title}
                      </span>
                      {quiz.description && (
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {quiz.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <span className="font-medium block">{quiz.author?.name || "Hệ thống"}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {quiz.author?.role || "ADMIN"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {quiz.majorScope === "ALL_MAJORS" ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Toàn trường
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {quiz.quizMajors.map((qm) => (
                            <span
                              key={qm.major.id}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900"
                            >
                              {qm.major.code}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                      {quiz._count.questions}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                      {quiz._count.attempts}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={updatingId === quiz.id}
                          onClick={() => handleToggleStatus(quiz)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                            quiz.status === "PUBLISHED"
                              ? "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400"
                          }`}
                          title={quiz.status === "PUBLISHED" ? "Hạ về bản nháp" : "Duyệt xuất bản"}
                        >
                          {quiz.status === "PUBLISHED" ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <Link
                          to={`/quiz/${quiz.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Xem thử đề thi"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
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
    </div>
  );
};

export default QuizzesManagementPage;
