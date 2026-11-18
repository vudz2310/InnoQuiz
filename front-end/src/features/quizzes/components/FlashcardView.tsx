import React, { useState } from "react";
import type { AttemptQuestion } from "../../../types/attempt.types";
import { Sparkles, RotateCw, CheckCircle2, XCircle, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

interface FlashcardViewProps {
  questions: AttemptQuestion[];
  onFinish: (stats: { masteredCount: number; needsReviewCount: number }) => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ questions, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [needsReviewIds, setNeedsReviewIds] = useState<Set<string>>(new Set());

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không có flashcard nào.</p>
      </div>
    );
  }

  const currentCard = questions[currentIndex];
  const correctAnswer = currentCard.answers.find((a) => a.isCorrect) || currentCard.answers[0];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onFinish({
        masteredCount: masteredIds.size,
        needsReviewCount: needsReviewIds.size,
      });
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleMarkMastered = () => {
    setMasteredIds((prev) => new Set([...prev, currentCard.id]));
    setNeedsReviewIds((prev) => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  };

  const handleMarkNeedsReview = () => {
    setNeedsReviewIds((prev) => new Set([...prev, currentCard.id]));
    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  };

  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Thẻ {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Mastered / Needs Review Stats */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> {masteredIds.size} Đã nhớ
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <XCircle className="w-3.5 h-3.5" /> {needsReviewIds.size} Cần ôn lại
          </span>
        </div>
      </div>

      {/* Progress line */}
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={() => setIsFlipped((prev) => !prev)}
        className="min-h-[320px] sm:min-h-[360px] bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 rounded-3xl p-8 sm:p-10 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-lg shadow-purple-500/5 select-none relative group"
      >
        {/* Flip Tag */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            {isFlipped ? "Mặt sau: Đáp án & Giải thích" : "Mặt trước: Câu hỏi"}
          </span>
          <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium group-hover:scale-105 transition-transform">
            <RotateCw className="w-3 h-3" />
            {isFlipped ? "Xem lại câu hỏi" : "Bấm để lật thẻ"}
          </span>
        </div>

        {/* Card Content */}
        <div className="my-auto py-6 text-center">
          {!isFlipped ? (
            <div className="space-y-4">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                Câu hỏi {currentIndex + 1}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentCard.content}
              </h2>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
                  ✓ Đáp án chính xác
                </span>
                <p className="text-lg sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  {correctAnswer ? correctAnswer.content : "Đang cập nhật đáp án"}
                </p>
              </div>

              {currentCard.explanation && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    Giải thích chi tiết:
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {currentCard.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center">
          <span className="text-[11px] text-slate-400">
            {isFlipped ? "Đánh giá mức độ nhớ của bạn bên dưới" : "Chạm vào thẻ để xem đáp án"}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="space-y-3">
        {isFlipped ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleMarkNeedsReview}
              className="py-3.5 px-4 rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-amber-600" />
              Chưa nhớ (Ôn lại)
            </button>
            <button
              type="button"
              onClick={handleMarkMastered}
              className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Đã nhớ (Thuộc)
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Thẻ trước
            </button>
            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-500/20 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              Xem đáp án
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              Thẻ sau
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardView;
