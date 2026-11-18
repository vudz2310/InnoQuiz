import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay: rgba(15,23,42,0.45) */}
      <div
        className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container: radius 20px */}
      <div
        className={`
          relative w-full ${maxWidthMap[maxWidth]} bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8
          shadow-xl border border-[#E2E8F0] dark:border-slate-800 z-10 animate-in fade-in zoom-in-95 duration-200
        `}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
          {title && (
            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{title}</h3>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors cursor-pointer ml-auto"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 text-slate-800 dark:text-slate-200">{children}</div>

        {footer && (
          <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
