import React, { useState } from "react";
import type { ExamConfig, ExamMode } from "../../../types/attempt.types";
import { EXAM_MODES_LIST } from "./ExamModeSelector";
import { X, Sliders, Shuffle, Play, Loader2 } from "lucide-react";

interface ExamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ExamMode;
  maxQuestions: number;
  defaultTimeLimit?: number | null;
  onConfirm: (config: Partial<ExamConfig>) => void;
  loading?: boolean;
}

export const ExamConfigModal: React.FC<ExamConfigModalProps> = ({
  isOpen,
  onClose,
  mode,
  maxQuestions,
  defaultTimeLimit,
  onConfirm,
  loading = false,
}) => {
  const [questionCount, setQuestionCount] = useState<number>(maxQuestions || 20);
  const [duration, setDuration] = useState<number>(defaultTimeLimit || 30);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showAnswerImmediately, setShowAnswerImmediately] = useState(
    mode === "PRACTICE" || mode === "FLASHCARD"
  );
  const [showExplanation, setShowExplanation] = useState(
    mode === "PRACTICE" || mode === "FLASHCARD"
  );
  const [source, setSource] = useState<"ALL" | "WRONG_ANSWERS">("ALL");

  if (!isOpen) return null;

  const modeInfo = EXAM_MODES_LIST.find((m) => m.id === mode) || EXAM_MODES_LIST[0];

  const handleStart = () => {
    onConfirm({
      mode,
      questionCount: Number(questionCount) || maxQuestions,
      duration: mode === "PRACTICE" || mode === "FLASHCARD" ? undefined : Number(duration),
      shuffleQuestions,
      shuffleOptions,
      showAnswerImmediately:
        mode === "PRACTICE" || mode === "FLASHCARD" ? true : showAnswerImmediately,
      showExplanation: mode === "PRACTICE" || mode === "FLASHCARD" ? true : showExplanation,
      source,
    });
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${modeInfo.bgLight} ${modeInfo.bgDark} ${modeInfo.accentColor} flex items-center justify-center`}>
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cấu hình chế độ: {modeInfo.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{modeInfo.tagline}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Question Count */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Số lượng câu hỏi
              </label>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {questionCount} / {maxQuestions} câu
              </span>
            </div>
            <input
              type="range"
              min={Math.min(5, maxQuestions)}
              max={maxQuestions}
              step={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{Math.min(5, maxQuestions)} câu</span>
              <span>Toàn bộ ({maxQuestions} câu)</span>
            </div>
          </div>

          {/* Time Limit (if Mock exam or test) */}
          {(mode === "MOCK_EXAM" || mode === "TEST") && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Thời gian làm bài (Phút)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          )}

          {/* Source options (Practice only) */}
          {mode === "PRACTICE" && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Phạm vi ôn tập
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSource("ALL")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    source === "ALL"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <p className="font-bold">Toàn bộ câu hỏi</p>
                  <p className="text-[10px] opacity-75 mt-0.5">Ôn ngẫu nhiên trong đề</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSource("WRONG_ANSWERS")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    source === "WRONG_ANSWERS"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <p className="font-bold">Chỉ câu từng làm sai</p>
                  <p className="text-[10px] opacity-75 mt-0.5">Tập trung sửa lỗi sai</p>
                </button>
              </div>
            </div>
          )}

          {/* Toggle Switches */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Xáo trộn thứ tự câu hỏi
                  </p>
                  <p className="text-[10px] text-slate-400">Đảo vị trí câu hỏi ngẫu nhiên</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Xáo trộn thứ tự đáp án (A, B, C, D)
                  </p>
                  <p className="text-[10px] text-slate-400">Tránh ghi nhớ vị trí đáp án</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </label>

            {mode === "PRACTICE" && (
              <>
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Hiển thị đáp án ngay sau khi chọn
                    </p>
                    <p className="text-[10px] text-slate-400">Xem đúng/sai tức thì</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showAnswerImmediately}
                    onChange={(e) => setShowAnswerImmediately(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Hiển thị giải thích chi tiết
                    </p>
                    <p className="text-[10px] text-slate-400">Xem kiến thức trọng tâm</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showExplanation}
                    onChange={(e) => setShowExplanation(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>
              </>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0B0F19] border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang chuẩn bị...</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> Bắt đầu ngay</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamConfigModal;
