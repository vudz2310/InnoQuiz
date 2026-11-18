import React from "react";
import { AlertTriangle, Send, Loader2, CheckCircle2 } from "lucide-react";


interface ExamSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  totalQuestions: number;
  answeredCount: number;
}

export const ExamSubmitModal: React.FC<ExamSubmitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  submitting,
  totalQuestions,
  answeredCount,
}) => {
  if (!isOpen) return null;

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const isAllAnswered = unansweredCount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 text-center space-y-3">
          <div
            className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
              isAllAnswered
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isAllAnswered ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isAllAnswered ? "Xác nhận nộp bài thi" : "Bạn vẫn còn câu chưa trả lời!"}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isAllAnswered
              ? "Bạn đã hoàn thành tất cả câu hỏi trong bài thi. Bạn có chắc chắn muốn nộp bài để xem kết quả?"
              : `Bạn đã trả lời ${answeredCount}/${totalQuestions} câu hỏi. Vẫn còn ${unansweredCount} câu chưa chọn đáp án. Bạn có chắc chắn muốn nộp bài?`}
          </p>

          {/* Stats pills */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-400">Đã trả lời</p>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {answeredCount} câu
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-400">Chưa trả lời</p>
              <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                {unansweredCount} câu
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0B0F19] border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Kiểm tra lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang nộp bài...</>
            ) : (
              <><Send className="w-3.5 h-3.5" /> Nộp bài ngay</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSubmitModal;
