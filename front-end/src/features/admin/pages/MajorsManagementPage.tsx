import React, { useEffect, useState } from "react";
import { majorApi } from "../../../services/api/Major.api";
import type { Major } from "../../../types/academic.interface";
import { useNotification } from "../../../components/Notification";
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Layers,
  BookOpen,
  Users,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { ImportMajorsExcelModal } from "../components/ImportMajorsExcelModal";
import { Pagination } from "../../../components/ui/pagination";
import { SearchableSelect } from "../../../components/ui/searchable-select";

export const MajorsManagementPage: React.FC = () => {
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [regFilter, setRegFilter] = useState<string>("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingMajor, setDeletingMajor] = useState<Major | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    allowRegistration: true,
    displayOrder: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const { showSuccess, showError } = useNotification();

  const fetchMajors = async () => {
    try {
      setLoading(true);
      const data = await majorApi.getAdminMajors({
        search: search || undefined,
        status: statusFilter || undefined,
        allowRegistration: regFilter === "" ? undefined : regFilter === "true",
      });
      setMajors(data);
    } catch {
      showError("Lỗi tải dữ liệu", "Không thể tải danh sách ngành học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMajors();
  }, [statusFilter, regFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMajors();
  };

  const handleOpenCreateModal = () => {
    setEditingMajor(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      status: "ACTIVE",
      allowRegistration: true,
      displayOrder: majors.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (major: Major) => {
    setEditingMajor(major);
    setFormData({
      code: major.code,
      name: major.name,
      description: major.description || "",
      status: major.status,
      allowRegistration: major.allowRegistration,
      displayOrder: major.displayOrder,
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      showError("Dữ liệu không hợp lệ", "Mã ngành không được để trống!");
      return;
    }
    if (!formData.name.trim()) {
      showError("Dữ liệu không hợp lệ", "Tên ngành không được để trống!");
      return;
    }

    try {
      setSubmitting(true);
      if (editingMajor) {
        await majorApi.updateMajor(editingMajor.id, formData);
        showSuccess("Thành công", `Đã cập nhật ngành ${formData.name}`);
      } else {
        await majorApi.createMajor(formData);
        showSuccess("Thành công", `Đã thêm ngành mới ${formData.name}`);
      }
      setIsModalOpen(false);
      fetchMajors();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showError(
        editingMajor ? "Cập nhật thất bại" : "Tạo mới thất bại",
        apiError.response?.data?.message || "Đã xảy ra lỗi vui lòng thử lại!"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingMajor) return;
    try {
      setDeletingLoading(true);
      const res = await majorApi.deleteMajor(deletingMajor.id);
      showSuccess("Đã xử lý", res.message);
      setDeletingMajor(null);
      fetchMajors();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showError(
        "Không thể xóa",
        apiError.response?.data?.message || "Đã xảy ra lỗi khi xóa ngành."
      );
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleToggleStatus = async (major: Major) => {
    try {
      const newStatus = major.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await majorApi.updateMajor(major.id, { status: newStatus });
      showSuccess(
        "Cập nhật trạng thái",
        `Đã chuyển trạng thái ngành ${major.code} sang ${newStatus}`
      );
      fetchMajors();
    } catch {
      showError("Lỗi", "Không thể cập nhật trạng thái ngành.");
    }
  };

  const handleToggleRegistration = async (major: Major) => {
    try {
      const newAllow = !major.allowRegistration;
      await majorApi.updateMajor(major.id, { allowRegistration: newAllow });
      showSuccess(
        "Cập nhật đăng ký",
        `Đã ${newAllow ? "cho phép" : "chặn"} đăng ký ngành ${major.code}`
      );
      fetchMajors();
    } catch {
      showError("Lỗi", "Không thể cập nhật cấu hình đăng ký.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Quản lý Ngành học
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cấu hình danh mục ngành đào tạo tại HUBT, hỗ trợ nhập nhanh từ Excel và nhận diện cột tự động.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Nhập từ Excel
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm ngành mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã ngành hoặc tên ngành..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
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
                { value: "INACTIVE", label: "Ngừng hoạt động", badge: "INACTIVE" },
              ]}
            />

            <SearchableSelect
              size="sm"
              placeholder="Tất cả đăng ký"
              searchPlaceholder="Tìm cấu hình..."
              value={regFilter}
              onChange={(val) => {
                setRegFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "Tất cả đăng ký" },
                { value: "true", label: "Cho phép đăng ký", badge: "OPEN" },
                { value: "false", label: "Khóa đăng ký", badge: "LOCKED" },
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
                onClick={fetchMajors}
                className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                title="Tải lại danh sách"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Majors Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Thứ tự</th>
                <th className="py-3 px-4">Mã ngành</th>
                <th className="py-3 px-4">Tên ngành</th>
                <th className="py-3 px-4 text-center">Số lớp</th>
                <th className="py-3 px-4 text-center">Số SV</th>
                <th className="py-3 px-4 text-center">Số đề</th>
                <th className="py-3 px-4 text-center">Cho phép ĐK</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách ngành học...
                  </td>
                </tr>
              ) : majors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    Không tìm thấy ngành học nào phù hợp.
                  </td>
                </tr>
              ) : (
                majors
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-400">{m.displayOrder}</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {m.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {m.name}
                      </div>
                      {m.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {m.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {m.totalClasses || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {m.totalStudents || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        {m.totalQuizzes || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRegistration(m)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          m.allowRegistration
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {m.allowRegistration ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Cho phép
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Đang khóa
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(m)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          m.status === "ACTIVE"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        {m.status === "ACTIVE" ? "Hoạt động" : "Ngừng HĐ"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(m)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Sửa ngành"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMajor(m)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Xóa/Ngừng hoạt động"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Phân trang Bắt buộc */}
        {majors.length > 0 && (
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(majors.length / pageSize)}
              totalItems={majors.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Modal Thêm / Chỉnh sửa ngành học */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingMajor ? "Chỉnh sửa Ngành học" : "Thêm Ngành học mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã ngành *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CNTT, QTKD"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên ngành đào tạo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Công nghệ thông tin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả / Khoa chủ quản
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: Khoa Công nghệ thông tin - HUBT"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <SearchableSelect
                    label="Trạng thái hoạt động"
                    placeholder="Chọn trạng thái..."
                    searchPlaceholder="Tìm kiếm..."
                    value={formData.status}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        status: (val as "ACTIVE" | "INACTIVE") || "ACTIVE",
                      })
                    }
                    options={[
                      { value: "ACTIVE", label: "Hoạt động (ACTIVE)", badge: "ACTIVE" },
                      { value: "INACTIVE", label: "Ngừng hoạt động (INACTIVE)", badge: "INACTIVE" },
                    ]}
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.allowRegistration}
                      onChange={(e) =>
                        setFormData({ ...formData, allowRegistration: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Cho phép chọn khi đăng ký
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Đang lưu..." : editingMajor ? "Lưu thay đổi" : "Tạo ngành"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa / Vô hiệu hóa ngành */}
      {deletingMajor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Xác nhận xóa / Ngừng hoạt động
                </h3>
                <p className="text-xs text-slate-500">Ngành: <strong>{deletingMajor.name} ({deletingMajor.code})</strong></p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Nếu ngành này đã có sinh viên, lớp học hoặc đề thi liên quan, hệ thống sẽ tự động chuyển sang trạng thái <strong>Ngừng hoạt động (INACTIVE)</strong> để bảo toàn dữ liệu.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingLoading}
                onClick={() => setDeletingMajor(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                {deletingLoading ? "Đang xử lý..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhập Excel Thông minh */}
      <ImportMajorsExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchMajors}
        existingMajors={majors}
      />
    </div>
  );
};

export default MajorsManagementPage;
