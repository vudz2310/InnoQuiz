import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import DashboardLayout from "../../../layouts/Dashboard";
import { quizApi } from "../../../services/api/Quiz.api";
import { attemptApi } from "../../../services/api/Attempt.api";
import { useNotification } from "../../../components/Notification";
import type { Quiz } from "../../../types/quiz.types";
import type { ExamMode, ExamConfig } from "../../../types/attempt.types";
import { ExamModeSelector } from "../components/ExamModeSelector";
import { ExamConfigModal } from "../components/ExamConfigModal";
import QuestionContentRenderer from "../../../components/common/QuestionContentRenderer";
import {
  Clock, Tag, ArrowLeft,
  Loader2, AlertCircle, HelpCircle,
  Play, Sliders, BookOpen, CheckCircle2, Lock,
  Search, Eye, EyeOff, ChevronDown, ChevronUp,
  FileQuestion, Check, Sparkles
} from "lucide-react";
import { LazyImage } from "../../../components/ui/LazyImage";
import { getMediaUrl } from "../../../utils/media";
import defaultCover from "../../../assets/images/khodethi.png";

const QuizDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialMode =
    (searchParams.get("mode") as ExamMode) ||
    (location.state as { mode?: ExamMode } | null)?.mode ||
    "PRACTICE";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ExamMode>(initialMode);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { showError } = useNotification();

  // Question Preview state: Mặc định hiển thị 10 câu đầu để tiết kiệm tối đa băng thông
  const [previewLimit, setPreviewLimit] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [showAllAnswers, setShowAllAnswers] = useState(true);

  const isLoggedIn = !!(localStorage.getItem("accessToken") || localStorage.getItem("token"));

  useEffect(() => {
    const urlMode = searchParams.get("mode") as ExamMode;
    if (urlMode) setSelectedMode(urlMode);
  }, [searchParams]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    quizApi
      .getQuizById(id)
      .then((data) => {
        setQuiz(data);
        if (data.questions) {
          const initialExpanded: Record<string, boolean> = {};
          data.questions.forEach((q) => {
            initialExpanded[q.id] = true;
          });
          setExpandedQuestions(initialExpanded);
        }
      })
      .catch(() => setError("Không tìm thấy bài thi hoặc bài thi chưa được xuất bản."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStartSession = async (mode: ExamMode = selectedMode, customConfig?: Partial<ExamConfig>) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!id) return;

    try {
      setStarting(true);
      const session = await attemptApi.startSession({
        quizId: id,
        mode,
        config: customConfig,
      });
      setIsConfigModalOpen(false);
      navigate(`/quiz/${id}/take/${session.sessionId || session.attemptId}`, {
        state: { attempt: session },
      });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      showError("Lỗi bắt đầu làm bài", apiError.response?.data?.message || "Không thể bắt đầu phiên học/thi. Vui lòng thử lại.");
    } finally {
      setStarting(false);
    }
  };

  const questionCount = quiz?._count?.questions ?? quiz?.questions?.length ?? 0;

  const filteredQuestions = useMemo(() => {
    if (!quiz?.questions) return [];
    if (!searchQuery.trim()) return quiz.questions;
    const query = searchQuery.toLowerCase().trim();
    return quiz.questions.filter((q) => {
      const matchQuestion = q.content?.toLowerCase().includes(query);
      const matchAnswers = q.answers?.some((a) => a.content?.toLowerCase().includes(query));
      return matchQuestion || matchAnswers;
    });
  }, [quiz?.questions, searchQuery]);

  const totalFilteredCount = filteredQuestions.length;
  const isSearching = Boolean(searchQuery.trim());

  // Chỉ lấy 10 câu đầu để xem trước (trừ khi người dùng tìm kiếm từ khóa cụ thể hoặc bấm mở rộng)
  const displayedQuestions = useMemo(() => {
    if (isSearching) return filteredQuestions;
    return filteredQuestions.slice(0, previewLimit);
  }, [filteredQuestions, isSearching, previewLimit]);

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const toggleExpandAll = () => {
    if (!quiz?.questions) return;
    const allExpanded = quiz.questions.every((q) => expandedQuestions[q.id]);
    const newState: Record<string, boolean> = {};
    quiz.questions.forEach((q) => {
      newState[q.id] = !allExpanded;
    });
    setExpandedQuestions(newState);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !quiz) {
    return (
      <DashboardLayout>
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-base font-semibold text-[#0F172A] dark:text-white">
            {error || "Không tìm thấy bài thi"}
          </p>
          <Link to="/explore" className="btn-secondary text-xs">
            ← Quay lại kho đề thi
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const optionLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-indigo-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại kho đề thi
        </Link>

        {/* Hero Card */}
        <div className="bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs mb-8">
          {/* Cover Banner */}
          <div className="relative aspect-[16/6] sm:aspect-[16/5] w-full overflow-hidden bg-slate-900">
            <img
              src={getMediaUrl(quiz.coverUrl) || defaultCover}
              alt={quiz.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = defaultCover;
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          </div>

          <div className="p-6 sm:p-8">
            {/* Category */}
            {quiz.category && (
              <div className="mb-3">
                <span className="badge-primary">
                  <Tag className="w-3 h-3" />
                  {quiz.category.name}
                </span>
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white mb-3 tracking-tight leading-tight">
              {quiz.title}
            </h1>

            {quiz.description && (
              <p className="text-sm text-[#64748B] dark:text-slate-400 leading-relaxed mb-6">
                {quiz.description}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] dark:bg-indigo-950/60 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] dark:text-slate-500">Số câu hỏi</p>
                  <p className="font-bold text-[#0F172A] dark:text-white">{questionCount} câu</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] dark:bg-indigo-950/60 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] dark:text-slate-500">Thời gian chuẩn</p>
                  <p className="font-bold text-[#0F172A] dark:text-white">
                    {quiz.timeLimit ? `${quiz.timeLimit} phút` : "Tùy chỉnh theo chế độ"}
                  </p>
                </div>
              </div>

              {quiz.author && (
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center overflow-hidden shrink-0">
                    {quiz.author.avatar ? (
                      <img
                        src={getMediaUrl(quiz.author.avatar) || ""}
                        alt={quiz.author.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    {!quiz.author.avatar && (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {quiz.author.name?.charAt(0).toUpperCase() || "H"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8] dark:text-slate-500">Tác giả</p>
                    <p className="font-bold text-[#0F172A] dark:text-white">{quiz.author.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions - Mobile Friendly Full-Width & min 48px touch targets */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleStartSession(selectedMode)}
                disabled={starting}
                className="w-full sm:w-auto h-12 min-h-[48px] px-8 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer active:scale-98"
              >
                {starting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang chuẩn bị...</>
                ) : !isLoggedIn ? (
                  <><Lock className="w-4 h-4" /> Đăng nhập để làm bài</>
                ) : (
                  <><Play className="w-4 h-4" /> Bắt đầu với chế độ đã chọn</>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                disabled={starting || !isLoggedIn}
                className="w-full sm:w-auto h-12 min-h-[48px] px-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Sliders className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
                <span>Tùy chỉnh cấu hình</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section: Select Learning & Exam Mode */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400" />
                Chọn hình thức học & thi
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Cùng một bộ câu hỏi có thể được sử dụng linh hoạt cho 5 mục đích học tập khác nhau.
              </p>
            </div>
          </div>

          <ExamModeSelector
            selectedMode={selectedMode}
            onSelectMode={(mode) => setSelectedMode(mode)}
            onStartMode={(mode) => {
              setSelectedMode(mode);
              handleStartSession(mode);
            }}
            disabled={starting}
          />
        </div>

        {/* Section: Question Preview */}
        {quiz.questions && quiz.questions.length > 0 && (
          <div className="bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400">
                    <FileQuestion className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                    Xem trước danh sách câu hỏi
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {displayedQuestions.length} / {totalFilteredCount} câu
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                  Mặc định hiển thị 10 câu đầu để tiết kiệm tối đa băng thông mạng. Ảnh được nạp tự động khi cuộn tới.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search input */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm câu hỏi, đáp án..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Toggle Show Answers */}
                <button
                  type="button"
                  onClick={() => setShowAllAnswers(!showAllAnswers)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={showAllAnswers ? "Ẩn danh sách đáp án" : "Hiện danh sách đáp án"}
                >
                  {showAllAnswers ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ẩn đáp án</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Hiện đáp án</span>
                    </>
                  )}
                </button>

                {/* Expand / Collapse all */}
                <button
                  type="button"
                  onClick={toggleExpandAll}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {quiz.questions.every((q) => expandedQuestions[q.id]) ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      <span>Thu gọn</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      <span>Mở rộng</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Questions List grouped by section */}
            <div className="mt-6 space-y-6">
              {displayedQuestions.length === 0 ? (
                <div className="text-center py-10">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Không tìm thấy câu hỏi nào phù hợp với từ khóa.</p>
                </div>
              ) : (
                (() => {
                  // If quiz has sections
                  const sectionsList = quiz.sections && quiz.sections.length > 0
                    ? quiz.sections
                    : [
                        {
                          id: "default",
                          title: "Toàn bộ đề thi",
                          order: 1,
                          questions: quiz.questions,
                        },
                      ];

                  return sectionsList.map((sec, secIdx) => {
                    const secQuestions = displayedQuestions.filter(
                      (q) => (q.sectionId && q.sectionId === sec.id) || (!q.sectionId && secIdx === 0)
                    );

                    if (secQuestions.length === 0) return null;

                    return (
                      <div key={sec.id || secIdx} className="space-y-4">
                        {sectionsList.length > 1 && (
                          <div className="flex items-center gap-2.5 pb-2 border-b border-indigo-100 dark:border-slate-800">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">
                              {secIdx + 1}
                            </span>
                            <h3 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-300">
                              {sec.title}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-500">
                              ({secQuestions.length} câu hiển thị)
                            </span>
                          </div>
                        )}

                        <div className="space-y-4">
                          {secQuestions.map((q, idx) => {
                            const isExpanded = expandedQuestions[q.id] !== false;
                            const questionDisplayNum = q.order || idx + 1;

                            return (
                              <div
                                key={q.id || idx}
                                className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-5 hover:border-indigo-100 dark:hover:border-slate-700 transition-all"
                              >
                                {/* Question Header */}
                                <div
                                  onClick={() => toggleQuestionExpand(q.id)}
                                  className="flex items-start justify-between gap-4 cursor-pointer select-none"
                                >
                                  <div className="flex items-start gap-3 flex-1">
                                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs tracking-wider">
                                      Câu {questionDisplayNum}
                                    </span>
                                    <div className="flex-1 min-w-0 text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed pt-0.5">
                                      <QuestionContentRenderer content={q.content} />
                                      {q.media && q.media.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2.5">
                                          {q.media.map((media) => (
                                            <LazyImage
                                              key={media.id}
                                              src={getMediaUrl(media.url || media.storageKey)}
                                              alt="Hình minh họa câu hỏi"
                                              maxHeightClass="max-h-52"
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {q.points && (
                                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                                        {q.points} điểm
                                      </span>
                                    )}
                                    <div className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Question Answers Body */}
                                {isExpanded && showAllAnswers && q.answers && q.answers.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {q.answers.map((answer, aIdx) => {
                                      const isCorrect = answer.isCorrect === true;
                                      return (
                                        <div
                                          key={answer.id || aIdx}
                                          className={`flex items-start gap-3 p-3 rounded-xl border text-xs transition-all ${
                                            isCorrect
                                              ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                                              : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                          }`}
                                        >
                                          <span
                                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                              isCorrect
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                            }`}
                                          >
                                            {optionLabels[aIdx] || aIdx + 1}
                                          </span>
                                          <div className="flex-1 pt-0.5 min-w-0 font-normal leading-relaxed">
                                            <QuestionContentRenderer content={answer.content} />
                                            {answer.media && answer.media.length > 0 && (
                                              <div className="mt-2 flex flex-wrap gap-2">
                                                {answer.media.map((media) => (
                                                  <LazyImage
                                                    key={media.id}
                                                    src={getMediaUrl(media.url || media.storageKey)}
                                                    alt={`Hình ảnh đáp án ${optionLabels[aIdx] || aIdx + 1}`}
                                                    maxHeightClass="max-h-36"
                                                  />
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          {isCorrect && (
                                            <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                              <Check className="w-3.5 h-3.5" />
                                              Đáp án đúng
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Điều hướng xem thêm & phân trang câu hỏi (Tiết kiệm băng thông tối đa) */}
            {!isSearching && totalFilteredCount > 10 && (
              <div className="mt-8 p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Đang xem trước {displayedQuestions.length} / {totalFilteredCount} câu hỏi
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        Chỉ tải ảnh khi cuộn tới
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tiết kiệm băng thông mạng và ngăn ngừa tràn bộ nhớ máy tính khi xem đề thi lớn.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                  {previewLimit < totalFilteredCount && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewLimit((prev) => Math.min(prev + 10, totalFilteredCount))}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        Xem thêm 10 câu
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewLimit(totalFilteredCount)}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-colors shadow-2xs cursor-pointer"
                      >
                        Xem tất cả ({totalFilteredCount} câu)
                      </button>
                    </>
                  )}

                  {previewLimit > 10 && (
                    <button
                      type="button"
                      onClick={() => setPreviewLimit(10)}
                      className="px-3 py-2 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      Thu gọn về 10 câu
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleStartSession(selectedMode)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer ml-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Vào thi ngay ({totalFilteredCount} câu)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions Card */}
        <div className="bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Hướng dẫn học & thi tại HUBT</h3>
          </div>
          <ul className="space-y-2.5">
            {[
              "Ôn thi (Practice): Xem ngay đáp án & lời giải thích chi tiết sau mỗi câu, không giới hạn thời gian.",
              "Thi thử (Mock Exam): Bấm giờ chuẩn thi kết thúc học phần, tự động nộp bài khi hết giờ.",
              "Kiểm tra & Bài tập: Theo dõi hạn chót và số lần làm bài theo quy định của giảng viên bộ môn.",
              "Flashcard: Lật thẻ ghi nhớ nhanh các thuật ngữ và công thức quan trọng trước kỳ thi.",
              "Xem lại câu sai: Sau khi hoàn thành, hệ thống sẽ gom các câu bạn làm sai vào Ngân hàng câu sai để ôn lại.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-[#475569] dark:text-slate-400 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Config Modal */}
      <ExamConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        mode={selectedMode}
        maxQuestions={questionCount}
        defaultTimeLimit={quiz.timeLimit}
        onConfirm={(config) => handleStartSession(selectedMode, config)}
        loading={starting}
      />
    </DashboardLayout>
  );
};

export default QuizDetailPage;
