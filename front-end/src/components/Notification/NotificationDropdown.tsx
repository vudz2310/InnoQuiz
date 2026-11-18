import React, { useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Inbox,
  Sparkles,
  X,
} from "lucide-react";
import { useNotification } from "./NotificationContext";
import { NotificationItem } from "./NotificationItem";
import type { NotificationType } from "./types";

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotification();

  const [activeTab, setActiveTab] = useState<"all" | "unread" | NotificationType>("all");

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "unread") return !item.isRead;
    if (activeTab === "all") return true;
    return item.type === activeTab;
  });

  return (
    <div className="w-full sm:w-[420px] max-w-full bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 text-[#0F172A] dark:text-white flex flex-col max-h-[82vh] sm:max-h-[580px]">
      {/* Top Header */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-indigo-50/80 via-white to-white dark:from-indigo-950/40 dark:via-[#111827] dark:to-[#111827] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shadow-xs shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white truncate">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold bg-[#EF4444] text-white rounded-full shrink-0">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              Tin tức & kết quả làm bài của bạn
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="p-1.5 rounded-xl text-[#4F46E5] dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Đánh dấu tất cả là đã đọc"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Đã đọc</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAllNotifications}
              className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Xóa tất cả thông báo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Nút đóng nhanh cho Mobile */}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            title="Đóng thông báo"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-[#F8FAFC] dark:bg-[#0B0F19] border-b border-[#E2E8F0] dark:border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "all"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "text-[#64748B] dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-indigo-300 hover:bg-[#EEF2FF] dark:hover:bg-slate-800"
          }`}
        >
          Tất cả ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "unread"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "text-[#64748B] dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-indigo-300 hover:bg-[#EEF2FF] dark:hover:bg-slate-800"
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quiz")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "quiz"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "text-[#64748B] dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-indigo-300 hover:bg-[#EEF2FF] dark:hover:bg-slate-800"
          }`}
        >
          Đề thi
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "system"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "text-[#64748B] dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-indigo-300 hover:bg-[#EEF2FF] dark:hover:bg-slate-800"
          }`}
        >
          Hệ thống
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-[50vh] sm:max-h-[380px] overflow-y-auto p-2.5 sm:p-3 space-y-2 divide-y-0 scrollbar-thin flex-1">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onMarkAsRead={markAsRead}
              onRemove={removeNotification}
              onCloseDropdown={onClose}
            />
          ))
        ) : (
          <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-[#EEF2FF] dark:bg-indigo-950/60 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400 mb-3 shadow-inner">
              <Inbox className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">Không có thông báo nào</h4>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-[240px]">
              {activeTab === "unread"
                ? "Bạn đã đọc hết tất cả các thông báo!"
                : "Hiện chưa có thông báo mới trong danh mục này."}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-[#F8FAFC] dark:bg-[#0B0F19] border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-[#64748B] dark:text-slate-400 text-[11px] font-semibold truncate mr-2">
          <Sparkles className="w-3.5 h-3.5 text-[#4F46E5] dark:text-indigo-400 shrink-0" />
          <span className="truncate">InnoQuiz Notification Center</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-[#4F46E5] dark:text-indigo-400 hover:text-[#4338CA] dark:hover:text-indigo-300 hover:underline cursor-pointer shrink-0"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
