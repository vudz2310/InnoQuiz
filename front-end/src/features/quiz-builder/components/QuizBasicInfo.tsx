import React from "react";
import type { Category } from "../../../types/quiz.types";
import { Clock, Tag, FileText } from "lucide-react";
import { QuizCoverUploader } from "./QuizCoverUploader";
import { SearchableSelect } from "../../../components/ui/searchable-select";

interface QuizBasicInfoProps {
  quizId?: string;
  title: string;
  description: string;
  categoryId: string;
  timeLimit: number | null;
  coverUrl?: string | null;
  categories: Category[];
  categoriesLoading: boolean;
  errors: Record<string, string>;
  onTitleChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onTimeLimitChange: (val: number | null) => void;
  onCoverChange: (coverUrl: string, coverKey?: string, file?: File) => void;
  onCoverRemove: () => void;
}

export const QuizBasicInfo: React.FC<QuizBasicInfoProps> = ({
  quizId,
  title,
  description,
  categoryId,
  timeLimit,
  coverUrl,
  categories,
  categoriesLoading,
  errors,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onTimeLimitChange,
  onCoverChange,
  onCoverRemove,
}) => {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-6 shadow-xs mb-6 transition-colors space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-[#F1F5F9] dark:border-slate-800">
        <FileText className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400" />
        <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
          Thông tin cơ bản của đề thi
        </h2>
      </div>

      {/* Ảnh bìa đề thi */}
      <QuizCoverUploader
        quizId={quizId}
        coverUrl={coverUrl}
        onCoverChange={onCoverChange}
        onCoverRemove={onCoverRemove}
      />

      <div className="space-y-4">
        {/* Tên đề thi */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5">
            Tên đề thi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ví dụ: Lập trình React cơ bản và Hooks"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#0F172A] dark:text-slate-100 bg-white dark:bg-[#0B0F19] placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none transition-all ${
              errors.title
                ? "border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40"
                : "border-[#E2E8F0] dark:border-slate-800 focus:border-[#4F46E5] dark:focus:border-indigo-500 focus:ring-3 focus:ring-[#EEF2FF] dark:focus:ring-indigo-950/40"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
              {errors.title}
            </p>
          )}
        </div>

        {/* Mô tả đề thi */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5">
            Mô tả đề thi <span className="text-[#94A3B8] dark:text-slate-500 font-normal">(Không bắt buộc)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Mô tả nội dung, mục tiêu kiến thức hoặc hướng dẫn bài thi..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B0F19] text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#4F46E5] dark:focus:border-indigo-500 focus:ring-3 focus:ring-[#EEF2FF] dark:focus:ring-indigo-950/40 transition-all resize-y"
          />
        </div>

        {/* Danh mục & Thời gian làm bài */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Danh mục */}
          <div>
            <SearchableSelect
              label="Danh mục đề thi"
              required
              disabled={categoriesLoading}
              placeholder="-- Chọn danh mục phù hợp --"
              searchPlaceholder="Tìm danh mục đề thi..."
              value={categoryId}
              onChange={(val) => onCategoryChange(val)}
              error={errors.categoryId}
              icon={<Tag className="w-3.5 h-3.5 text-indigo-500" />}
              options={categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
                badge: cat.slug || undefined,
              }))}
            />
          </div>

          {/* Thời gian làm bài */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#4F46E5] dark:text-indigo-400" />
              <span>Thời gian làm bài (Phút)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="360"
                value={timeLimit ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  onTimeLimitChange(val);
                }}
                placeholder="Để trống nếu không giới hạn"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#0F172A] dark:text-slate-100 bg-white dark:bg-[#0B0F19] placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  errors.timeLimit
                    ? "border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40"
                    : "border-[#E2E8F0] dark:border-slate-800 focus:border-[#4F46E5] dark:focus:border-indigo-500 focus:ring-3 focus:ring-[#EEF2FF] dark:focus:ring-indigo-950/40"
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#94A3B8] dark:text-slate-500 pointer-events-none">
                phút
              </span>
            </div>
            {errors.timeLimit && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.timeLimit}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

