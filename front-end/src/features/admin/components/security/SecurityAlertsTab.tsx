import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Globe,
  Filter,
} from "lucide-react";
import type { SecurityAlertItem } from "../../../../services/api/Security.api";
import { Button, Pagination } from "../../../../components/ui";

interface SecurityAlertsTabProps {
  alerts: SecurityAlertItem[];
  total: number;
  page: number;
  limit: number;
  statusFilter: string;
  severityFilter: string;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onStatusFilterChange: (status: string) => void;
  onSeverityFilterChange: (severity: string) => void;
  onRefresh: () => void;
  onUpdateAlert: (id: string, status: string, note?: string) => Promise<void>;
}

export const SecurityAlertsTab: React.FC<SecurityAlertsTabProps> = ({
  alerts,
  total,
  page,
  limit,
  statusFilter,
  severityFilter,
  loading,
  onPageChange,
  onLimitChange,
  onStatusFilterChange,
  onSeverityFilterChange,
  onRefresh,
  onUpdateAlert,
}) => {
  const [selectedAlertForAction, setSelectedAlertForAction] =
    useState<SecurityAlertItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>("RESOLVED");
  const [actionNote, setActionNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenActionModal = (alert: SecurityAlertItem) => {
    setSelectedAlertForAction(alert);
    setActionStatus(alert.status === "NEW" ? "ACKNOWLEDGED" : "RESOLVED");
    setActionNote(alert.resolutionNote || "");
  };

  const handleSubmitAction = async () => {
    if (!selectedAlertForAction) return;
    try {
      setSubmitting(true);
      await onUpdateAlert(selectedAlertForAction.id, actionStatus, actionNote);
      setSelectedAlertForAction(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Bộ lọc cảnh báo an ninh:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="NEW">Mới phát hiện (NEW)</option>
            <option value="ACKNOWLEDGED">Đã tiếp nhận (ACKNOWLEDGED)</option>
            <option value="RESOLVED">Đã xử lý (RESOLVED)</option>
            <option value="FALSE_POSITIVE">Báo động giả (FALSE_POSITIVE)</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => onSeverityFilterChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả mức độ</option>
            <option value="CRITICAL">Khẩn cấp (CRITICAL)</option>
            <option value="HIGH">Cao (HIGH)</option>
            <option value="WARNING">Cảnh báo (WARNING)</option>
            <option value="INFO">Thông tin (INFO)</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Alerts Grid / Cards */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs">
        {loading && alerts.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <span>Đang tải danh sách cảnh báo...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
            <span>Không có cảnh báo an ninh nào phù hợp.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const isResolved = alert.status === "RESOLVED" || alert.status === "FALSE_POSITIVE";

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    alert.severity === "CRITICAL"
                      ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10"
                      : alert.severity === "HIGH"
                      ? "border-orange-200 dark:border-orange-900/60 bg-orange-50/30 dark:bg-orange-950/10"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-[#0B0F19]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            alert.severity === "CRITICAL"
                              ? "bg-rose-500 text-white"
                              : alert.severity === "HIGH"
                              ? "bg-orange-500 text-white"
                              : alert.severity === "WARNING"
                              ? "bg-amber-500 text-white"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {alert.severity}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            alert.status === "NEW"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : alert.status === "ACKNOWLEDGED"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : alert.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {alert.status === "NEW"
                            ? "Mới phát hiện"
                            : alert.status === "ACKNOWLEDGED"
                            ? "Đang xử lý"
                            : alert.status === "RESOLVED"
                            ? "Đã giải quyết"
                            : "Báo động giả"}
                        </span>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {alert.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {alert.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap pt-1">
                        {alert.ipAddress && (
                          <span className="flex items-center gap-1 font-mono">
                            <Globe className="w-3.5 h-3.5" /> IP: {alert.ipAddress}
                          </span>
                        )}
                        {alert.user && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {alert.user.name || alert.user.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />{" "}
                          {new Date(alert.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>

                      {alert.resolutionNote && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                          <span className="font-bold">Ghi chú xử lý: </span>
                          <span>{alert.resolutionNote}</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 pt-1">
                      <Button
                        variant={isResolved ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => handleOpenActionModal(alert)}
                      >
                        {isResolved ? "Xem lại" : "Cập nhật xử lý"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit) || 1}
              totalItems={total}
              pageSize={limit}
              onPageChange={onPageChange}
              onPageSizeChange={onLimitChange}
              pageSizeOptions={[10, 15, 20]}
            />
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedAlertForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Cập nhật trạng thái xử lý cảnh báo
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {selectedAlertForAction.title}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {selectedAlertForAction.description}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Trạng thái xử lý:
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="ACKNOWLEDGED">Đang tiếp nhận & điều tra (ACKNOWLEDGED)</option>
                  <option value="RESOLVED">Đã ngăn chặn & khắc phục xong (RESOLVED)</option>
                  <option value="FALSE_POSITIVE">Báo động giả / Bỏ qua (FALSE_POSITIVE)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ghi chú hành động khắc phục:
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Ví dụ: Đã khóa IP kẻ tấn công, reset phiên đăng nhập của sinh viên..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedAlertForAction(null)}
                disabled={submitting}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitAction}
                disabled={submitting}
              >
                {submitting ? "Đang lưu..." : "Lưu kết quả"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
