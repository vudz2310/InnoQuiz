export type NotificationType = "quiz" | "system" | "achievement" | "reminder" | "info";

export interface NotificationItemData {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: NotificationType;
  link?: string;
  avatar?: string;
  actionText?: string;
}

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItemData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface NotificationContextType {
  notifications: NotificationItemData[];
  unreadCount: number;
  toasts: ToastItemData[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (
    notification: Omit<NotificationItemData, "id" | "createdAt" | "isRead">
  ) => void;
  addToast: (toast: Omit<ToastItemData, "id">) => void;
  removeToast: (id: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}
