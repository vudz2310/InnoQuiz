import React from "react";
import type { AnswerDraft, QuestionType } from "../../../types/quiz.types";
import { Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface AnswerEditorProps {
  answers: AnswerDraft[];
  questionType: QuestionType;
  questionIndex: number;
  sectionIndex?: number;
  questionUniqueId?: string;
  hasMissingCorrectIssue?: boolean;
  onAddAnswer: () => void;
  onDeleteAnswer: (answerIndex: number) => void;
  onUpdateAnswer: (answerIndex: number, content: string) => void;
  onSetCorrectAnswer: (answerIndex: number) => void;
}

export const AnswerEditor: React.FC<AnswerEditorProps> = ({
  answers,
  questionType,
  questionIndex,
  sectionIndex = 0,
  questionUniqueId,
  hasMissingCorrectIssue = false,
  onAddAnswer,
  onDeleteAnswer,
  onUpdateAnswer,
  onSetCorrectAnswer,
}) => {
  const isTrueFalse = questionType === "TRUE_FALSE";
  const answerLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const radioGroupName = `correct-ans-${questionUniqueId || `${sectionIndex}-${questionIndex}`}`;

  return (
    <div className="space-y-3 mt-4">
      {/* Header Phương án */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#0F172A] dark:text-slate-200 flex items-center gap-1.5">
          <span>Các phương án trả lời</span>
          <span className="text-[11px] font-normal text-[#64748B] dark:text-slate-400">
            (Bấm nút tròn hoặc chữ cái để chọn đáp án đúng)
          </span>
        </label>
        {!isTrueFalse && answers.length < 8 && (
          <button
            type="button"
            onClick={onAddAnswer}
            className="text-xs font-bold text-[#4F46E5] dark:text-indigo-400 hover:text-[#4338CA] dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm đáp án</span>
          </button>
        )}
      </div>

      {/* Cảnh báo chưa chọn đáp án đúng */}
      {hasMissingCorrectIssue && (
        <div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Chưa chọn đáp án đúng:</strong> Hãy nhấp vào chữ cái tròn hoặc bấm{" "}
            <em>"Chọn làm đáp án đúng"</em> ở phương án chính xác.
          </span>
        </div>
      )}

      {/* Danh sách các câu trả lời */}
      <div className="space-y-2.5">
        {answers.map((answer, aIdx) => {
          const letter = answerLetters[aIdx] || `${aIdx + 1}`;
          const isCorrect = answer.isCorrect;

          return (
            <div
              key={answer.id || `ans-${sectionIndex}-${questionIndex}-${aIdx}`}
              className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                isCorrect
                  ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 ring-2 ring-emerald-500/15 dark:ring-emerald-900/30"
                  : "bg-white dark:bg-[#0B0F19] border-[#E2E8F0] dark:border-slate-800 hover:border-[#CBD5E1] dark:hover:border-slate-700"
              }`}
            >
              {/* Radio Chọn Đáp Án Đúng */}
              <label
                className="flex items-center gap-1.5 cursor-pointer pl-1 select-none"
                title="Đánh dấu đây là đáp án đúng"
              >
                <input
                  type="radio"
                  name={radioGroupName}
                  checked={Boolean(isCorrect)}
                  onChange={() => onSetCorrectAnswer(aIdx)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    isCorrect
                      ? "bg-emerald-600 text-white shadow-2xs scale-105"
                      : "bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {letter}
                </span>
              </label>

              {/* Input/Textarea Nội Dung Đáp Án */}
              <textarea
                rows={Math.max(
                  1,
                  Math.min(4, Math.ceil((answer.content || "").length / 70)),
                )}
                value={answer.content}
                onChange={(e) => onUpdateAnswer(aIdx, e.target.value)}
                readOnly={isTrueFalse}
                placeholder={`Nhập nội dung đáp án ${letter}...`}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none resize-y leading-relaxed transition-all ${
                  isTrueFalse
                    ? "bg-transparent font-semibold border-0"
                    : "bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-[#111827] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                }`}
              />

              {/* Huy hiệu đáp án đúng */}
              {isCorrect ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" />
                  Đúng
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetCorrectAnswer(aIdx)}
                  className="hidden sm:inline-flex items-center text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  title="Đặt làm đáp án đúng"
                >
                  Chọn đúng
                </button>
              )}

              {/* Nút Xóa Đáp Án (Không cho xóa khi là Đúng/Sai) */}
              {!isTrueFalse && answers.length > 2 && (
                <button
                  type="button"
                  onClick={() => onDeleteAnswer(aIdx)}
                  className="p-1.5 text-[#94A3B8] dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Xóa đáp án này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Nút Thêm Đáp Án Nhanh dạng Dashed ở cuối danh sách */}
      {!isTrueFalse && answers.length < 8 && (
        <button
          type="button"
          onClick={onAddAnswer}
          className="w-full py-2 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm phương án {answerLetters[answers.length] || ""}</span>
        </button>
      )}
    </div>
  );
};
