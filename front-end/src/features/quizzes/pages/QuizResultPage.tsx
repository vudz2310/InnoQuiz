import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import DashboardLayout from "../../../layouts/Dashboard";
import { attemptApi } from "../../../services/api/Attempt.api";
import { useNotification } from "../../../components/Notification";
import type {
  AttemptResult,
  QuestionResult,
} from "../../../types/attempt.types";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { QuestionContentRenderer } from "../../../components/common/QuestionContentRenderer";


const ScoreMeter: React.FC<{ score: number; score10?: number }> = ({ score, score10 }) => {
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#4f46e5" : "#ef4444";
  const label =
    score >= 80
      ? "Xuất sắc!"
      : score >= 65
      ? "Khá tốt"
      : score >= 50
      ? "Đạt yêu cầu"
      : "Cần cố gắng";

  const display10 = score10 !== undefined ? score10 : Math.round((score / 10) * 10) / 10;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="8"
            className="dark:stroke-slate-800"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${score * 2.51} 251`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-3xl font-black text-[#0F172A] dark:text-white">
            {display10}
            <span className="text-xs font-semibold text-slate-400">/10</span>
          </span>
          <span className="text-xs font-bold" style={{ color }}>
            {score}% • {label}
          </span>
        </div>
      </div>
    </div>
  );
};

const QuestionResultCard: React.FC<{ qr: QuestionResult; index: number }> = ({
  qr,
  index,
}) => {
  const [expanded, setExpanded] = useState(!qr.isCorrect);

  return (
    <div
      className={`rounded-2xl border transition-all ${
        qr.isCorrect
          ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20"
          : "border-red-200 dark:border-red-800/60 bg-red-50/40 dark:bg-red-950/20"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {qr.isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B] dark:text-slate-400 font-bold">
                Câu {index + 1}
              </span>
              {!qr.isCorrect && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                  Cần ôn lại
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate mt-0.5">
              {qr.content}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              qr.isCorrect
                ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                : "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300"
            }`}
          >
            {qr.pointsEarned}/{qr.points} điểm
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[#E2E8F0]/60 dark:border-slate-800/60 pt-4 space-y-3">
          <div className="text-sm text-slate-800 dark:text-slate-200 font-medium">
            <QuestionContentRenderer content={qr.content} />
          </div>

          <div className="space-y-2">
            {qr.answers.map((a, aIdx) => {
              const isSelected = a.id === qr.selectedAnswerId;
              const isCorrectAnswer = a.isCorrect;
              let cls =
                "text-[#475569] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B0F19]";
              if (isCorrectAnswer)
                cls =
                  "text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 font-bold";
              if (isSelected && !isCorrectAnswer)
                cls =
                  "text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 font-semibold line-through";

              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs transition-all ${cls}`}
                >
                  <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0">
                    {String.fromCharCode(65 + aIdx)}
                  </span>
                  <span className="flex-1">{a.content}</span>
                  {isCorrectAnswer && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đáp án đúng
                    </span>
                  )}
                  {isSelected && !isCorrectAnswer && (
                    <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Bạn chọn sai
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {qr.explanation && (
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs">
              <p className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Giải thích kiến thức:
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {qr.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const QuizResultPage: React.FC = () => {
  const { id: quizId, attemptId } = useParams<{
    id: string;
    attemptId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState<AttemptResult | null>(
    (location.state as { result?: AttemptResult } | null)?.result || null
  );
  const [loading, setLoading] = useState(!result);
  const [practicingWrong, setPracticingWrong] = useState(false);

  useEffect(() => {
    if (result || !attemptId) return;
    attemptApi
      .getResult(attemptId)
      .then((data) => setResult(data))
      .catch(() => navigate(quizId ? `/quiz/${quizId}` : "/explore"))
      .finally(() => setLoading(false));
  }, [result, attemptId, quizId, navigate]);

  const [retaking, setRetaking] = useState(false);
  const { showError } = useNotification();

  const handleRetake = async () => {
    if (!result) return;
    try {
      setRetaking(true);
      const session = await attemptApi.startSession({
        quizId: result.quizId,
        mode: result.mode || "MOCK_EXAM",
        config: result.config || {},
      });
      navigate(`/quiz/${result.quizId}/take/${session.sessionId || session.attemptId}`, {
        state: { attempt: session },
      });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      showError("Không thể thi lại", apiError.response?.data?.message || "Không thể thi lại. Đang chuyển về trang đề thi...");
      navigate(`/quiz/${result.quizId}?mode=${result.mode || "MOCK_EXAM"}`);
    } finally {
      setRetaking(false);
    }
  };

  const handlePracticeWrongAnswers = async () => {
    if (!result) return;
    try {
      setPracticingWrong(true);
      const session = await attemptApi.startWrongAnswersPractice(result.quizId);
      navigate(`/quiz/${result.quizId}/take/${session.sessionId || session.attemptId}`, {
        state: { attempt: session },
      });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      showError("Lỗi ôn tập", apiError.response?.data?.message || "Không thể khởi tạo ôn tập câu sai.");
    } finally {
      setPracticingWrong(false);
    }
  };

  if (loading || !result) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const wrongCount = result.incorrectAnswers ?? result.totalQuestions - result.correctAnswers;
  const timeTaken = result.timeTakenSeconds;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Result Hero Card */}
        <div className="bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs mb-8">
          <div
            className={`h-2 ${
              result.isPassed
                ? "bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500"
                : "bg-gradient-to-r from-red-400 via-rose-500 to-amber-500"
            }`}
          />
          <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8">
            <ScoreMeter score={result.score} score10={result.score10} />

            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    result.isPassed
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                  }`}
                >
                  {result.isPassed ? "✓ Đạt yêu cầu môn học" : "✕ Chưa đạt yêu cầu"}
                </span>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Chế độ: {result.mode === "PRACTICE" ? "Ôn thi" : result.mode === "TEST" ? "Kiểm tra" : result.mode === "ASSIGNMENT" ? "Bài tập" : result.mode === "FLASHCARD" ? "Flashcard" : "Thi thử"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                {result.isPassed ? "Chúc mừng bạn đã hoàn thành!" : "Hãy kiên trì ôn luyện nhé!"}
              </h1>

              <p className="text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
                Đề thi: <strong className="text-slate-800 dark:text-slate-200">{result.quizTitle}</strong>
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    ✓ Câu đúng
                  </p>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {result.correctAnswers} / {result.totalQuestions}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-center">
                  <p className="text-[11px] text-red-700 dark:text-red-300 font-semibold">
                    ✕ Câu sai
                  </p>
                  <p className="text-lg font-black text-red-700 dark:text-red-300">
                    {wrongCount} câu
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center">
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold">
                    Tỷ lệ đúng
                  </p>
                  <p className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                    {result.score}%
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Thời gian
                  </p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200">
                    {timeTaken !== null && timeTaken !== undefined
                      ? `${Math.floor(timeTaken / 60)}p ${timeTaken % 60}s`
                      : "--"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer - Mobile Optimized Touch Targets min 48px */}
          <div className="px-5 sm:px-8 py-5 bg-slate-50 dark:bg-[#0B0F19] border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              {/* Direct Retake button */}
              <button
                type="button"
                onClick={handleRetake}
                disabled={retaking}
                className="h-12 min-h-[48px] px-5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-indigo-500/20 disabled:opacity-60 active:scale-98"
              >
                {retaking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Thi lại ngay ({result.mode === "PRACTICE" ? "Ôn thi" : result.mode === "TEST" ? "Kiểm tra" : result.mode === "ASSIGNMENT" ? "Bài tập" : result.mode === "FLASHCARD" ? "Flashcard" : "Thi thử"})</span>
              </button>

              {/* Change Mode button */}
              <button
                type="button"
                onClick={() => navigate(`/quiz/${result.quizId}?mode=${result.mode || "MOCK_EXAM"}`)}
                className="h-12 min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <span>Đổi hình thức thi</span>
              </button>

              {/* Practice Wrong Answers button */}
              {wrongCount > 0 && (
                <button
                  type="button"
                  onClick={handlePracticeWrongAnswers}
                  disabled={practicingWrong}
                  className="h-12 min-h-[48px] px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-amber-500/20 cursor-pointer disabled:opacity-60 active:scale-98"
                >
                  {practicingWrong ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Ôn tập {wrongCount} câu làm sai</span>
                </button>
              )}
            </div>

            <Link
              to="/explore"
              className="h-12 min-h-[48px] px-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shrink-0 active:scale-98"
            >
              <Home className="w-4 h-4" />
              <span>Kho đề thi</span>
            </Link>
          </div>
        </div>


        {/* Detailed Question Review */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                Xem lại đáp án chi tiết
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhấn vào từng câu hỏi để xem đáp án đúng và lời giải thích học phần.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {result.questionResults.map((qr, idx) => (
              <QuestionResultCard key={qr.questionId} qr={qr} index={idx} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuizResultPage;
