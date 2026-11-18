import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Eye, Send, Loader2 } from "lucide-react";
import type { QuizStatus } from "../../../types/quiz.types";

interface QuizBuilderHeaderProps {
  title: string;
  status?: QuizStatus;
  saving: boolean;
  publishing: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview: () => void;
  isEditMode?: boolean;
}

export const QuizBuilderHeader: React.FC<QuizBuilderHeaderProps> = ({
  title,
  status = "DRAFT",
  saving,
  publishing,
  onSaveDraft,
  onPublish,
  onPreview,
  isEditMode = false,
}) => {
  return (
    <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#090D1A]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 py-3.5 mb-6 shadow-2xs transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <Link
            to="/my-quizzes"
            className="p-2 rounded-xl text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
            title="Quay lại danh sách đề thi của tôi"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white line-clamp-1">
                {title.trim()
                  ? title
                  : isEditMode
                    ? "Chỉnh sửa đề thi"
                    : "Tạo đề thi mới"}
              </h1>
              <span
                className={`text-2xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  status === "PUBLISHED"
                    ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                    : "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                }`}
              >
                {status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Soạn câu hỏi và thiết lập cấu hình bài kiểm tra
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Nút Xem trước */}
          <button
            type="button"
            onClick={onPreview}
            className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] text-[#475569] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 hover:text-[#4F46E5] dark:hover:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
            <span className="hidden sm:inline">Xem trước</span>
          </button>

          {/* Nút Lưu nháp */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving || publishing}
            className="px-4 py-2 rounded-xl border border-[#C7D2FE] dark:border-indigo-500/40 bg-[#EEF2FF] dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-300 hover:bg-[#E0E7FF] dark:hover:bg-indigo-900/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#4F46E5] dark:text-indigo-300" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Đang lưu..." : "Lưu nháp"}</span>
          </button>

          {/* Nút Xuất bản */}
          <button
            type="button"
            onClick={onPublish}
            disabled={saving || publishing}
            className="px-4.5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{publishing ? "Đang xuất bản..." : "Xuất bản"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
