import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { academicClassApi } from "../../../services/api/AcademicClass.api";
import { majorApi } from "../../../services/api/Major.api";
import type { AcademicClass, Major } from "../../../types/academic.interface";
import { useNotification } from "../../../components/Notification";
import { Pagination } from "../../../components/ui/pagination";
import { SearchableSelect } from "../../../components/ui/searchable-select";
import {
  Layers,
  GraduationCap,
  Users,
  Search,
  ArrowLeft,
  RefreshCw,
  Edit2,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  Clock,
  Mail,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  AlertTriangle,
} from "lucide-react";

interface StudentInClass {
  id: string;
  name: string;
  email: string;
  studentCode?: string | null;
  status?: string;
  role?: string;
  avatar?: string | null;
  createdAt: string;
}

export const ClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotification();

  const [classData, setClassData] = useState<AcademicClass | null>(null);
  const [students, setStudents] = useState<StudentInClass[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    code: "",
    name: "",
    majorId: "",
    cohort: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    allowRegistration: true,
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadClassDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [resClass, resMajors] = await Promise.all([
        academicClassApi.getClassStudents(id),
        majorApi.getAdminMajors(),
      ]);

      setClassData(resClass);
      setStudents((resClass.students as StudentInClass[]) || []);
      setMajors(resMajors);

      setEditFormData({
        code: resClass.code,
        name: resClass.name,
        majorId: resClass.majorId,
        cohort: resClass.cohort || "",
        status: (resClass.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
        allowRegistration: resClass.allowRegistration ?? true,
      });
    } catch (err: unknown) {
      console.error("Lỗi tải chi tiết lớp học:", err);
      showError("Không thể tải thông tin lớp", "Lớp học không tồn tại hoặc đã bị xóa.");
      navigate("/admin/classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassDetail();
  }, [id]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchSearch =
        !search.trim() ||
        st.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        st.email.toLowerCase().includes(search.trim().toLowerCase()) ||
        (st.studentCode && st.studentCode.toLowerCase().includes(search.trim().toLowerCase()));

      const matchStatus = !statusFilter || st.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [students, search, statusFilter]);

  // Paginated students
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;

  // Toggle Class Status
  const handleToggleStatus = async () => {
    if (!classData) return;
    try {
      const newStatus = classData.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await academicClassApi.updateClass(classData.id, { status: newStatus });
      showSuccess(
        "Cập nhật trạng thái",
        `Đã chuyển lớp ${classData.code} sang ${newStatus === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}`
      );
      loadClassDetail();
    } catch {
      showError("Lỗi", "Không thể cập nhật trạng thái lớp học.");
    }
  };

  // Toggle Registration
  const handleToggleRegistration = async () => {
    if (!classData) return;
    try {
      const newAllow = !classData.allowRegistration;
      await academicClassApi.updateClass(classData.id, { allowRegistration: newAllow });
      showSuccess(
        "Cập nhật cổng đăng ký",
        `Đã ${newAllow ? "mở" : "khóa"} cổng đăng ký lớp ${classData.code}`
      );
      loadClassDetail();
    } catch {
      showError("Lỗi", "Không thể cập nhật cấu hình đăng ký.");
    }
  };

  // Submit Edit Class
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classData) return;

    if (!editFormData.code.trim() || !editFormData.name.trim()) {
      showWarning("Thiếu thông tin", "Mã lớp và tên lớp không được để trống!");
      return;
    }

    try {
      setSubmittingEdit(true);
      await academicClassApi.updateClass(classData.id, editFormData);
      showSuccess("Thành công", `Đã cập nhật thông tin lớp ${editFormData.name}`);
      setIsEditModalOpen(false);
      loadClassDetail();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showError(
        "Lỗi thao tác",
        apiError.response?.data?.message || "Đã xảy ra lỗi khi cập nhật lớp học."
      );
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Export Students to CSV
  const handleExportCSV = () => {
    if (!classData || students.length === 0) {
      showWarning("Không có dữ liệu", "Lớp học chưa có sinh viên nào để xuất dữ liệu.");
      return;
    }

    const headers = ["STT", "Họ và tên", "Mã sinh viên (MSV)", "Email", "Trạng thái", "Ngày tham gia"];
    const rows = students.map((st, idx) => [
      idx + 1,
      `"${st.name}"`,
      `"${st.studentCode || ''}"`,
      `"${st.email}"`,
      `"${st.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa'}"`,
      `"${new Date(st.createdAt).toLocaleDateString('vi-VN')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Danh_sach_sinh_vien_${classData.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess("Đã xuất tệp", `Đã xuất danh sách ${students.length} sinh viên ra file CSV.`);
  };

  if (loading && !classData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-500">Đang tải thông tin chi tiết lớp học...</p>
      </div>
    );
  }

  if (!classData) return null;

  const activeStudentsCount = students.filter((s) => s.status !== "INACTIVE").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/admin/classes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh mục Lớp học</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Lớp {classData.code}
            </h1>
            <span className="text-lg text-slate-400 font-normal">—</span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {classData.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Chỉnh sửa lớp</span>
          </button>

          <button
            onClick={handleToggleRegistration}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer ${
              classData.allowRegistration
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
            }`}
          >
            {classData.allowRegistration ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa cổng ĐK</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở cổng ĐK</span>
              </>
            )}
          </button>

          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer ${
              classData.status === "ACTIVE"
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {classData.status === "ACTIVE" ? (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Ngừng hoạt động</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kích hoạt lớp</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng sinh viên */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng số sinh viên
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {students.length}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>{activeStudentsCount} tài khoản hoạt động</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Ngành học */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1 min-w-0 pr-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ngành đào tạo
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate" title={classData.major?.name}>
              {classData.major?.name || "Chưa gắn ngành"}
            </div>
            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
              Mã: {classData.major?.code || "N/A"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Niên khóa */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Khóa đào tạo
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {classData.cohort || "—"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Chương trình đại học HUBT</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Trạng thái & Đăng ký */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Trạng thái & Đăng ký
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  classData.status === "ACTIVE"
                    ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400"
                }`}
              >
                {classData.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  classData.allowRegistration
                    ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {classData.allowRegistration ? "Mở ĐK" : "Khóa ĐK"}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Cập nhật:{" "}
              {classData.updatedAt
                ? new Date(classData.updatedAt).toLocaleDateString("vi-VN")
                : classData.createdAt
                ? new Date(classData.createdAt).toLocaleDateString("vi-VN")
                : "Hôm nay"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Students List Section */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        {/* Search and Filters Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Danh sách Sinh viên trong lớp ({filteredStudents.length} / {students.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên, MSV, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="w-48">
              <SearchableSelect
                size="sm"
                placeholder="Tất cả trạng thái"
                searchPlaceholder="Tìm trạng thái..."
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "Tất cả trạng thái" },
                  { value: "ACTIVE", label: "Đang hoạt động", badge: "ACTIVE" },
                  { value: "INACTIVE", label: "Bị khóa / Ngừng", badge: "INACTIVE" },
                ]}
              />
            </div>

            <button
              onClick={loadClassDetail}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Sinh viên</th>
                <th className="py-3 px-4">Mã sinh viên (MSV)</th>
                <th className="py-3 px-4">Email tài khoản</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      Chưa có sinh viên nào trong lớp này.
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Sinh viên khi đăng ký tài khoản và chọn mã lớp <strong>{classData.code}</strong> sẽ tự động xuất hiện trong danh sách này.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st, idx) => {
                  const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                  const initials = st.name
                    ? st.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(-2)
                        .join("")
                        .toUpperCase()
                    : "SV";

                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">
                        {itemIndex}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {st.name}
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {st.role || "STUDENT"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {st.studentCode ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60">
                            {st.studentCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{st.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            st.status === "INACTIVE"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200"
                          }`}
                        >
                          {st.status === "INACTIVE" ? "Đã khóa" : "Hoạt động"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(st.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Hiển thị <strong>{paginatedStudents.length}</strong> trên tổng số <strong>{filteredStudents.length}</strong> sinh viên
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Modal Chỉnh sửa thông tin Lớp học */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Chỉnh sửa Lớp {classData.code}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã lớp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên lớp học phần <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <SearchableSelect
                    required
                    label="Ngành học trực thuộc"
                    placeholder="Chọn ngành học..."
                    searchPlaceholder="Tìm theo tên hoặc mã ngành..."
                    value={editFormData.majorId}
                    onChange={(val) => setEditFormData({ ...editFormData, majorId: val })}
                    options={majors.map((m) => ({
                      value: m.id,
                      label: `${m.code} - ${m.name}`,
                      badge: m.code,
                      subLabel: m.name,
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                    Khóa đào tạo (VD: K28, K29)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: K28"
                    value={editFormData.cohort}
                    onChange={(e) => setEditFormData({ ...editFormData, cohort: e.target.value.toUpperCase() })}
                    className="w-full min-h-[42px] px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <SearchableSelect
                    label="Trạng thái đào tạo"
                    placeholder="Chọn trạng thái..."
                    searchPlaceholder="Tìm trạng thái..."
                    value={editFormData.status}
                    onChange={(val) =>
                      setEditFormData({
                        ...editFormData,
                        status: (val as "ACTIVE" | "INACTIVE") || "ACTIVE",
                      })
                    }
                    options={[
                      { value: "ACTIVE", label: "Đang hoạt động", badge: "ACTIVE" },
                      { value: "INACTIVE", label: "Ngừng hoạt động / Tốt nghiệp", badge: "INACTIVE" },
                    ]}
                  />
                </div>

                <div>
                  <SearchableSelect
                    label="Cổng tự đăng ký"
                    placeholder="Chọn trạng thái cổng..."
                    searchPlaceholder="Tìm kiếm..."
                    value={editFormData.allowRegistration ? "true" : "false"}
                    onChange={(val) => setEditFormData({ ...editFormData, allowRegistration: val === "true" })}
                    options={[
                      { value: "true", label: "Mở cổng đăng ký", badge: "OPEN" },
                      { value: "false", label: "Khóa cổng đăng ký", badge: "LOCKED" },
                    ]}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={submittingEdit}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetailPage;
