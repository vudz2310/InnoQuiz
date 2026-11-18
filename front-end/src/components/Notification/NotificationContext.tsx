import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  NotificationItemData,
  ToastItemData,
  NotificationContextType,
  ToastType,
} from "./types";

const initialNotifications: NotificationItemData[] = [
  {
    id: "notif-1",
    title: "Bộ đề thi mới đã mở!",
    message: "Bộ đề trắc nghiệm Tiếng Anh B1 VSTEP vừa được cập nhật với 50 câu hỏi mới.",
    createdAt: "5 phút trước",
    isRead: false,
    type: "quiz",
    link: "/news",
    actionText: "Làm bài ngay",
  },
  {
    id: "notif-2",
    title: "Chúc mừng thành tích!",
    message: "Bạn đã hoàn thành xuất sắc bài thi thử Tin Học Đại Cương với điểm số 9.5/10.",
    createdAt: "1 giờ trước",
    isRead: false,
    type: "achievement",
    link: "/profile",
  },
  {
    id: "notif-3",
    title: "Bảo trì hệ thống định kỳ",
    message: "Hệ thống InnoQuiz HUBT sẽ bảo trì nâng cấp máy chủ từ 00:00 đến 02:00 ngày mai.",
    createdAt: "3 giờ trước",
    isRead: true,
    type: "system",
  },
  {
    id: "notif-4",
    title: "Nhắc nhở học tập hàng tuần",
    message: "Đừng quên hoàn thành bài luyện tập tuần này để duy trì chuỗi học 7 ngày nhé!",
    createdAt: "1 ngày trước",
    isRead: true,
    type: "reminder",
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] =
    useState<NotificationItemData[]>(initialNotifications);
  const [toasts, setToasts] = useState<ToastItemData[]>([]);

  // Deduplication cache to prevent duplicate toasts & notifications (e.g. StrictMode, double clicks)
  const recentToastsRef = React.useRef<Map<string, number>>(new Map());
  const recentNotifsRef = React.useRef<Map<string, number>>(new Map());

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback(
    (notification: Omit<NotificationItemData, "id" | "createdAt" | "isRead">) => {
      const dedupeKey = `${notification.type}::${notification.title.trim()}::${notification.message.trim()}`;
      const now = Date.now();
      const lastTime = recentNotifsRef.current.get(dedupeKey);

      // Prevent duplicate notification within 2000ms
      if (lastTime && now - lastTime < 2000) {
        return;
      }
      recentNotifsRef.current.set(dedupeKey, now);

      // Clean up old keys
      if (recentNotifsRef.current.size > 20) {
        for (const [k, time] of recentNotifsRef.current.entries()) {
          if (now - time > 10000) {
            recentNotifsRef.current.delete(k);
          }
        }
      }

      const newNotif: NotificationItemData = {
        ...notification,
        id: `notif-${now}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: "Vừa xong",
        isRead: false,
      };

      setNotifications((prev) => {
        // Prevent duplicate if the most recent notification has identical content
        if (
          prev.length > 0 &&
          prev[0].title === newNotif.title &&
          prev[0].message === newNotif.message
        ) {
          return prev;
        }
        return [newNotif, ...prev];
      });
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItemData, "id">) => {
    const dedupeKey = `${toast.type}::${toast.title.trim()}::${(toast.message || "").trim()}`;
    const now = Date.now();
    const lastTime = recentToastsRef.current.get(dedupeKey);

    // Prevent duplicate toast triggered within 1500ms (e.g. React StrictMode, double clicks)
    if (lastTime && now - lastTime < 1500) {
      return;
    }
    recentToastsRef.current.set(dedupeKey, now);

    // Clean up old keys
    if (recentToastsRef.current.size > 20) {
      for (const [k, time] of recentToastsRef.current.entries()) {
        if (now - time > 5000) {
          recentToastsRef.current.delete(k);
        }
      }
    }

    const id = `toast-${now}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItemData = { ...toast, id };

    setToasts((prev) => {
      // Guard against identical toast already currently present in the list
      const isAlreadyActive = prev.some(
        (t) =>
          t.type === newToast.type &&
          t.title === newToast.title &&
          t.message === newToast.message
      );
      if (isAlreadyActive) {
        return prev;
      }
      return [...prev, newToast];
    });
  }, []);

  const showToastHelper = useCallback(
    (type: ToastType, title: string, message?: string) => {
      addToast({ type, title, message });
    },
    [addToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => showToastHelper("success", title, message),
    [showToastHelper]
  );

  const showError = useCallback(
    (title: string, message?: string) => showToastHelper("error", title, message),
    [showToastHelper]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => showToastHelper("warning", title, message),
    [showToastHelper]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => showToastHelper("info", title, message),
    [showToastHelper]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        addNotification,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
