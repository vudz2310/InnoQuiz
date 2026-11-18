import React from "react";
import { X, ShieldAlert, Clock, User, Globe, Laptop, Code, AlertTriangle } from "lucide-react";
import type { SecurityEventItem } from "../../../../services/api/Security.api";
import { Button } from "../../../../components/ui";

interface SecurityEventDetailModalProps {
  event: SecurityEventItem | null;
  onClose: () => void;
  onQuickBlock?: (type: "IP" | "USER", value: string, reason: string) => void;
}

export const SecurityEventDetailModal: React.FC<SecurityEventDetailModalProps> = ({
  event,
  onClose,
  onQuickBlock,
}) => {
  if (!event) return null;

  const handleQuickBlockClick = () => {
    if (onQuickBlock && event.ipAddress) {
      onQuickBlock(
        "IP",
        event.ipAddress,
        `Chặn khẩn cấp từ sự kiện an ninh ${event.eventType} (Mức rủi ro: ${event.riskLevel})`,
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chi tiết sự kiện an ninh
              </h3>
              <p className="text-xs text-slate-500 font-mono">ID: {event.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Loại sự kiện</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {event.eventType}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Mức rủi ro</span>
              <span
                className={`text-xs font-bold mt-0.5 block ${
                  event.riskLevel === "CRITICAL"
                    ? "text-rose-600"
                    : event.riskLevel === "HIGH"
                    ? "text-orange-600"
                    : event.riskLevel === "MEDIUM"
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {event.riskLevel} (Điểm: {event.riskScore})
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">HTTP Status</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block font-mono">
                {event.httpMethod || "POST"} {event.httpStatus || 200}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Thời gian</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">
                {new Date(event.createdAt).toLocaleTimeString("vi-VN")}
              </span>
            </div>
          </div>

          {/* Network & Client Information */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-500" />
              Thông tin Mạng & Thiết bị
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Địa chỉ IP: </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {event.ipAddress}
                </span>
              </div>
              <div>
                <span className="text-slate-400">IP Hash (Ẩn danh): </span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate block">
                  {event.ipHash}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Tài khoản: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {event.userEmail || "Khách / Không xác thực"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Thiết bị / OS: </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {event.deviceInfo || "Desktop / Chrome"}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400">Endpoint: </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {event.endpoint || "/api/v1/..."}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400">User Agent: </span>
                <span className="text-[11px] text-slate-500 break-all">
                  {event.userAgent || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Raw JSON Details Payload */}
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] space-y-2 overflow-x-auto">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-indigo-400" /> Details Payload (JSON)
              </span>
            </div>
            <pre className="text-emerald-400 leading-relaxed overflow-x-auto">
              {JSON.stringify(event.details || {}, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer with Quick Ban Action */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          {event.ipAddress && onQuickBlock ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleQuickBlockClick}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Chặn IP này ({event.ipAddress})</span>
            </Button>
          ) : (
            <div />
          )}

          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng cửa sổ
          </Button>
        </div>
      </div>
    </div>
  );
};
