import React, { useEffect, useState } from "react";
import { teacherApi, type TeacherClass } from "../../../services/api/Teacher.api";
import { School, Search, RefreshCw, Users, Layers, AlertCircle } from "lucide-react";

export const TeacherClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherApi.getClasses();
      setClasses(data);
    } catch {
      setError("Không thể tải danh sách lớp học phần.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const filtered = classes.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(s) ||
      c.name.toLowerCase().includes(s) ||
      (c.cohort && c.cohort.toLowerCase().includes(s)) ||
      c.major.name.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <School className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Lớp học phần Giảng dạy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Danh sách các lớp học phần và sĩ số sinh viên trong học kỳ này
          </p>
        </div>

        <button
          type="button"
          onClick={loadClasses}
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
            onClick={loadClasses}
            className="font-semibold underline hover:text-rose-800 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Filter / Search */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên lớp, khóa sinh viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Mã lớp</th>
                <th className="py-3 px-4">Tên lớp học phần</th>
                <th className="py-3 px-4">Khóa</th>
                <th className="py-3 px-4">Khoa / Chuyên ngành</th>
                <th className="py-3 px-4 text-center">Sĩ số</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách lớp học phần...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    Không tìm thấy lớp học nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {c.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {c.cohort || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {c.major.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-xs">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        {c._count.students} SV
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {c.status === "ACTIVE" ? "Đang mở" : "Đã đóng"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/teacher/students?classId=${c.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                          title="Xem danh sách sinh viên"
                        >
                          Sinh viên
                        </a>
                        <a
                          href="/create-quiz"
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs transition-colors"
                          title="Tạo đề thi cho lớp học"
                        >
                          + Tạo bài KT
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherClassesPage;
