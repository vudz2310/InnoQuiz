import React, { useEffect, useState } from "react";
import { adminApi } from "../../../services/api/Admin.api";
import { majorApi } from "../../../services/api/Major.api";
import { academicClassApi } from "../../../services/api/AcademicClass.api";
import type { User } from "../../../types/auth.interface";
import type { Major, AcademicClass } from "../../../types/academic.interface";
import { useNotification } from "../../../components/Notification";
import {
  Users2,
  Search,
  RefreshCw,
  Edit2,
  Lock,
  Unlock,
  X,
  GraduationCap,
  Layers,
} from "lucide-react";
import { Pagination } from "../../../components/ui/pagination";
import { SearchableSelect } from "../../../components/ui/searchable-select";

export const StudentsManagementPage: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [allClasses, setAllClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [majorFilter, setMajorFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Edit Academic Info Modal State
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [modalMajorId, setModalMajorId] = useState("");
  const [modalClassId, setModalClassId] = useState("");
  const [modalStudentCode, setModalStudentCode] = useState("");
  const [classesForModalMajor, setClassesForModalMajor] = useState<
    AcademicClass[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const { showSuccess, showError } = useNotification();

  const loadData = async (currentPage = page, currentLimit = limit) => {
    try {
      setLoading(true);
      const [studentRes, majorRes, classRes] = await Promise.all([
        adminApi.getStudents({
          search: search || undefined,
          majorId: majorFilter || undefined,
          classId: classFilter || undefined,
          status: statusFilter || undefined,
          page: currentPage,
          limit: currentLimit,
        }),
        majorApi.getAdminMajors(),
        academicClassApi.getAdminClasses(),
      ]);

      setStudents(studentRes.items);
      setTotalPages(studentRes.totalPages || 1);
      setTotalStudents(studentRes.total);
      setMajors(majorRes);
      setAllClasses(classRes);
    } catch {
      showError("Lỗi", "Không thể tải danh sách sinh viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
    setPage(1);
  }, [majorFilter, classFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
    setPage(1);
  };

  const handleOpenEditModal = (student: User) => {
    setEditingStudent(student);
    setModalMajorId(student.majorId || "");
    setModalClassId(student.classId || "");
    setModalStudentCode(student.studentCode || "");

    // Load các lớp thuộc ngành của sinh viên này
    if (student.majorId) {
      setClassesForModalMajor(
        allClasses.filter(
          (c) => c.majorId === student.majorId && c.status === "ACTIVE",
        ),
      );
    } else {
      setClassesForModalMajor([]);
    }
  };

  const handleModalMajorChange = (newMajorId: string) => {
    setModalMajorId(newMajorId);
    // Nếu đổi ngành, lọc lại danh sách lớp và reset lớp đã chọn
    const filtered = allClasses.filter(
      (c) => c.majorId === newMajorId && c.status === "ACTIVE",
    );
    setClassesForModalMajor(filtered);
    setModalClassId("");
  };

  const handleSaveAcademicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setSubmitting(true);
      await adminApi.updateStudentAcademicInfo(editingStudent.id, {
        majorId: modalMajorId || undefined,
        classId: modalClassId || null,
        studentCode: modalStudentCode,
      });

      showSuccess(
        "Thành công",
        `Đã cập nhật thông tin học tập của sinh viên ${editingStudent.name}`,
      );
      setEditingStudent(null);
      loadData(page);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showError(
        "Cập nhật thất bại",
        apiError.response?.data?.message ||
          "Đã xảy ra lỗi khi lưu thông tin học tập.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Status toggle confirmation state
  const [togglingStudent, setTogglingStudent] = useState<User | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const confirmToggleStatus = async () => {
    if (!togglingStudent) return;
    const nextStatus =
      togglingStudent.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
    const actionText = nextStatus === "BLOCKED" ? "khóa" : "mở khóa";

    try {
      setToggleLoading(true);
      await adminApi.updateStudentStatus(togglingStudent.id, nextStatus);
      showSuccess(
        "Thành công",
        `Đã ${actionText} tài khoản của ${togglingStudent.name}`,
      );
      setTogglingStudent(null);
      loadData(page);
    } catch {
      showError("Lỗi", `Không thể ${actionText} tài khoản.`);
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Quản lý Sinh viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng số:{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {totalStudents}
            </span>{" "}
            sinh viên. Quản lý hồ sơ học thuật, phân bổ lớp và kiểm soát trạng
            thái tài khoản.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, mã sinh viên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 flex-1">
            {/* Lọc theo ngành */}
            <SearchableSelect
              size="sm"
              placeholder="Tất cả ngành"
              searchPlaceholder="Tìm ngành học..."
              value={majorFilter}
              onChange={(val) => {
                setMajorFilter(val);
                setClassFilter("");
                setPage(1);
              }}
              options={[
                { value: "", label: "Tất cả ngành" },
                ...majors.map((m) => ({
                  value: m.id,
                  label: `${m.code} - ${m.name}`,
                  badge: m.code,
                  subLabel: m.name,
                })),
              ]}
            />

            {/* Lọc theo lớp */}
            <SearchableSelect
              size="sm"
              placeholder="Tất cả lớp"
              searchPlaceholder="Tìm lớp học..."
              value={classFilter}
              onChange={(val) => {
                setClassFilter(val);
                setPage(1);
              }}
              options={[
                { value: "", label: "Tất cả lớp" },
                ...allClasses
                  .filter((c) => !majorFilter || c.majorId === majorFilter)
                  .map((c) => ({
                    value: c.id,
                    label: `${c.code} - ${c.name}`,
                    badge: c.code,
                    subLabel: c.cohort ? `Khóa ${c.cohort}` : undefined,
                  })),
              ]}
            />

            {/* Lọc theo trạng thái */}
            <SearchableSelect
              size="sm"
              placeholder="Tất cả trạng thái"
              searchPlaceholder="Tìm trạng thái..."
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[
                { value: "", label: "Tất cả trạng thái" },
                { value: "ACTIVE", label: "Hoạt động", badge: "ACTIVE" },
                { value: "BLOCKED", label: "Bị khóa", badge: "BLOCKED" },
              ]}
            />

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                Tìm kiếm
              </button>

              <button
                type="button"
                onClick={() => loadData(page)}
                className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                title="Tải lại"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã sinh viên</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Ngành đào tạo</th>
                <th className="py-3 px-4">Lớp học</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách sinh viên...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    Không tìm thấy sinh viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {st.studentCode ? (
                        st.studentCode
                      ) : (
                        <span className="text-slate-400 text-xs italic">
                          Chưa có
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {st.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs font-mono">
                      {st.email}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.major ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {st.major.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">
                          Chưa chọn
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.academicClass ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                          <Layers className="w-3.5 h-3.5" />
                          {st.academicClass.name}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                          Chưa gán lớp
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          st.status === "BLOCKED"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {st.status === "BLOCKED" ? "Bị khóa" : "Hoạt động"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(st)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          title="Gán / Chuyển lớp"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Gán lớp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTogglingStudent(st)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            st.status === "BLOCKED"
                              ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          }`}
                          title={
                            st.status === "BLOCKED"
                              ? "Mở khóa tài khoản"
                              : "Khóa tài khoản"
                          }
                        >
                          {st.status === "BLOCKED" ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalStudents > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalStudents}
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

      {/* Modal Chỉnh sửa Ngành / Gán Lớp / Chuyển Lớp */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Phân bổ Lớp & Ngành học
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  Sinh viên: {editingStudent.name} ({editingStudent.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAcademicInfo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã sinh viên
                </label>
                <input
                  type="text"
                  placeholder="Nhập mã sinh viên "
                  value={modalStudentCode}
                  onChange={(e) => setModalStudentCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Ngành đào tạo"
                  placeholder="-- Chọn ngành học --"
                  searchPlaceholder="Tìm theo tên hoặc mã ngành..."
                  value={modalMajorId}
                  onChange={(val) => handleModalMajorChange(val)}
                  options={majors.map((m) => ({
                    value: m.id,
                    label: `${m.code} - ${m.name}`,
                    badge: m.code,
                    subLabel: m.name,
                  }))}
                />
              </div>

              <div>
                <SearchableSelect
                  label="Gán lớp học"
                  placeholder={modalMajorId ? "-- Chọn lớp học phần --" : "Vui lòng chọn ngành trước"}
                  searchPlaceholder="Tìm lớp theo mã hoặc tên..."
                  disabled={!modalMajorId}
                  value={modalClassId}
                  onChange={(val) => setModalClassId(val)}
                  options={[
                    { value: "", label: "-- Chưa chọn lớp (để trống) --" },
                    ...classesForModalMajor.map((c) => ({
                      value: c.id,
                      label: `${c.code} - ${c.name} ${c.cohort ? `(${c.cohort})` : ""}`,
                      badge: c.code,
                      subLabel: c.cohort ? `Khóa ${c.cohort}` : undefined,
                    })),
                  ]}
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Chỉ hiển thị các lớp đang hoạt động thuộc ngành đã chọn.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Khóa / Mở khóa tài khoản sinh viên */}
      {togglingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  togglingStudent.status === "BLOCKED"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                }`}
              >
                {togglingStudent.status === "BLOCKED" ? (
                  <Unlock className="w-6 h-6" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {togglingStudent.status === "BLOCKED"
                    ? "Xác nhận mở khóa tài khoản"
                    : "Xác nhận khóa tài khoản"}
                </h3>
                <p className="text-xs text-slate-500">
                  Sinh viên: <strong>{togglingStudent.name}</strong> (
                  {togglingStudent.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {togglingStudent.status === "BLOCKED"
                ? "Sau khi mở khóa, sinh viên có thể đăng nhập vào hệ thống và tham gia các bài kiểm tra bình thường."
                : "Khi bị khóa, sinh viên sẽ không thể đăng nhập hoặc làm bài thi cho đến khi được mở khóa lại."}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={toggleLoading}
                onClick={() => setTogglingStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={toggleLoading}
                onClick={confirmToggleStatus}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors disabled:opacity-60 ${
                  togglingStudent.status === "BLOCKED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {toggleLoading
                  ? "Đang xử lý..."
                  : togglingStudent.status === "BLOCKED"
                    ? "Mở khóa tài khoản"
                    : "Khóa tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManagementPage;
