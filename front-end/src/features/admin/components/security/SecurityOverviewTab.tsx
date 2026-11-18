import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Activity,
  UserCheck,
  UserX,
  KeyRound,
  FileText,
  Clock,
  Radio,
  Server,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import type {
  SecurityOverviewResponse,
  SecurityEventItem,
  SecurityAlertItem,
} from "../../../../services/api/Security.api";
import { Button } from "../../../../components/ui";

interface SecurityOverviewTabProps {
  overview: SecurityOverviewResponse | null;
  loading: boolean;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onRefresh: () => void;
  onNavigateTab: (tab: "events" | "alerts" | "identifiers" | "settings") => void;
  onSelectEventDetail: (event: SecurityEventItem) => void;
}

export const SecurityOverviewTab: React.FC<SecurityOverviewTabProps> = ({
  overview,
  loading,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  onNavigateTab,
  onSelectEventDetail,
}) => {
  if (loading && !overview) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Đang tổng hợp dữ liệu an ninh...</p>
      </div>
    );
  }

  const stats = overview?.stats;

  const statCards = [
    {
      title: "Đăng nhập thành công",
      value: stats?.totalLogins ?? 0,
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40",
      sub: `Tỷ lệ thành công: ${stats?.loginSuccessRate ?? 100}%`,
    },
    {
      title: "Đăng nhập thất bại",
      value: stats?.failedLogins ?? 0,
      icon: UserX,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40",
      sub: "Cảnh báo Brute-force & sai mật khẩu",
    },
    {
      title: "Cảnh báo đang mở",
      value: stats?.activeAlertsCount ?? 0,
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40",
      sub: "Nguy cơ cần admin xử lý",
    },
    {
      title: "Thực thể bị chặn",
      value: stats?.blockedCount ?? 0,
      icon: Lock,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40",
      sub: "IP & tài khoản vi phạm",
    },
    {
      title: "Mã OTP đã gửi",
      value: stats?.otpsSent ?? 0,
      icon: KeyRound,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40",
      sub: "Xác thực email sinh viên HUBT",
    },
    {
      title: "Phiên hoạt động",
      value: stats?.activeSessionsCount ?? 0,
      icon: Radio,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40",
      sub: "Thiết bị trực tuyến trong 24h",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Time Filter & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/80 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Khung thời gian phân tích:
          </span>
          <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1">
            {[
              { label: "24 giờ", value: "24h" },
              { label: "7 ngày", value: "7d" },
              { label: "30 ngày", value: "30d" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onTimeRangeChange(item.value)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === item.value
                    ? "bg-white dark:bg-[#1E1B4B] text-indigo-600 dark:text-indigo-300 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới dữ liệu</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border ${card.bgColor} transition-all hover:shadow-xs`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl bg-white dark:bg-[#0B0F19] shadow-2xs ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 font-medium">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Row 2: Risk Distribution & Quick Threat Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Card */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Phân bố mức độ rủi ro
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                level: "CRITICAL",
                label: "Nghiêm trọng (Critical)",
                color: "bg-rose-500 text-white",
                barColor: "bg-rose-500",
                count:
                  overview?.riskDistribution?.find((r) => r.level === "CRITICAL")?.count || 0,
              },
              {
                level: "HIGH",
                label: "Cao (High)",
                color: "bg-orange-500 text-white",
                barColor: "bg-orange-500",
                count:
                  overview?.riskDistribution?.find((r) => r.level === "HIGH")?.count || 0,
              },
              {
                level: "MEDIUM",
                label: "Trung bình (Medium)",
                color: "bg-amber-500 text-white",
                barColor: "bg-amber-500",
                count:
                  overview?.riskDistribution?.find((r) => r.level === "MEDIUM")?.count || 0,
              },
              {
                level: "LOW",
                label: "An toàn / Thấp (Low)",
                color: "bg-emerald-500 text-white",
                barColor: "bg-emerald-500",
                count:
                  overview?.riskDistribution?.find((r) => r.level === "LOW")?.count || 0,
              },
            ].map((item) => {
              const total =
                overview?.riskDistribution?.reduce((acc, curr) => acc + curr.count, 0) || 1;
              const percent = Math.round((item.count / total) * 100);

              return (
                <div key={item.level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {item.count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.barColor} transition-all duration-500`}
                      style={{ width: `${Math.max(percent, item.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Bảo mật tổng thể:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Hệ thống được bảo vệ
            </span>
          </div>
        </div>

        {/* Recent Alerts Quick List */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cảnh báo an ninh cần xử lý gần đây
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("alerts")}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả ({overview?.recentAlerts?.length || 0})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!overview?.recentAlerts || overview.recentAlerts.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
              <span>Không có cảnh báo an ninh nào chưa xử lý trong khung thời gian này.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {overview.recentAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19] flex items-start justify-between gap-3 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          alert.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : alert.severity === "HIGH"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {alert.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      {alert.ipAddress && <span>IP: {alert.ipAddress}</span>}
                      <span>{new Date(alert.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab("alerts")}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors shrink-0 cursor-pointer"
                  >
                    Xử lý
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Recent Events Table Preview */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sự kiện an ninh mạng tức thời (Live Activity Feed)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("events")}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Mở toàn bộ nhật ký
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!overview?.recentEvents || overview.recentEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Chưa có sự kiện bảo mật nào được ghi nhận.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Loại sự kiện</th>
                  <th className="py-2.5 px-3">Người dùng / Email</th>
                  <th className="py-2.5 px-3">Địa chỉ IP</th>
                  <th className="py-2.5 px-3">Mức rủi ro</th>
                  <th className="py-2.5 px-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {overview.recentEvents.slice(0, 5).map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {new Date(event.createdAt).toLocaleTimeString("vi-VN")}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {event.eventType}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {event.userEmail || "Khách / Không định danh"}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{event.ipAddress}</td>
                    <td className="py-2.5 px-3">
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
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectEventDetail(event)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
