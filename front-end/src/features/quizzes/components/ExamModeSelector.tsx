import React from "react";
import type { ExamMode } from "../../../types/attempt.types";
import { BookOpen, Clock, FileCheck2, ClipboardList, Sparkles, ArrowRight } from "lucide-react";

export interface ExamModeOption {
  id: ExamMode;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  accentColor: string;
  bgLight: string;
  bgDark: string;
  borderColor: string;
  features: string[];
}

export const EXAM_MODES_LIST: ExamModeOption[] = [
  {
    id: "PRACTICE",
    name: "Ôn thi",
    tagline: "Học & củng cố kiến thức",
    description: "Không tạo áp lực thời gian. Xem ngay đáp án & lời giải thích chi tiết sau mỗi câu.",
    icon: BookOpen,
    badge: "Tự học linh hoạt",
    accentColor: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50/70",
    bgDark: "dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900/50 hover:border-blue-400",
    features: ["Không giới hạn thời gian", "Giải thích chi tiết từng câu", "Ôn tập theo câu sai"],
  },
  {
    id: "MOCK_EXAM",
    name: "Thi thử",
    tagline: "Mô phỏng kỳ thi thực tế",
    description: "Đồng hồ bấm giờ chuẩn mực, xáo trộn câu hỏi & đáp án, tự động nộp bài khi hết giờ.",
    icon: Clock,
    badge: "Chuẩn thi HUBT",
    accentColor: "text-indigo-600 dark:text-indigo-400",
    bgLight: "bg-indigo-50/70",
    bgDark: "dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-400",
    features: ["Đếm ngược thời gian", "Xáo trộn đề & đáp án", "Chấm điểm chuẩn xác"],
  },
  {
    id: "TEST",
    name: "Kiểm tra",
    tagline: "Đánh giá kiến thức",
    description: "Mô hình bài kiểm tra giữa kỳ, kết thúc chương hoặc đánh giá nhanh theo khung giờ.",
    icon: FileCheck2,
    badge: "Đánh giá định kỳ",
    accentColor: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-50/70",
    bgDark: "dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400",
    features: ["Khung giờ kiểm tra", "Báo cáo phân tích điểm", "Xếp hạng kết quả"],
  },
  {
    id: "ASSIGNMENT",
    name: "Bài tập",
    tagline: "Bài được giao",
    description: "Làm bài tập tự luyện có hạn chót và giới hạn số lần làm bài theo học phần.",
    icon: ClipboardList,
    badge: "Theo dõi tiến độ",
    accentColor: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50/70",
    bgDark: "dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-900/50 hover:border-amber-400",
    features: ["Quản lý hạn nộp", "Theo dõi số lần làm", "Đánh giá hoàn thành"],
  },
  {
    id: "FLASHCARD",
    name: "Flashcard",
    tagline: "Ghi nhớ nhanh",
    description: "Lật thẻ thuật ngữ, định nghĩa và công thức. Đánh giá mức độ ghi nhớ cá nhân.",
    icon: Sparkles,
    badge: "Spaced Repetition",
    accentColor: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50/70",
    bgDark: "dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-900/50 hover:border-purple-400",
    features: ["Lật thẻ 2 mặt", "Ghi nhớ ngắt quãng", "Đo lường độ thuộc bài"],
  },
];

interface ExamModeSelectorProps {
  selectedMode: ExamMode;
  onSelectMode: (mode: ExamMode) => void;
  onStartMode?: (mode: ExamMode) => void;
  disabled?: boolean;
}

export const ExamModeSelector: React.FC<ExamModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
  onStartMode,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {EXAM_MODES_LIST.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <div
              key={mode.id}
              onClick={() => !disabled && onSelectMode(mode.id)}
              className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "border-[#4F46E5] dark:border-indigo-500 bg-white dark:bg-[#111827] shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20"
                  : `bg-white dark:bg-[#111827]/80 ${mode.borderColor} hover:bg-slate-50/60 dark:hover:bg-slate-800/40`
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className={`w-9 h-9 rounded-xl ${mode.bgLight} ${mode.bgDark} ${mode.accentColor} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {mode.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {mode.name}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    — {mode.tagline}
                  </span>
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5 line-clamp-2">
                  {mode.description}
                </p>
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  {mode.features.slice(0, 2).map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {onStartMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartMode(mode.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                      isSelected
                        ? "bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
                    }`}
                  >
                    Bắt đầu
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExamModeSelector;
