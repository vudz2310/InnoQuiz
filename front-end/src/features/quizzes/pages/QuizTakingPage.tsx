import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { attemptApi } from "../../../services/api/Attempt.api";
import type {
  StartAttemptResponse,
  AttemptAnswer,
  ExamMode,
} from "../../../types/attempt.types";
import { ExamSubmitModal } from "../components/ExamSubmitModal";
import { FlashcardView } from "../components/FlashcardView";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle,
  ListOrdered,
  X,
} from "lucide-react";
import { QuestionContentRenderer } from "../../../components/common/QuestionContentRenderer";
import { useNotification } from "../../../components/Notification";
import { getErrorMessage } from "../../../utils/errorMessage";
import { getMediaUrl } from "../../../utils/media";
import { LazyImage } from "../../../components/ui/LazyImage";

export const QuizTakingPage: React.FC = () => {
  const { id: quizId, attemptId: routeAttemptId } = useParams<{
    id: string;
    attemptId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const submittingRef = useRef(false);
  const { showError } = useNotification();

  const [attempt, setAttempt] = useState<StartAttemptResponse | null>(
    (location.state as { attempt?: StartAttemptResponse } | null)?.attempt || null
  );
  const [loading, setLoading] = useState(!attempt);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<
    Record<
      string,
      {
        isCorrect: boolean;
        explanation?: string | null;
        correctAnswerId?: string | null;
        pointsEarned?: number;
      }
    >
  >({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);

  const sessionId = attempt?.sessionId || attempt?.attemptId || routeAttemptId;

  // 1. Load active session data
  useEffect(() => {
    if (attempt) {
      if (attempt.userAnswers) {
        setUserAnswers(attempt.userAnswers);
      }
      if (attempt.remainingSeconds !== undefined && attempt.remainingSeconds !== null) {
        setTimeLeft(attempt.remainingSeconds);
      } else if (attempt.duration) {
        setTimeLeft(attempt.duration);
      } else if (attempt.timeLimit && attempt.mode === "MOCK_EXAM") {
        setTimeLeft(attempt.timeLimit * 60);
      }
      return;
    }

    if (sessionId) {
      setLoading(true);
      attemptApi
        .getSession(sessionId)
        .then((data) => {
          setAttempt(data);
          if (data.userAnswers) setUserAnswers(data.userAnswers);
          if (data.remainingSeconds !== undefined && data.remainingSeconds !== null) {
            setTimeLeft(data.remainingSeconds);
          } else if (data.duration) {
            setTimeLeft(data.duration);
          }
        })
        .catch((err: unknown) => {
          if (quizId) {
            attemptApi
              .startSession({ quizId, mode: "MOCK_EXAM" })
              .then((data) => {
                setAttempt(data);
                if (data.duration) setTimeLeft(data.duration);
              })
              .catch((startErr: unknown) => {
                setError(
                  getErrorMessage(
                    startErr,
                    "Không thể tải phiên làm bài. Vui lòng quay lại trang đề thi.",
                  ),
                );
              });
          } else {
            setError(getErrorMessage(err, "Không tìm thấy phiên làm bài thi."));
          }
        })
        .finally(() => setLoading(false));
    } else if (quizId) {
      setLoading(true);
      attemptApi
        .startSession({ quizId, mode: "MOCK_EXAM" })
        .then((data) => {
          setAttempt(data);
          if (data.duration) setTimeLeft(data.duration);
        })
        .catch((err: unknown) => {
          setError(getErrorMessage(err, "Không thể bắt đầu bài thi. Vui lòng thử lại."));
        })
        .finally(() => setLoading(false));
    }
  }, [attempt, sessionId, quizId]);

  // 2. Countdown Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(interval);
          if (!submittingRef.current) {
            handleSubmit();
          }
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft !== null]);

  // Gom nhóm và sắp xếp câu hỏi TUẦN TỰ theo từng phần:
  // Toàn bộ câu hỏi Phần 1 -> Toàn bộ câu hỏi Phần 2 -> Toàn bộ câu hỏi Phần 3
  const { sections, questions } = useMemo(() => {
    const rawSections = attempt?.sections || [];
    const rawQuestions = attempt?.questions || [];

    if (rawSections.length > 0) {
      // 1. Sắp xếp các sections theo order
      const sortedSections = [...rawSections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      // 2. Gom đúng các câu hỏi của từng section, sắp xếp theo order của câu hỏi
      const structuredSections = sortedSections.map((sec, sIdx) => {
        const secQuestions = rawQuestions
          .filter((q) => (q.sectionId && q.sectionId === sec.id) || (!q.sectionId && sIdx === 0))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return {
          id: sec.id,
          title: sec.title || `Phần ${sIdx + 1}`,
          order: sec.order || sIdx + 1,
          questions: secQuestions,
        };
      });

      // 3. Mảng câu hỏi tuần tự toàn bài: Hết Phần 1 -> sang Phần 2 -> sang Phần 3
      const orderedQuestions = structuredSections.flatMap((s) => s.questions);

      return {
        sections: structuredSections,
        questions: orderedQuestions.length > 0 ? orderedQuestions : rawQuestions,
      };
    }

    return {
      sections: [
        {
          id: "default",
          title: "Đề thi",
          order: 1,
          questions: rawQuestions,
        },
      ],
      questions: rawQuestions,
    };
  }, [attempt?.sections, attempt?.questions]);

  // Determine current question & section
  const currentQuestion = questions[currentIndex];

  const currentSection = useMemo(() => {
    if (!currentQuestion) return sections[0];
    return (
      sections.find((s) => s.questions.some((q) => q.id === currentQuestion.id)) ||
      sections[0]
    );
  }, [sections, currentQuestion]);

  // Question index inside active section
  const currentSectionQuestionIndex = useMemo(() => {
    if (!currentSection || !currentQuestion) return 0;
    const idx = currentSection.questions.findIndex((q) => q.id === currentQuestion.id);
    return idx >= 0 ? idx : 0;
  }, [currentSection, currentQuestion]);

  const currentSectionIdx = sections.findIndex((s) => s.id === currentSection?.id);
  const isLastQuestionInSection =
    currentSection &&
    currentSectionQuestionIndex === currentSection.questions.length - 1;
  const nextSection =
    currentSectionIdx >= 0 && currentSectionIdx < sections.length - 1
      ? sections[currentSectionIdx + 1]
      : null;

  // 3. Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitModalOpen || submitting) return;
      if (!attempt || !questions.length || attempt.mode === "FLASHCARD") return;

      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      // Select option with 1, 2, 3, 4 or A, B, C, D
      const key = e.key.toUpperCase();
      const optionIndex = ["1", "2", "3", "4"].includes(key)
        ? parseInt(key, 10) - 1
        : ["A", "B", "C", "D"].indexOf(key);

      if (optionIndex >= 0 && optionIndex < currentQ.answers.length) {
        const targetAns = currentQ.answers[optionIndex];
        handleSelectAnswer(currentQ.id, targetAns.id);
      }

      // Navigate prev / next
      if (e.key === "ArrowLeft") {
        setCurrentIndex((p) => Math.max(0, p - 1));
      } else if (e.key === "ArrowRight") {
        handleNextQuestion();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questions, isSubmitModalOpen, submitting]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 4. Handle selecting answer
  const handleSelectAnswer = async (questionId: string, answerId: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answerId }));

    if (sessionId) {
      try {
        const res = await attemptApi.saveAnswer(sessionId, {
          questionId,
          answerId,
          selectedAnswerIds: [answerId],
        });

        // If Practice mode with immediate feedback
        if (res.isCorrect !== undefined) {
          setPracticeFeedback((prev) => ({
            ...prev,
            [questionId]: {
              isCorrect: res.isCorrect!,
              explanation: res.explanation,
              correctAnswerId: res.correctAnswerId,
              pointsEarned: res.pointsEarned,
            },
          }));
        }
      } catch (err: unknown) {
        console.error("Auto save answer error:", err);
      }
    }
  };

  // Chuyển sang câu hỏi tiếp theo tuần tự và mượt mà (không chặn popup nhảy cóc phần)
  const handleNextQuestion = () => {
    setCurrentIndex((p) => Math.min(questions.length - 1, p + 1));
  };

  // 5. Submit handler
  const handleSubmit = useCallback(async () => {
    const activeSessionId = attempt?.sessionId || attempt?.attemptId || sessionId;
    if (submittingRef.current || !activeSessionId || !attempt) return;
    submittingRef.current = true;
    setSubmitting(true);
    setIsSubmitModalOpen(false);

    const answers: AttemptAnswer[] = (attempt.questions || []).map((q) => ({
      questionId: q.id,
      answerId: userAnswers[q.id] || null,
      selectedAnswerIds: userAnswers[q.id] ? [userAnswers[q.id]] : [],
    }));

    try {
      const result = await attemptApi.submitSession(activeSessionId, answers);
      const targetQuizId = attempt.quizId || quizId;
      navigate(`/quiz/${targetQuizId}/result/${activeSessionId}`, {
        state: { result },
        replace: true,
      });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      showError("Không thể nộp bài", apiError.response?.data?.message || "Không thể nộp bài. Vui lòng thử lại.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [attempt, sessionId, userAnswers, quizId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Đang khởi tạo phiên làm bài...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-base font-semibold text-[#0F172A] dark:text-white text-center max-w-md">
          {error || "Không tìm thấy bài thi"}
        </p>
        <button
          onClick={() => (quizId ? navigate(`/quiz/${quizId}`) : navigate("/explore"))}
          className="btn-secondary text-xs"
        >
          Quay lại trang đề thi
        </button>
      </div>
    );
  }

  const mode: ExamMode = attempt.mode || "MOCK_EXAM";
  const isPracticeMode = mode === "PRACTICE";
  const isFlashcardMode = mode === "FLASHCARD";
  const totalAnswered = Object.keys(userAnswers).length;
  const progressPct =
    questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isTimeCritical = timeLeft !== null && timeLeft <= 60;
  const currentFeedback = currentQuestion ? practiceFeedback[currentQuestion.id] : null;

  // Question numbering display within section
  const sectionQuestionNum = currentQuestion?.order || currentSectionQuestionIndex + 1;
  const totalQuestionsInSection = currentSection?.questions.length || 1;

  // Flashcard Mode View
  if (isFlashcardMode) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <div className="sticky top-0 z-40 bg-white dark:bg-[#111827] border-b border-[#E2E8F0] dark:border-slate-800 shadow-xs">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Flashcard
              </span>
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 truncate max-w-xs">
                {attempt.title}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Kết thúc
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <FlashcardView
            questions={questions}
            onFinish={() => handleSubmit()}
          />
        </div>
      </div>
    );
  }

  // Standard / Practice / Mock / Test Mode View
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* ===== STICKY TOP BAR ===== */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#111827] border-b border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  isPracticeMode
                    ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                    : mode === "TEST"
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                    : mode === "ASSIGNMENT"
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                    : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                }`}
              >
                {isPracticeMode
                  ? "Ôn thi"
                  : mode === "TEST"
                  ? "Kiểm tra"
                  : mode === "ASSIGNMENT"
                  ? "Bài tập"
                  : "Thi thử"}
              </span>
              <p className="text-xs font-bold text-[#0F172A] dark:text-white truncate">
                {attempt.title}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-[#F1F5F9] dark:bg-slate-800 rounded-full overflow-hidden max-w-[180px]">
                <div
                  className="h-full bg-[#4F46E5] rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-[#4F46E5] dark:text-indigo-400 whitespace-nowrap">
                {totalAnswered}/{questions.length} câu
              </span>
            </div>
          </div>

          {/* Timer display */}
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm transition-colors ${
                isTimeCritical
                  ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 animate-pulse"
                  : "border-[#C7D2FE] dark:border-indigo-800 bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              {formatTime(timeLeft)}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer shadow-sm shadow-emerald-600/20"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isPracticeMode ? "Hoàn thành ôn tập" : "Nộp bài"}</span>
          </button>
        </div>

        {/* Section Navigation Tabs - Show always if there are named sections */}
        {(sections.length > 1 || (sections.length === 1 && sections[0].id !== "default")) && (
          <div className="max-w-5xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800/80 scrollbar-none">
            {sections.map((sec, secIdx) => {
              const isActive = currentSection?.id === sec.id;
              const answeredInSec = sec.questions.filter((q) => userAnswers[q.id]).length;
              const firstQIndex = questions.findIndex((q) => q.id === sec.questions[0]?.id);

              return (
                <button
                  key={sec.id || secIdx}
                  type="button"
                  onClick={() => {
                    if (firstQIndex >= 0) setCurrentIndex(firstQIndex);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{sec.title}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {answeredInSec}/{sec.questions.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Left Question Card */}
        <div className="flex-1">
          <div className="bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {currentSection && currentSection.id !== "default" && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold border border-indigo-100 dark:border-indigo-900 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {currentSection.title}
                  </span>
                )}
                <span className="badge-primary text-xs font-bold">
                  Câu {currentIndex + 1} / {questions.length}
                  {sections.length > 1 && currentSection && currentSection.id !== "default" && (
                    <span className="ml-1 opacity-80 font-normal">
                      ({currentSectionQuestionIndex + 1}/{totalQuestionsInSection})
                    </span>
                  )}
                </span>
                {isPracticeMode && currentFeedback && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      currentFeedback.isCorrect
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                    }`}
                  >
                    {currentFeedback.isCorrect ? (
                      <><CheckCircle2 className="w-3 h-3" /> Chính xác</>
                    ) : (
                      <><XCircle className="w-3 h-3" /> Chưa đúng</>
                    )}
                  </span>
                )}
              </div>
              <span className="text-xs text-[#94A3B8] dark:text-slate-500 font-semibold shrink-0">
                {currentQuestion.points || 1} điểm
              </span>
            </div>

            <div className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white leading-relaxed">
              <QuestionContentRenderer content={currentQuestion.content} />
              {currentQuestion.media && currentQuestion.media.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {currentQuestion.media.map((media) => (
                    <LazyImage
                      key={media.id}
                      src={getMediaUrl(media.url || media.storageKey)}
                      alt="Hình minh họa câu hỏi"
                      maxHeightClass="max-h-60"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.answers.map((answer, aIdx) => {
                const isSelected = userAnswers[currentQuestion.id] === answer.id;
                const isPracticeChecked = isPracticeMode && !!currentFeedback;
                const isCorrectOption =
                  isPracticeChecked &&
                  (answer.id === currentFeedback.correctAnswerId || answer.isCorrect);
                const isWrongSelection =
                  isPracticeChecked && isSelected && !currentFeedback.isCorrect;

                let borderCls =
                  "border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B0F19] hover:border-[#C7D2FE] dark:hover:border-indigo-700";
                let textCls = "text-[#334155] dark:text-slate-300";
                let circleCls =
                  "border-[#CBD5E1] dark:border-slate-700 text-[#64748B] dark:text-slate-400";

                if (isSelected) {
                  borderCls =
                    "border-[#4F46E5] dark:border-indigo-500 bg-[#EEF2FF] dark:bg-indigo-950/60 ring-1 ring-[#4F46E5]";
                  textCls = "text-[#4F46E5] dark:text-indigo-300 font-semibold";
                  circleCls =
                    "border-[#4F46E5] dark:border-indigo-400 bg-[#4F46E5] dark:bg-indigo-500 text-white";
                }

                if (isCorrectOption) {
                  borderCls =
                    "border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500";
                  textCls = "text-emerald-800 dark:text-emerald-200 font-bold";
                  circleCls = "border-emerald-500 bg-emerald-500 text-white";
                } else if (isWrongSelection) {
                  borderCls =
                    "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/40";
                  textCls = "text-red-700 dark:text-red-300 line-through font-semibold";
                  circleCls = "border-red-500 bg-red-500 text-white";
                }

                return (
                  <button
                    key={answer.id}
                    type="button"
                    onClick={() => handleSelectAnswer(currentQuestion.id, answer.id)}
                    className={`w-full text-left min-h-[52px] sm:min-h-[56px] px-4 py-3.5 rounded-xl border-2 transition-all flex items-start gap-3.5 cursor-pointer active:scale-[0.99] group ${borderCls}`}
                  >
                    <div
                      className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${circleCls}`}
                    >
                      {String.fromCharCode(65 + aIdx)}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <span className={`text-sm sm:text-base leading-relaxed ${textCls}`}>
                        {answer.content}
                        {answer.media && answer.media.length > 0 && (
                          <span className="mt-2 flex flex-wrap gap-2 block">
                            {answer.media.map((media) => (
                              <LazyImage
                                key={media.id}
                                src={getMediaUrl(media.url || media.storageKey)}
                                alt="Hình ảnh đáp án"
                                maxHeightClass="max-h-36"
                              />
                            ))}
                          </span>
                        )}
                      </span>
                    </div>
                    {isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    )}
                    {isWrongSelection && (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Practice Mode Explanation Box */}
            {isPracticeMode && currentFeedback && (
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Giải thích chi tiết & Đáp án đúng:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUserAnswers((prev) => {
                        const next = { ...prev };
                        delete next[currentQuestion.id];
                        return next;
                      });
                      setPracticeFeedback((prev) => {
                        const next = { ...prev };
                        delete next[currentQuestion.id];
                        return next;
                      });
                    }}
                    className="text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Làm lại câu này
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentFeedback.explanation ||
                    currentQuestion.explanation ||
                    "Đáp án đúng là lựa chọn được tô viền xanh lá. Hãy ghi nhớ kiến thức trọng tâm này cho kỳ thi thật."}
                </p>
              </div>
            )}

            {/* Navigation buttons - Desktop & Tablet Inline */}
            <div className="flex items-center justify-between pt-5 border-t border-[#F1F5F9] dark:border-slate-800 gap-3">
              <button
                type="button"
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
                className="min-h-[48px] px-5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-[#475569] dark:text-slate-300 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-98"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <div className="flex items-center gap-2.5">
                {isLastQuestion ? (
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(true)}
                    disabled={submitting}
                    className="min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer shadow-sm shadow-emerald-600/20 active:scale-98"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isPracticeMode ? "Hoàn thành" : "Nộp bài"}</span>
                  </button>
                ) : isLastQuestionInSection && nextSection ? (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="min-h-[48px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-indigo-600/20 animate-in fade-in active:scale-98"
                    title={`Hoàn thành các câu trong ${currentSection.title}. Chuyển sang ${nextSection.title}`}
                  >
                    <span>Sang {nextSection.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm"
                  >
                    <span>Câu tiếp</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Navigator Sidebar Grouped By Section (Desktop Only >= 1024px) */}
        <div className="hidden lg:block lg:w-64 shrink-0">
          <div className="bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-4 shadow-xs sticky top-20 space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">
                Mục lục câu hỏi
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                {totalAnswered}/{questions.length}
              </span>
            </div>

            {/* Sections Questions Grid */}
            <div className="space-y-4">
              {sections.map((sec, secIdx) => {
                return (
                  <div key={sec.id || secIdx} className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span className="truncate max-w-[150px] flex items-center gap-1">
                        <Layers className="w-3 h-3 text-indigo-400" />
                        {sec.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {sec.questions.filter((q) => userAnswers[q.id]).length}/{sec.questions.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {sec.questions.map((q, qLocalIdx) => {
                        const globalIdx = questions.findIndex((gq) => gq.id === q.id);
                        const answered = !!userAnswers[q.id];
                        const isCurrent = globalIdx === currentIndex;
                        const feedback = practiceFeedback[q.id];
                        const questionDisplayNumber = q.order || qLocalIdx + 1;

                        let cellCls =
                          "bg-[#F1F5F9] dark:bg-slate-800 text-[#64748B] dark:text-slate-400 hover:bg-[#E2E8F0] dark:hover:bg-slate-700";

                        if (isCurrent) {
                          cellCls = "bg-[#4F46E5] text-white ring-2 ring-[#4F46E5]/30 font-extrabold";
                        } else if (isPracticeMode && feedback) {
                          cellCls = feedback.isCorrect
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300";
                        } else if (answered) {
                          cellCls =
                            "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
                        }

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              if (globalIdx >= 0) setCurrentIndex(globalIdx);
                            }}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${cellCls}`}
                            title={`${sec.title} - Câu ${questionDisplayNumber}${answered ? " (đã chọn)" : ""}`}
                          >
                            {questionDisplayNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-[#F1F5F9] dark:border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 flex items-center justify-center">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                </div>
                <span className="text-slate-600 dark:text-slate-400">
                  Đã trả lời ({totalAnswered})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-[#F1F5F9] dark:bg-slate-800" />
                <span className="text-slate-600 dark:text-slate-400">
                  Chưa làm ({questions.length - totalAnswered})
                </span>
              </div>
            </div>

            {/* Shortcuts hint */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300">Phím tắt nhanh:</p>
              <p>• Phím 1-4 hoặc A-D: Chọn đáp án</p>
              <p>• Phím ← / →: Đổi câu hỏi</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE BOTTOM BAR (STICKY) ===== */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 shadow-lg">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            className="h-12 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trước</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobilePaletteOpen(true)}
            className="h-12 px-4 flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
          >
            <ListOrdered className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Mục lục ({totalAnswered}/{questions.length})</span>
          </button>

          {isLastQuestion ? (
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              disabled={submitting}
              className="h-12 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Nộp</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="h-12 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
            >
              <span>Tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ===== MOBILE DRAWER / BOTTOM SHEET (VUỐT LÊN) ===== */}
      {isMobilePaletteOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobilePaletteOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-[#111827] rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl max-h-[82vh] flex flex-col space-y-4 animate-in slide-in-from-bottom duration-300">
            {/* Drawer Drag Pill */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Mục lục câu hỏi ({attempt.title})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Đã hoàn thành {totalAnswered} / {questions.length} câu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobilePaletteOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                aria-label="Đóng mục lục"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Palette inside Drawer */}
            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {sections.map((sec, secIdx) => {
                return (
                  <div key={sec.id || secIdx} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="truncate max-w-[200px] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        {sec.title}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {sec.questions.filter((q) => userAnswers[q.id]).length}/{sec.questions.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                      {sec.questions.map((q, qLocalIdx) => {
                        const globalIdx = questions.findIndex((gq) => gq.id === q.id);
                        const answered = !!userAnswers[q.id];
                        const isCurrent = globalIdx === currentIndex;
                        const feedback = practiceFeedback[q.id];
                        const questionDisplayNumber = q.order || qLocalIdx + 1;

                        let cellCls =
                          "bg-[#F1F5F9] dark:bg-slate-800 text-[#64748B] dark:text-slate-400";

                        if (isCurrent) {
                          cellCls = "bg-[#4F46E5] text-white ring-2 ring-[#4F46E5]/30 font-extrabold";
                        } else if (isPracticeMode && feedback) {
                          cellCls = feedback.isCorrect
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300";
                        } else if (answered) {
                          cellCls =
                            "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
                        }

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              if (globalIdx >= 0) {
                                setCurrentIndex(globalIdx);
                                setIsMobilePaletteOpen(false);
                              }
                            }}
                            className={`min-h-[44px] h-11 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 ${cellCls}`}
                          >
                            {questionDisplayNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Mobile Legend */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300" />
                  <span className="text-slate-600 dark:text-slate-400">Đã làm ({totalAnswered})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#F1F5F9] dark:bg-slate-800" />
                  <span className="text-slate-600 dark:text-slate-400">Chưa làm ({questions.length - totalAnswered})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ExamSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleSubmit}
        submitting={submitting}
        totalQuestions={questions.length}
        answeredCount={totalAnswered}
      />
    </div>
  );
};

export default QuizTakingPage;
