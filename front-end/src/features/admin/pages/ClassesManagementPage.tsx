import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { academicClassApi } from "../../../services/api/AcademicClass.api";
import { majorApi } from "../../../services/api/Major.api";
import type { AcademicClass, Major } from "../../../types/academic.interface";
import { useNotification } from "../../../components/Notification";
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  X,
  GraduationCap,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  Unlock,
  PowerOff,
  CheckSquare,
  Square,
  Sparkles,
  Eye,
} from "lucide-react";
import { ImportClassesExcelModal } from "../components/ImportClassesExcelModal";
import { CohortManagementModal } from "../components/CohortManagementModal";
import { Pagination } from "../../../components/ui/pagination";
import { SearchableSelect } from "../../../components/ui/searchable-select";

export const ClassesManagementPage: React.FC = () => {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [search, setSearch] = useState("");
  const [majorFilter, setMajorFilter] = useState("");
  const [cohortFilter, setCohortFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Danh sách Khóa đào tạo dạng Option (K24 - K32 và các khóa thực tế trong DB)
  const cohortOptions = useMemo(() => {
    const dynamicCohorts = classes
      .map((c) => c.cohort?.trim())
      .filter((c): c is string => Boolean(c && c.length > 0));

    // Danh sách khóa chuẩn của HUBT
    const standardCohorts = [
      "K32", "K31", "K30", "K29", "K28", "K27", "K26", "K25", "K24", "K23", "K22", "K21", "K20"
    ];

    const set = new Set<string>();
    dynamicCohorts.forEach((c) => set.add(c));
    standardCohorts.forEach((c) => set.add(c));

    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
      if (numA !== numB) return numB - numA;
      return b.localeCompare(a);
    });
  }, [classes]);

  // Thống kê & Quản lý Khóa đào tạo
  const cohortStats = useMemo(() => {
    const map = new Map<string, { total: number; active: number; inactive: number }>();
    classes.forEach((c) => {
      const raw = c.cohort?.trim();
      const cohortName = raw
        ? raw.toUpperCase().startsWith("K")
          ? raw.toUpperCase()
          : `K${raw.replace(/\D/g, "") || raw}`
        : "Chưa phân khóa";

      const current = map.get(cohortName) || { total: 0, active: 0, inactive: 0 };
      current.total++;
      if (c.status === "ACTIVE") current.active++;
      else current.inactive++;
      map.set(cohortName, current);
    });

    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "Chưa phân khóa") return 1;
      if (b[0] === "Chưa phân khóa") return -1;
      const numA = parseInt(a[0].replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b[0].replace(/\D/g, ""), 10) || 0;
      return numB - numA;
    });
  }, [classes]);

  // Multi-select state
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [selectedCohortForModal, setSelectedCohortForModal] = useState<string | undefined>(undefined);
  const [deletingClass, setDeletingClass] = useState<AcademicClass | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    majorId: "",
    cohort: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    allowRegistration: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Student view modal state
  const [viewingClassStudents, setViewingClassStudents] = useState<{
    className: string;
    students: Array<{ id: string; name: string; email: string; studentCode?: string }>;
  } | null>(null);

  const { showSuccess, showError, showWarning } = useNotification();

  const loadData = async () => {
    try {
      setLoading(true);
      const [classRes, majorRes] = await Promise.all([
        academicClassApi.getAdminClasses({
          search: search || undefined,
          majorId: majorFilter || undefined,
          cohort: cohortFilter || undefined,
          status: statusFilter || undefined,
        }),
        majorApi.getAdminMajors(),
      ]);
      setClasses(classRes);
      setMajors(majorRes);
      // Clean up selected items that no longer exist
      const existingIds = new Set(classRes.map((c) => c.id));
      setSelectedClassIds((prev) => prev.filter((id) => existingIds.has(id)));
    } catch {
      showError("Lỗi tải dữ liệu", "Không thể tải danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [majorFilter, cohortFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map((c) => c.id));
    }
  };

  const handleToggleSelectClass = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkStatusChange = async (newStatus: "ACTIVE" | "INACTIVE") => {
    if (selectedClassIds.length === 0) return;
    try {
      setBatchActionLoading(true);
      const res = await academicClassApi.bulkUpdateStatus({
        ids: selectedClassIds,
        status: newStatus,
        allowRegistration: newStatus === "ACTIVE",
      });
      showSuccess(
        "Cập nhật thành công",
        `Đã chuyển ${res.updatedCount} lớp sang trạng thái ${
          newStatus === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"
        }`
      );
      loadData();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      showError("Lỗi cập nhật", apiErr.response?.data?.message || "Không thể cập nhật trạng thái các lớp đã chọn.");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBulkRegistrationChange = async (allow: boolean) => {
    if (selectedClassIds.length === 0) return;
    try {
      setBatchActionLoading(true);
      const res = await academicClassApi.bulkUpdateStatus({
        ids: selectedClassIds,
        allowRegistration: allow,
      });
      showSuccess(
        "Cập nhật thành công",
        `Đã ${allow ? "mở" : "khóa"} cổng đăng ký cho ${res.updatedCount} lớp học.`
      );
      loadData();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      showError("Lỗi cập nhật", apiErr.response?.data?.message || "Không thể cập nhật cổng đăng ký.");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedClassIds.length === 0) return;
    try {
      setDeletingLoading(true);
      const res = await academicClassApi.bulkDeleteClasses(selectedClassIds);
      showSuccess(
        "Thao tác hoàn tất",
        `Đã xóa vĩnh viễn ${res.hardDeleted} lớp và chuyển sang ngừng hoạt động ${res.softDeactivated} lớp đã có sinh viên.`
      );
      setSelectedClassIds([]);
      setIsBulkDeleteModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      showError("Lỗi xóa", apiErr.response?.data?.message || "Đã xảy ra lỗi khi xóa các lớp đã chọn.");
    } finally {
      setDeletingLoading(false);
    }
  };

  // Create / Edit modal handlers
  const handleOpenCreateModal = () => {
    setEditingClass(null);
    setFormData({
      code: "",
      name: "",
      majorId: majors[0]?.id || "",
      cohort: "K30",
      status: "ACTIVE",
      allowRegistration: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: AcademicClass) => {
    setEditingClass(c);
    setFormData({
      code: c.code,
      name: c.name,
      majorId: c.majorId,
      cohort: c.cohort || "",
      status: c.status,
      allowRegistration: c.allowRegistration,
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      showError("Lỗi", "Mã lớp không được để trống!");
      return;
    }
    if (!formData.name.trim()) {
      showError("Lỗi", "Tên lớp không được để trống!");
      return;
    }
    if (!formData.majorId) {
      showError("Lỗi", "Vui lòng chọn ngành cho lớp học!");
      return;
    }

    try {
      setSubmitting(true);
      if (editingClass) {
        await academicClassApi.updateClass(editingClass.id, formData);
        showSuccess("Thành công", `Đã cập nhật lớp ${formData.name}`);
      } else {
        await academicClassApi.createClass(formData);
        showSuccess("Thành công", `Đã tạo lớp mới ${formData.name}`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showError(
        "Lỗi thao tác",
        apiError.response?.data?.message || "Đã xảy ra lỗi khi lưu lớp học."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Single delete
  const confirmSingleDelete = async () => {
    if (!deletingClass) return;
    try {
      setDeletingLoading(true);
      const res = await academicClassApi.deleteClass(deletingClass.id);
      showSuccess("Đã xử lý", res.message);
      setDeletingClass(null);
      loadData();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      showError("Không thể xóa", apiError.response?.data?.message || "Đã xảy ra lỗi khi xóa lớp.");
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleToggleSingleStatus = async (c: AcademicClass) => {
    try {
      const newStatus = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await academicClassApi.updateClass(c.id, { status: newStatus });
      showSuccess(
        "Cập nhật trạng thái",
        `Đã chuyển trạng thái lớp ${c.code} sang ${newStatus === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}`
      );
      loadData();
    } catch {
      showError("Lỗi", "Không thể cập nhật trạng thái lớp.");
    }
  };

  const handleToggleSingleRegistration = async (c: AcademicClass) => {
    try {
      const newAllow = !c.allowRegistration;
      await academicClassApi.updateClass(c.id, { allowRegistration: newAllow });
      showSuccess(
        "Cập nhật đăng ký",
        `Đã ${newAllow ? "mở" : "khóa"} cổng đăng ký lớp ${c.code}`
      );
      loadData();
    } catch {
      showError("Lỗi", "Không thể cập nhật cấu hình đăng ký.");
    }
  };

  const handleViewStudents = async (c: AcademicClass) => {
    try {
      const detail = await academicClassApi.getClassStudents(c.id);
      setViewingClassStudents({
        className: `${c.code} — ${c.name}`,
        students: detail.students as Array<{ id: string; name: string; email: string; studentCode?: string }>,
      });
    } catch {
      showError("Lỗi", "Không thể tải danh sách sinh viên của lớp.");
    }
  };

  const isAllSelected = classes.length > 0 && selectedClassIds.length === classes.length;
  const isPartiallySelected = selectedClassIds.length > 0 && selectedClassIds.length < classes.length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Quản lý Lớp học phần
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý danh mục lớp thuộc từng ngành học tại HUBT, hỗ trợ chọn xóa nhiều, quản lý theo Khóa và nhập file Excel nhanh chóng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Nút Quản lý theo Khóa */}
          <button
            type="button"
            onClick={() => setIsCohortModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            Quản lý theo Khóa
          </button>

          {/* Nút Nhập Excel */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Nhập từ Excel
          </button>

          {/* Nút Thêm mới */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm lớp mới
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
              placeholder="Tìm theo mã lớp hoặc tên lớp..."
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
                setCurrentPage(1);
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

            {/* Lọc theo khóa dạng option */}
            <SearchableSelect
              size="sm"
              placeholder="Tất cả khóa"
              searchPlaceholder="Tìm khóa đào tạo..."
              value={cohortFilter}
              onChange={(val) => {
                setCohortFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "Tất cả khóa" },
                ...cohortOptions.map((c) => ({
                  value: c,
                  label: `Khóa ${c.startsWith("K") || c.startsWith("k") ? c.toUpperCase() : `K${c}`}`,
                  badge: c.startsWith("K") || c.startsWith("k") ? c.toUpperCase() : `K${c}`,
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
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "Tất cả trạng thái" },
                { value: "ACTIVE", label: "Đang hoạt động", badge: "ACTIVE" },
                { value: "INACTIVE", label: "Ngừng hoạt động", badge: "INACTIVE" },
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
                onClick={loadData}
                className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                title="Tải lại danh sách"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Cohort Quick Management Widget */}
      {cohortStats.length > 0 && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Thống kê & Quản lý theo Khóa đào tạo ({cohortStats.length} khóa)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCohortForModal(undefined);
                setIsCohortModalOpen(true);
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Quản lý tất cả khóa</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {cohortStats.map(([cohortName, stat]) => {
              const isSelected = cohortFilter === cohortName || (cohortFilter && cohortName.includes(cohortFilter));
              return (
                <div
                  key={cohortName}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (cohortFilter === cohortName) {
                        setCohortFilter("");
                      } else {
                        setCohortFilter(cohortName);
                      }
                      setCurrentPage(1);
                    }}
                    className="flex items-center gap-1.5 cursor-pointer font-bold"
                  >
                    <span>{cohortName}</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {stat.total} lớp
                    </span>
                  </button>

                  {stat.inactive > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-md bg-rose-100 dark:bg-rose-950/80 text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                      {stat.inactive} ngừng HĐ
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      {stat.active} HĐ
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCohortForModal(cohortName);
                      setIsCohortModalOpen(true);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={`Quản lý trạng thái cho toàn bộ ${cohortName}`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Batch Action Bar (Sticky khi có lớp được chọn) */}
      {selectedClassIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-indigo-600 px-5 py-3.5 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold text-xs">
              {selectedClassIds.length}
            </span>
            <span className="text-xs sm:text-sm font-semibold">
              Đang chọn <strong>{selectedClassIds.length}</strong> / {classes.length} lớp học
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={batchActionLoading}
              onClick={() => handleBulkStatusChange("ACTIVE")}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-medium backdrop-blur-xs transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Đang hoạt động
            </button>

            <button
              type="button"
              disabled={batchActionLoading}
              onClick={() => handleBulkStatusChange("INACTIVE")}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-medium backdrop-blur-xs transition-colors"
            >
              <PowerOff className="h-3.5 w-3.5" /> Ngừng hoạt động
            </button>

            <button
              type="button"
              disabled={batchActionLoading}
              onClick={() => handleBulkRegistrationChange(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-medium backdrop-blur-xs transition-colors"
            >
              <Unlock className="h-3.5 w-3.5" /> Mở ĐK
            </button>

            <button
              type="button"
              disabled={batchActionLoading}
              onClick={() => handleBulkRegistrationChange(false)}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-medium backdrop-blur-xs transition-colors"
            >
              <Lock className="h-3.5 w-3.5" /> Khóa ĐK
            </button>

            <button
              type="button"
              disabled={batchActionLoading}
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Xóa / Ngừng HĐ
            </button>

            <button
              type="button"
              onClick={() => setSelectedClassIds([])}
              className="flex items-center gap-1 rounded-xl bg-black/20 hover:bg-black/30 px-2.5 py-1.5 text-xs text-white/80 hover:text-white transition-colors ml-1"
            >
              <X className="h-3.5 w-3.5" /> Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Classes Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="w-10 py-3 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Mã lớp</th>
                <th className="py-3 px-4">Tên lớp</th>
                <th className="py-3 px-4">Ngành trực thuộc</th>
                <th className="py-3 px-4 text-center">Khóa</th>
                <th className="py-3 px-4 text-center">Số sinh viên</th>
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
                    Đang tải danh sách lớp học...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    Không tìm thấy lớp học nào phù hợp.
                  </td>
                </tr>
              ) : (
                classes
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((c) => {
                  const isSelected = selectedClassIds.includes(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectClass(c.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        <Link
                          to={`/admin/classes/${c.id}`}
                          className="hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                          title="Xem chi tiết lớp học"
                        >
                          {c.code}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <Link
                          to={`/admin/classes/${c.id}`}
                          className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Xem chi tiết lớp học"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                          {c.major?.name || "Chưa gắn ngành"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {c.cohort ? (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                            {c.cohort}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/admin/classes/${c.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 transition-all hover:scale-105 cursor-pointer shadow-2xs"
                          title="Xem chi tiết lớp và danh sách sinh viên"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {c.totalStudents || 0} SV
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSingleRegistration(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            c.allowRegistration
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {c.allowRegistration ? (
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
                          onClick={() => handleToggleSingleStatus(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            c.status === "ACTIVE"
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {c.status === "ACTIVE" ? "Hoạt động" : "Ngừng HĐ"}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/classes/${c.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Xem chi tiết & danh sách sinh viên"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Sửa lớp"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingClass(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Xóa/Ngừng hoạt động"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Phân trang Bắt buộc */}
        {classes.length > 0 && (
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(classes.length / pageSize)}
              totalItems={classes.length}
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

      {/* Modal Thêm / Chỉnh sửa lớp học */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingClass ? "Chỉnh sửa Lớp học phần" : "Thêm Lớp học phần mới"}
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
                    Mã lớp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CNTT30-01"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <SearchableSelect
                    label="Khóa đào tạo"
                    placeholder="Chọn khóa (VD: K28, K29...)"
                    searchPlaceholder="Tìm kiếm khóa..."
                    value={formData.cohort}
                    onChange={(val) => setFormData({ ...formData, cohort: val })}
                    options={cohortOptions.map((c) => {
                      const display = c.startsWith("K") || c.startsWith("k") ? c.toUpperCase() : `K${c}`;
                      return {
                        value: display,
                        label: `Khóa ${display}`,
                        badge: display,
                      };
                    })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên lớp học *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: CNTT K30.01"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <SearchableSelect
                  required
                  label="Ngành học trực thuộc"
                  placeholder="-- Chọn ngành học --"
                  searchPlaceholder="Tìm theo tên hoặc mã ngành..."
                  value={formData.majorId}
                  onChange={(val) => setFormData({ ...formData, majorId: val })}
                  options={majors.map((m) => ({
                    value: m.id,
                    label: `${m.code} - ${m.name}`,
                    badge: m.code,
                    subLabel: m.name,
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <SearchableSelect
                    label="Trạng thái"
                    placeholder="Chọn trạng thái"
                    searchPlaceholder="Tìm trạng thái..."
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
                  {submitting ? "Đang lưu..." : editingClass ? "Lưu thay đổi" : "Tạo lớp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa đơn lẻ */}
      {deletingClass && (
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
                <p className="text-xs text-slate-500">Lớp: <strong>{deletingClass.name} ({deletingClass.code})</strong></p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Nếu lớp học này đã có sinh viên đăng ký, hệ thống sẽ tự động chuyển sang trạng thái <strong>Ngừng hoạt động (INACTIVE)</strong> để bảo toàn toàn vẹn dữ liệu điểm thi.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingLoading}
                onClick={() => setDeletingClass(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={confirmSingleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                {deletingLoading ? "Đang xử lý..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa Hàng Loạt (Bulk Delete Confirmation) */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Xóa hàng loạt {selectedClassIds.length} lớp học
                </h3>
                <p className="text-xs text-slate-500">Thao tác áp dụng cho tất cả các lớp đang được chọn</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Các lớp <strong>chưa có sinh viên</strong> sẽ được xóa hoàn toàn khỏi cơ sở dữ liệu. Các lớp <strong>đã có sinh viên</strong> sẽ được chuyển sang trạng thái <strong>Ngừng hoạt động (INACTIVE)</strong> để bảo toàn lịch sử học tập.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingLoading}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
              >
                {deletingLoading ? "Đang xử lý..." : `Xác nhận xóa ${selectedClassIds.length} lớp`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem danh sách sinh viên trong lớp */}
      {viewingClassStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Danh sách Sinh viên
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {viewingClassStudents.className}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingClassStudents(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto space-y-2">
              {viewingClassStudents.students.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-6">
                  Chưa có sinh viên nào thuộc lớp này.
                </p>
              ) : (
                viewingClassStudents.students.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {st.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {st.studentCode ? `MSV: ${st.studentCode}` : "Chưa có MSV"} • {st.email}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhập Lớp từ Excel */}
      <ImportClassesExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadData}
        existingClasses={classes}
        availableMajors={majors}
      />

      {/* Modal Quản lý theo Khóa (K28, K29...) */}
      <CohortManagementModal
        isOpen={isCohortModalOpen}
        onClose={() => {
          setIsCohortModalOpen(false);
          setSelectedCohortForModal(undefined);
        }}
        onSuccess={loadData}
        existingClasses={classes}
        initialCohort={selectedCohortForModal}
      />
    </div>
  );
};

export default ClassesManagementPage;
