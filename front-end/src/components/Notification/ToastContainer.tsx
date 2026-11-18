import React, { useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from "lucide-react";
import { useNotification } from "./NotificationContext";
import type { ToastItemData, ToastType } from "./types";

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case "success":
      return {
        icon: CheckCircle2,
        bgBorder: "bg-white border-emerald-200 text-emerald-950 shadow-emerald-500/10",
        iconColor: "text-emerald-500 bg-emerald-50",
        progressColor: "bg-emerald-500",
      };
    case "error":
      return {
        icon: XCircle,
        bgBorder: "bg-white border-rose-200 text-rose-950 shadow-rose-500/10",
        iconColor: "text-rose-500 bg-rose-50",
        progressColor: "bg-rose-500",
      };
    case "warning":
      return {
        icon: AlertTriangle,
        bgBorder: "bg-white border-amber-200 text-amber-950 shadow-amber-500/10",
        iconColor: "text-amber-500 bg-amber-50",
        progressColor: "bg-amber-500",
      };
    case "info":
    default:
      return {
        icon: Info,
        bgBorder: "bg-white border-indigo-200 text-indigo-950 shadow-indigo-500/10",
        iconColor: "text-indigo-500 bg-indigo-50",
        progressColor: "bg-indigo-500",
      };
  }
};

const ToastItem: React.FC<{
  toast: ToastItemData;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const duration = toast.duration || 4000;
  const config = getToastConfig(toast.type);
  const Icon = config.icon;
  const { id } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, id, onRemove]);

  return (
    <div
      className={`relative w-80 sm:w-96 p-4 rounded-2xl border shadow-xl flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-2 fade-in overflow-hidden z-50 ${config.bgBorder}`}
    >
      {/* Toast Icon */}
      <div className={`p-2 rounded-xl shrink-0 ${config.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-2">
        <h5 className="text-xs font-bold leading-snug">{toast.title}</h5>
        {toast.message && (
          <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Auto-dismiss Progress Bar */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${config.progressColor} animate-toast-progress`}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-auto">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};
