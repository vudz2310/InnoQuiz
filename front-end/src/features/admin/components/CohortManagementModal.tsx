import React, { useState } from "react";
import {
  GraduationCap,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  PowerOff,
  Layers,
} from "lucide-react";
import type { AcademicClass } from "../../../types/academic.interface";
import { academicClassApi } from "../../../services/api/AcademicClass.api";
import { useNotification } from "../../../components/Notification";

interface CohortManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingClasses: AcademicClass[];
  initialCohort?: string;
}

export const CohortManagementModal: React.FC<CohortManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingClasses,
  initialCohort,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();

  // Extract distinct cohorts from existing classes
  const existingCohorts = Array.from(
    new Set(
      existingClasses
        .map((c) => c.cohort?.trim())
        .filter((c): c is string => Boolean(c && c.length > 0))
    )
  ).sort((a, b) => b.localeCompare(a));

  const [selectedCohort, setSelectedCohort] = useState<string>(
    initialCohort || existingCohorts[0] || "K28"
  );
  const [customCohortInput, setCustomCohortInput] = useState<string>("");
  const [actionType, setActionType] = useState<
    | "GRADUATE_DEACTIVATE"
    | "ACTIVATE_ALL"
    | "LOCK_REGISTRATION"
    | "UNLOCK_REGISTRATION"
  >("GRADUATE_DEACTIVATE");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialCohort) {
      setSelectedCohort(initialCohort);
      setCustomCohortInput("");
    }
  }, [initialCohort]);

  if (!isOpen) return null;

  const targetCohort = customCohortInput.trim() || selectedCohort;
  const matchingClasses = existingClasses.filter(
    (c) =>
      c.cohort &&
      c.cohort.toLowerCase().includes(targetCohort.toLowerCase())
  );

  const handleApplyCohortAction = async () => {
    if (!targetCohort) {
      showWarning("Chưa chọn Khóa", "Vui lòng chọn hoặc nhập Khóa học cần xử lý!");
      return;
    }

    try {
      setSubmitting(true);
      let payload: {
        cohort: string;
        status?: "ACTIVE" | "INACTIVE";
        allowRegistration?: boolean;
      };

      if (actionType === "GRADUATE_DEACTIVATE") {
        payload = {
          cohort: targetCohort,
          status: "INACTIVE",
          allowRegistration: false,
        };
      } else if (actionType === "ACTIVATE_ALL") {
        payload = {
          cohort: targetCohort,
          status: "ACTIVE",
          allowRegistration: true,
        };
      } else if (actionType === "LOCK_REGISTRATION") {
        payload = {
          cohort: targetCohort,
          allowRegistration: false,
        };
      } else {
        payload = {
          cohort: targetCohort,
          allowRegistration: true,
        };
      }

      const res = await academicClassApi.bulkUpdateStatus(payload);
      showSuccess(
        "Cập nhật Khóa thành công!",
        `Đã áp dụng thay đổi cho ${res.updatedCount} lớp học thuộc ${res.target}.`
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      showError(
        "Lỗi cập nhật",
        apiErr.response?.data?.message || "Đã xảy ra lỗi khi cập nhật trạng thái Khóa học."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Quản lý trạng thái theo Khóa học
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xử lý đồng loạt cho toàn bộ các lớp thuộc Khóa (VD: Khóa 28, 29 đã tốt nghiệp)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Cohort Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Chọn hoặc nhập Niên khóa cần thao tác:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedCohort}
                onChange={(e) => {
                  setSelectedCohort(e.target.value);
                  setCustomCohortInput("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {existingCohorts.map((ch) => (
                  <option key={ch} value={ch}>
                    Khóa {ch}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Hoặc nhập: 28, 29, K28..."
                value={customCohortInput}
                onChange={(e) => setCustomCohortInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Layers className="h-4 w-4 text-indigo-500" />
                Số lớp thuộc <strong>{targetCohort || "..."}</strong>:
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {matchingClasses.length} lớp học
              </span>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Hành động áp dụng cho toàn bộ Khóa:
            </label>

            <div
              onClick={() => setActionType("GRADUATE_DEACTIVATE")}
              className={`flex items-start gap-3 rounded-xl p-3.5 border transition-all cursor-pointer ${
                actionType === "GRADUATE_DEACTIVATE"
                  ? "border-rose-300 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/30"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
              }`}
            >
              <input
                type="radio"
                name="actionType"
                checked={actionType === "GRADUATE_DEACTIVATE"}
                onChange={() => setActionType("GRADUATE_DEACTIVATE")}
                className="mt-0.5 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <PowerOff className="h-3.5 w-3.5 text-rose-600" />
                  Đã ra trường / Tốt nghiệp (Ngừng hoạt động + Khóa đăng ký)
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Chuyển tất cả lớp của Khóa sang <strong>INACTIVE</strong> và khóa cổng tự đăng ký. Dữ liệu lịch sử và điểm số của sinh viên vẫn được bảo toàn nguyên vẹn.
                </p>
              </div>
            </div>

            <div
              onClick={() => setActionType("ACTIVATE_ALL")}
              className={`flex items-start gap-3 rounded-xl p-3.5 border transition-all cursor-pointer ${
                actionType === "ACTIVATE_ALL"
                  ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
              }`}
            >
              <input
                type="radio"
                name="actionType"
                checked={actionType === "ACTIVATE_ALL"}
                onChange={() => setActionType("ACTIVATE_ALL")}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Kích hoạt lại (Đang hoạt động + Mở đăng ký)
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Đưa toàn bộ lớp của Khóa về trạng thái <strong>ACTIVE</strong> cho phép sinh viên đăng nhập và làm bài bình thường.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div
                onClick={() => setActionType("LOCK_REGISTRATION")}
                className={`flex items-center gap-2 rounded-xl p-2.5 border transition-all cursor-pointer ${
                  actionType === "LOCK_REGISTRATION"
                    ? "border-amber-300 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/30"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="actionType"
                  checked={actionType === "LOCK_REGISTRATION"}
                  onChange={() => setActionType("LOCK_REGISTRATION")}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Lock className="h-3.5 w-3.5 text-amber-600" /> Khóa cổng đăng ký
                </span>
              </div>

              <div
                onClick={() => setActionType("UNLOCK_REGISTRATION")}
                className={`flex items-center gap-2 rounded-xl p-2.5 border transition-all cursor-pointer ${
                  actionType === "UNLOCK_REGISTRATION"
                    ? "border-indigo-300 bg-indigo-50/60 dark:border-indigo-900/60 dark:bg-indigo-950/30"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="actionType"
                  checked={actionType === "UNLOCK_REGISTRATION"}
                  onChange={() => setActionType("UNLOCK_REGISTRATION")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Unlock className="h-3.5 w-3.5 text-indigo-600" /> Mở cổng đăng ký
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleApplyCohortAction}
            disabled={submitting || matchingClasses.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang cập nhật...
              </>
            ) : (
              <span>Áp dụng cho {matchingClasses.length} lớp</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CohortManagementModal;
