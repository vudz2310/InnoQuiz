import React, { useState } from "react";
import type { QuestionDraft, QuestionType } from "../../../types/quiz.types";
import { QuestionEditor } from "./QuestionEditor";
import { Plus, ListFilter, Sparkles, Upload } from "lucide-react";
import { DocumentImportModal } from "./DocumentImportModal";

interface QuestionListProps {
  questions: QuestionDraft[];
  errors: Record<string, string>;
  onAddQuestion: (type?: QuestionType) => void;
  onDeleteQuestion: (index: number) => void;
  onMoveQuestion: (index: number, direction: "UP" | "DOWN") => void;
  onUpdateQuestion: (index: number, fields: Partial<QuestionDraft>) => void;
  onChangeQuestionType: (index: number, type: QuestionType) => void;
  onAddAnswer: (questionIndex: number) => void;
  onDeleteAnswer: (questionIndex: number, answerIndex: number) => void;
  onUpdateAnswer: (questionIndex: number, answerIndex: number, content: string) => void;
  onSetCorrectAnswer: (questionIndex: number, answerIndex: number) => void;
  onImportQuestions?: (questions: QuestionDraft[], replace: boolean) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  errors,
  onAddQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onUpdateQuestion,
  onChangeQuestionType,
  onAddAnswer,
  onDeleteAnswer,
  onUpdateAnswer,
  onSetCorrectAnswer,
  onImportQuestions,
}) => {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Danh sách câu hỏi */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ListFilter className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400" />
          <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
            Danh sách câu hỏi ({questions.length})
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
            Tổng: {totalPoints} điểm
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onImportQuestions && (
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Nhập đề từ văn bản / Tệp</span>
            </button>
          )}
        </div>

        {errors.questions && (
          <p className="w-full text-xs text-red-600 dark:text-red-400 font-bold">{errors.questions}</p>
        )}
      </div>

      {/* Render từng QuestionEditor */}
      <div className="space-y-5">
        {questions.map((question, qIndex) => {
          const qError =
            errors[`question_${qIndex}_content`] ||
            errors[`question_${qIndex}_answers`] ||
            errors[`question_${qIndex}_answers_count`] ||
            errors[`question_${qIndex}_correct`] ||
            errors[`question_${qIndex}_empty_answer`];

          return (
            <QuestionEditor
              key={question.id || `q-item-${qIndex}`}
              question={question}
              index={qIndex}
              totalQuestions={questions.length}
              error={qError}
              onContentChange={(content) => onUpdateQuestion(qIndex, { content })}
              onTypeChange={(type) => onChangeQuestionType(qIndex, type)}
              onPointsChange={(points) => onUpdateQuestion(qIndex, { points })}
              onMoveUp={() => onMoveQuestion(qIndex, "UP")}
              onMoveDown={() => onMoveQuestion(qIndex, "DOWN")}
              onDelete={() => onDeleteQuestion(qIndex)}
              onAddAnswer={() => onAddAnswer(qIndex)}
              onDeleteAnswer={(aIndex) => onDeleteAnswer(qIndex, aIndex)}
              onUpdateAnswer={(aIndex, content) => onUpdateAnswer(qIndex, aIndex, content)}
              onSetCorrectAnswer={(aIndex) => onSetCorrectAnswer(qIndex, aIndex)}
            />
          );
        })}
      </div>

      {/* Thêm câu hỏi Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 pb-6">
        <button
          type="button"
          onClick={() => onAddQuestion("MULTIPLE_CHOICE")}
          className="px-5 py-2.5 rounded-xl border border-[#C7D2FE] dark:border-indigo-500/50 bg-white dark:bg-[#111827] hover:bg-[#EEF2FF] dark:hover:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm câu hỏi Trắc nghiệm</span>
        </button>

        <button
          type="button"
          onClick={() => onAddQuestion("TRUE_FALSE")}
          className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-[#475569] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm câu hỏi Đúng / Sai</span>
        </button>

        {onImportQuestions && (
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="px-5 py-2.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Nhập tự động (Import)</span>
          </button>
        )}
      </div>

      {/* Document Import Modal */}
      {onImportQuestions && (
        <DocumentImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={onImportQuestions}
          existingCount={questions.length}
        />
      )}
    </div>
  );
};
