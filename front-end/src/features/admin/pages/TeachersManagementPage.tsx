import React, { useEffect, useState } from "react";
import { adminApi, type AdminTeacher } from "../../../services/api/Admin.api";
import { majorApi } from "../../../services/api/Major.api";
import type { Major } from "../../../types/academic.interface";
import { useNotification } from "../../../components/Notification";
import {
  Users2,
  Search,
  RefreshCw,
  GraduationCap,
  ClipboardList,
  AlertCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { SearchableSelect } from "../../../components/ui/searchable-select";

export const TeachersManagementPage: React.FC = () => {
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [majorFilter, setMajorFilter] = useState("");

  const { showError } = useNotification();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [teacherList, majorList] = await Promise.all([
        adminApi.getTeachers({
          search: search || undefined,
          majorId: majorFilter || undefined,
        }),
        majorApi.getAdminMajors(),
      ]);
      setTeachers(teacherList);
      setMajors(majorList);
    } catch {
      setError("Không thể tải danh sách giảng viên.");
      showError("Lỗi", "Không thể tải danh sách giảng viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [majorFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Quản lý Giảng viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Danh sách cán bộ giảng dạy và bộ môn phụ trách trên toàn hệ thống HUBT
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
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
            onClick={loadData}
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
              placeholder="Tìm theo tên giảng viên, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Tìm
          </button>
        </form>

        <div className="sm:col-span-4">
          <SearchableSelect
            size="sm"
            placeholder="-- Tất cả chuyên ngành --"
            searchPlaceholder="Tìm chuyên ngành..."
            value={majorFilter}
            onChange={(val) => setMajorFilter(val)}
            options={[
              { value: "", label: "-- Tất cả chuyên ngành --" },
              ...majors.map((m) => ({
                value: m.id,
                label: `${m.code} — ${m.name}`,
                badge: m.code,
                subLabel: m.name,
              })),
            ]}
          />
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Họ và tên Giảng viên</th>
                <th className="py-3 px-4">Email liên hệ</th>
                <th className="py-3 px-4">Khoa / Bộ môn</th>
                <th className="py-3 px-4 text-center">Đề thi đã tạo</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-500" />
                    Đang tải danh sách giảng viên...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    Không tìm thấy giảng viên nào.
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {t.name?.charAt(0) || "G"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {t.name}
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase">
                            Giảng viên chính
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {t.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {t.major ? (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{t.major.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa gán khoa</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-xs">
                        <ClipboardList className="w-3.5 h-3.5 text-purple-500" />
                        {t._count.quizzes} đề thi
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                        }`}
                      >
                        {t.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                      </span>
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

export default TeachersManagementPage;
