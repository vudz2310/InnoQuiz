import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Trophy,
  BellRing,
  Info,
  ShieldAlert,
  Check,
  Trash2,
  ChevronRight,
} from "lucide-react";
import type { NotificationItemData, NotificationType } from "./types";

interface NotificationItemProps {
  notification: NotificationItemData;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onCloseDropdown?: () => void;
}

const getTypeIcon = (type: NotificationType) => {
  switch (type) {
    case "quiz":
      return {
        icon: FileText,
        bgColor: "bg-indigo-100 text-indigo-600",
        badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        label: "Đề thi mới",
      };
    case "achievement":
      return {
        icon: Trophy,
        bgColor: "bg-amber-100 text-amber-600",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Thành tích",
      };
    case "system":
      return {
        icon: ShieldAlert,
        bgColor: "bg-sky-100 text-sky-600",
        badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
        label: "Hệ thống",
      };
    case "reminder":
      return {
        icon: BellRing,
        bgColor: "bg-emerald-100 text-emerald-600",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Nhắc nhở",
      };
    case "info":
    default:
      return {
        icon: Info,
        bgColor: "bg-blue-100 text-blue-600",
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
        label: "Thông tin",
      };
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onRemove,
  onCloseDropdown,
}) => {
  const { icon: Icon, bgColor, badgeBg, label } = getTypeIcon(notification.type);

  const handleClickItem = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (onCloseDropdown) {
      onCloseDropdown();
    }
  };

  const content = (
    <>
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}
        >
          {label}
        </span>
        <span className="text-[11px] font-medium text-[#94A3B8] dark:text-slate-500 ml-auto">
          {notification.createdAt}
        </span>
      </div>

      <h4
        className={`text-xs font-bold leading-snug line-clamp-1 ${
          notification.isRead
            ? "text-[#1E293B] dark:text-slate-200"
            : "text-[#4F46E5] dark:text-indigo-400"
        }`}
      >
        {notification.title}
      </h4>

      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
        {notification.message}
      </p>

      {notification.actionText && (
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#4F46E5] dark:text-indigo-400 hover:text-[#4338CA]">
          <span>{notification.actionText}</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </>
  );

  return (
    <div
      className={`group relative p-3.5 rounded-2xl transition-all duration-200 border border-transparent hover:border-[#E2E8F0] dark:hover:border-slate-700 ${
        notification.isRead
          ? "bg-white dark:bg-[#111827] hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60"
          : "bg-[#EEF2FF]/60 dark:bg-indigo-950/40 hover:bg-[#EEF2FF] dark:hover:bg-indigo-950/60 border-[#C7D2FE]/40 dark:border-indigo-800/40"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-semibold shadow-xs ${bgColor}`}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>

        {/* Content Body */}
        {notification.link ? (
          <Link
            to={notification.link}
            onClick={handleClickItem}
            className="flex-1 min-w-0 cursor-pointer block group-hover:text-indigo-900 dark:group-hover:text-indigo-200"
          >
            {content}
          </Link>
        ) : (
          <div
            onClick={handleClickItem}
            className="flex-1 min-w-0 cursor-pointer block group-hover:text-indigo-900 dark:group-hover:text-indigo-200"
          >
            {content}
          </div>
        )}

        {/* Unread dot and Action menu */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {!notification.isRead && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5] ring-4 ring-[#EEF2FF] dark:ring-indigo-950/60 animate-pulse" />
          )}

          {/* Quick Action buttons visible on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs p-1 rounded-lg shadow-xs border border-[#E2E8F0] dark:border-slate-700">
            {!notification.isRead && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                title="Đánh dấu đã đọc"
                className="p-1 rounded-md text-[#64748B] dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-indigo-400 hover:bg-[#EEF2FF] dark:hover:bg-slate-700 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(notification.id);
              }}
              title="Xóa thông báo"
              className="p-1 rounded-md text-[#64748B] dark:text-slate-400 hover:text-[#EF4444] dark:hover:text-red-400 hover:bg-[#FEF2F2] dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
