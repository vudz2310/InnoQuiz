import React from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldAlert,
  AlertTriangle,
  Radio,
} from "lucide-react";
import type { SecurityEventItem } from "../../../../services/api/Security.api";
import { Button, Pagination } from "../../../../components/ui";

interface SecurityEventsTabProps {
  events: SecurityEventItem[];
  total: number;
  page: number;
  limit: number;
  search: string;
  selectedEventType: string;
  selectedRiskLevel: string;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearchChange: (val: string) => void;
  onEventTypeChange: (val: string) => void;
  onRiskLevelChange: (val: string) => void;
  onRefresh: () => void;
  onSelectEventDetail: (event: SecurityEventItem) => void;
}

export const SecurityEventsTab: React.FC<SecurityEventsTabProps> = ({
  events,
  total,
  page,
  limit,
  search,
  selectedEventType,
  selectedRiskLevel,
  loading,
  onPageChange,
  onLimitChange,
  onSearchChange,
  onEventTypeChange,
  onRiskLevelChange,
  onRefresh,
  onSelectEventDetail,
}) => {
  const eventTypes = [
    { label: "Tất cả loại sự kiện", value: "" },
    { label: "Đăng nhập thành công", value: "LOGIN_SUCCESS" },
    { label: "Đăng nhập thất bại", value: "LOGIN_FAILED" },
    { label: "Đăng ký tài khoản", value: "REGISTER" },
    { label: "Gửi mã OTP", value: "OTP_SENT" },
    { label: "Xác thực OTP sai", value: "OTP_FAILED" },
    { label: "Đổi mật khẩu", value: "PASSWORD_CHANGED" },
    { label: "Thu hồi phiên", value: "SESSION_REVOKED" },
    { label: "Vượt giới hạn Rate Limit", value: "RATE_LIMIT_EXCEEDED" },
    { label: "Quét dữ liệu bất thường", value: "SUSPICIOUS_SCRAPING_DETECTED" },
    { label: "Từ chối truy cập", value: "ACCESS_DENIED" },
    { label: "Thao tác quản trị viên", value: "ADMIN_ACTION" },
  ];

  const riskLevels = [
    { label: "Tất cả mức độ", value: "" },
    { label: "Nghiêm trọng (CRITICAL)", value: "CRITICAL" },
    { label: "Cao (HIGH)", value: "HIGH" },
    { label: "Trung bình (MEDIUM)", value: "MEDIUM" },
    { label: "An toàn / Thấp (LOW)", value: "LOW" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo IP, Email, ID người dùng..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedEventType}
            onChange={(e) => onEventTypeChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {eventTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={selectedRiskLevel}
            onChange={(e) => onRiskLevelChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {riskLevels.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>
                {lvl.label}
              </option>
            ))}
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

      {/* Events Table Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs">
        {loading && events.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <span>Đang tải nhật ký sự kiện...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <Radio className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <span>Không tìm thấy sự kiện an ninh nào phù hợp với bộ lọc.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Thời gian</th>
                  <th className="py-3 px-3">Loại sự kiện</th>
                  <th className="py-3 px-3">Người dùng / Email</th>
                  <th className="py-3 px-3">Địa chỉ IP</th>
                  <th className="py-3 px-3">Thiết bị</th>
                  <th className="py-3 px-3">Mức rủi ro</th>
                  <th className="py-3 px-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(event.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {event.eventType}
                      </span>
                      {event.endpoint && (
                        <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          {event.endpoint}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {event.userEmail || "Khách / Không định danh"}
                      </div>
                      {event.user?.studentCode && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                          {event.user.studentCode}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {event.ipAddress}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                      {event.deviceInfo || "Desktop"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          event.riskLevel === "CRITICAL"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : event.riskLevel === "HIGH"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                            : event.riskLevel === "MEDIUM"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {event.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectEventDetail(event)}
                        className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 font-semibold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              pageSizeOptions={[10, 15, 20, 50]}
            />
          </div>
        )}
      </div>
    </div>
  );
};
