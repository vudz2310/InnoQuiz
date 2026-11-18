import React, { useEffect, useState } from "react";
import { teacherApi, type TeacherStudentsResponse, type TeacherClass } from "../../../services/api/Teacher.api";
import { Users, Search, RefreshCw, AlertCircle, BookOpenCheck } from "lucide-react";
import { Pagination } from "../../../components/ui/pagination";

export const TeacherStudentsPage: React.FC = () => {
  const [data, setData] = useState<TeacherStudentsResponse | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadData = async (currentPage = page, currentLimit = limit) => {
    try {
      setLoading(true);
      setError(null);
      const [res, classList] = await Promise.all([
        teacherApi.getStudents({
          search: search || undefined,
          classId: classFilter || undefined,
          page: currentPage,
          limit: currentLimit,
        }),
        teacherApi.getClasses(),
      ]);
      setData(res);
      setClasses(classList);
    } catch {
      setError("Không thể tải danh sách sinh viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
    setPage(1);
  }, [classFilter]);

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
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Hồ sơ Sinh viên Lớp Giảng dạy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu kết quả học tập và số lượt làm bài của từng sinh viên
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
        <form onSubmit={handleSearchSubmit} className="sm:col-span-8 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, mã sinh viên..."
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
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">-- Tất cả lớp học phần --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Mã sinh viên</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Lớp sinh viên</th>
                <th className="py-3 px-4">Chuyên ngành</th>
                <th className="py-3 px-4 text-center">Lượt thi</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách sinh viên...
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    Không tìm thấy sinh viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                data.items.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {s.studentCode || (
                        <span className="text-slate-400 italic">Chưa có</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {s.email}
                    </td>
                    <td className="py-3 px-4">
                      {s.academicClass ? (
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {s.academicClass.code}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa xếp lớp</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {s.major?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs">
                        <BookOpenCheck className="w-3.5 h-3.5 text-indigo-500" />
                        {s._count.attempts}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                        }`}
                      >
                        {s.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                      </span>
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

export default TeacherStudentsPage;
