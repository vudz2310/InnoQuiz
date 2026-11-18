import React from "react";
import type { QuizDraft, Category } from "../../../types/quiz.types";
import { X, Clock, HelpCircle, Tag, CheckCircle2 } from "lucide-react";

interface QuizPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizDraft;
  categories: Category[];
}

export const QuizPreview: React.FC<QuizPreviewProps> = ({
  isOpen,
  onClose,
  quiz,
  categories,
}) => {
  if (!isOpen) return null;

  const categoryName =
    categories.find((c) => c.id === quiz.categoryId)?.name || "Chưa chọn danh mục";
  const answerLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC] dark:bg-[#0B0F19]">
          <div>
            <span className="text-2xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400 bg-[#EEF2FF] dark:bg-indigo-950/70 px-2.5 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/40">
              Xem trước đề thi (Preview)
            </span>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-white mt-1">
              {quiz.title || "Chưa có tiêu đề đề thi"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] dark:text-slate-400 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div className="flex items-center gap-1.5 bg-[#F1F5F9] dark:bg-slate-800 px-3 py-1 rounded-lg">
              <Tag className="w-3.5 h-3.5 text-[#4F46E5] dark:text-indigo-400" />
              <span className="font-semibold text-[#0F172A] dark:text-slate-200">{categoryName}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F1F5F9] dark:bg-slate-800 px-3 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-[#4F46E5] dark:text-indigo-400" />
              <span className="text-[#0F172A] dark:text-slate-200">{quiz.timeLimit ? `${quiz.timeLimit} phút` : "Không giới hạn thời gian"}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F1F5F9] dark:bg-slate-800 px-3 py-1 rounded-lg">
              <HelpCircle className="w-3.5 h-3.5 text-[#4F46E5] dark:text-indigo-400" />
              <span className="text-[#0F172A] dark:text-slate-200">{quiz.questions.length} câu hỏi</span>
            </div>
          </div>

          {/* Description */}
          {quiz.description && (
            <div className="bg-[#F8FAFC] dark:bg-[#0B0F19] rounded-2xl p-4 text-xs text-[#475569] dark:text-slate-300 leading-relaxed border border-[#E2E8F0] dark:border-slate-800">
              <span className="font-bold text-[#0F172A] dark:text-white block mb-1">Mô tả bài thi:</span>
              {quiz.description}
            </div>
          )}

          {/* Questions Preview */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] dark:text-slate-400">
              Nội dung các câu hỏi:
            </h4>

            {quiz.questions.map((q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B0F19] shadow-2xs space-y-3"
              >
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                      {q.content || `(Chưa nhập nội dung câu hỏi ${idx + 1})`}
                    </p>
                    {q.media && q.media.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {q.media.map((media) => (
                          media.dataUrl || media.url ? (
                            <img key={media.tempId} src={media.dataUrl || media.url} alt="Hình minh họa câu hỏi" className="max-h-40 max-w-full rounded-lg object-contain" />
                          ) : null
                        ))}
                      </div>
                    )}
                    <span className="text-2xs text-[#94A3B8] dark:text-slate-400">
                      {q.type === "TRUE_FALSE" ? "Đúng / Sai" : "Trắc nghiệm"} • {q.points} điểm
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-8">
                  {q.answers.map((a, aIdx) => {
                    const letter = answerLetters[aIdx] || `${aIdx + 1}`;
                    return (
                      <div
                        key={aIdx}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
                          a.isCorrect
                            ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 font-semibold"
                            : "bg-[#F8FAFC] dark:bg-[#111827] border-[#E2E8F0] dark:border-slate-800 text-[#475569] dark:text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-2xs ${
                            a.isCorrect
                              ? "bg-emerald-600 text-white"
                              : "bg-[#E2E8F0] dark:bg-slate-800 text-[#64748B] dark:text-slate-400"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1">
                          {a.content || `(Đáp án ${letter})`}
                          {a.media && a.media.length > 0 && (
                            <span className="mt-2 flex flex-wrap gap-2">
                              {a.media.map((media) => (
                                media.dataUrl || media.url ? (
                                  <img key={media.tempId} src={media.dataUrl || media.url} alt={`Hình ảnh đáp án ${letter}`} className="max-h-24 max-w-full rounded-lg object-contain" />
                                ) : null
                              ))}
                            </span>
                          )}
                        </span>
                        {a.isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] dark:border-slate-800 flex justify-end bg-[#F8FAFC] dark:bg-[#0B0F19]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-slate-800 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 text-xs font-bold text-[#0F172A] dark:text-slate-200 transition-colors cursor-pointer"
          >
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  );
};
