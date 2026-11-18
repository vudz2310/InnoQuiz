import React from "react";
import type { QuestionDraft, QuestionType } from "../../../types/quiz.types";
import type { QuestionIssue } from "../utils/questionValidator";
import { AnswerEditor } from "./AnswerEditor";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { getMediaUrl } from "../../../utils/media";

interface QuestionEditorProps {
  question: QuestionDraft;
  index: number;
  sectionIndex?: number;
  totalQuestions: number;
  error?: string;
  issues?: QuestionIssue[];
  onContentChange: (content: string) => void;
  onTypeChange: (type: QuestionType) => void;
  onPointsChange: (points: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onAddAnswer: () => void;
  onDeleteAnswer: (answerIndex: number) => void;
  onUpdateAnswer: (answerIndex: number, content: string) => void;
  onSetCorrectAnswer: (answerIndex: number) => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  sectionIndex = 0,
  totalQuestions,
  error,
  issues = [],
  onContentChange,
  onTypeChange,
  onPointsChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddAnswer,
  onDeleteAnswer,
  onUpdateAnswer,
  onSetCorrectAnswer,
}) => {
  const qNum = index + 1;
  const hasIssues = issues.length > 0 || Boolean(error);
  const hasMissingCorrect = issues.some((i) => i.type === "MISSING_CORRECT");

  // Tìm đáp án đúng hiện tại
  const correctIdx = question.answers.findIndex((a) => a.isCorrect);
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const correctLetter = correctIdx >= 0 ? letters[correctIdx] : null;

  return (
    <div
      id={`question-card-${sectionIndex}-${index}`}
      className={`rounded-2xl p-5 sm:p-6 transition-all ${
        hasIssues
          ? "border-2 border-amber-300 dark:border-amber-700/80 bg-white dark:bg-[#111827] shadow-sm ring-4 ring-amber-500/10 dark:ring-amber-900/20"
          : "border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:border-[#CBD5E1] dark:hover:border-slate-700"
      }`}
    >
      {/* Question Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9] dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
              hasIssues
                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                : "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300"
            }`}
          >
            {qNum}
          </span>
          <span className="text-sm font-bold text-[#0F172A] dark:text-white">
            Câu hỏi số {qNum}
          </span>

          {/* Huy hiệu Trạng thái Hợp lệ / Cần sửa */}
          {hasIssues ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>
                {issues.length > 0
                  ? issues.map((i) => i.message).join(" • ")
                  : error || "Cần kiểm tra"}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Hợp lệ {correctLetter ? `(Đáp án: ${correctLetter})` : ""}</span>
            </span>
          )}
        </div>

        {/* Question Configuration (Type, Points & Ordering) */}
        <div className="flex items-center gap-2">
          {/* Loại câu hỏi */}
          <select
            value={question.type}
            onChange={(e) => onTypeChange(e.target.value as QuestionType)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B0F19] text-[#0F172A] dark:text-slate-200 focus:outline-none focus:border-[#4F46E5] dark:focus:border-indigo-500 cursor-pointer"
          >
            <option
              value="MULTIPLE_CHOICE"
              className="bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200"
            >
              Trắc nghiệm (Nhiều lựa chọn)
            </option>
            <option
              value="TRUE_FALSE"
              className="bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200"
            >
              Đúng / Sai (True - False)
            </option>
          </select>

          {/* Điểm số */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-slate-800 rounded-lg px-2 py-1">
            <span className="text-2xs font-semibold text-[#64748B] dark:text-slate-400">
              Điểm:
            </span>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={question.points}
              onChange={(e) => onPointsChange(parseFloat(e.target.value) || 1)}
              className="w-10 text-xs font-bold text-center text-[#0F172A] dark:text-slate-100 bg-transparent focus:outline-none"
            />
          </div>

          <div className="h-4 w-px bg-[#E2E8F0] dark:bg-slate-800 mx-0.5" />

          {/* Move Up */}
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 hover:text-[#0F172A] dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Di chuyển lên trên"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          {/* Move Down */}
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalQuestions - 1}
            className="p-1.5 rounded-lg text-[#64748B] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 hover:text-[#0F172A] dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Di chuyển xuống dưới"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-[#94A3B8] dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-1 cursor-pointer"
            title="Xóa câu hỏi này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hiển thị hình ảnh đính kèm câu hỏi (nếu có từ file PDF / Word) */}
      {question.media && question.media.length > 0 && (
        <div className="mb-4 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>Hình ảnh đính kèm câu hỏi</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {question.media.map((m, mIdx) => (
              <div
                key={m.assetId || mIdx}
                className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 max-w-xs shadow-2xs group"
              >
                <img
                  src={getMediaUrl(m.dataUrl || m.url || "")}
                  alt={m.originalName || `Ảnh đính kèm câu ${qNum}`}
                  className="max-h-48 w-auto object-contain mx-auto"
                  onError={(e) => {
                    if (m.dataUrl && e.currentTarget.src !== m.dataUrl) {
                      e.currentTarget.src = m.dataUrl;
                    }
                  }}
                />
                <span className="absolute bottom-1 right-1 text-[10px] bg-slate-900/80 text-white px-1.5 py-0.5 rounded backdrop-blur-xs font-mono">
                  {m.originalName || `Ảnh ${mIdx + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nội dung câu hỏi */}
      <div>
        <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5">
          Nội dung câu hỏi <span className="text-red-500">*</span>
        </label>
        <textarea
          value={question.content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={`Nhập câu hỏi số ${qNum}...`}
          rows={2}
          className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0B0F19] text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none focus:ring-3 transition-all resize-y ${
            !question.content?.trim() && (!question.media || question.media.length === 0)
              ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-950/40"
              : "border-[#E2E8F0] dark:border-slate-800 focus:border-[#4F46E5] dark:focus:border-indigo-500 focus:ring-[#EEF2FF] dark:focus:ring-indigo-950/40"
          }`}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
        )}
      </div>

      {/* Danh sách các đáp án */}
      <AnswerEditor
        answers={question.answers}
        questionType={question.type}
        questionIndex={index}
        sectionIndex={sectionIndex}
        questionUniqueId={question.id || question.tempId}
        hasMissingCorrectIssue={hasMissingCorrect}
        onAddAnswer={onAddAnswer}
        onDeleteAnswer={onDeleteAnswer}
        onUpdateAnswer={onUpdateAnswer}
        onSetCorrectAnswer={onSetCorrectAnswer}
      />
    </div>
  );
};
