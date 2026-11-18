import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/Dashboard";
import { attemptApi } from "../../../services/api/Attempt.api";
import type { WrongAnswerItem } from "../../../types/attempt.types";
import { useNotification } from "../../../components/Notification";
import {
  AlertTriangle,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from "lucide-react";

export const WrongAnswersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [items, setItems] = useState<WrongAnswerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [practicing, setPracticing] = useState(false);
  const [page] = useState(1);
  const [total, setTotal] = useState(0);


  useEffect(() => {
    setLoading(true);
    attemptApi
      .getWrongAnswers({ page, limit: 20 })
      .then((res) => {
        setItems(res.items || []);
        setTotal(res.total || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [page]);

  const handleStartPracticeAll = async (quizId?: string) => {
    try {
      setPracticing(true);
      const session = await attemptApi.startWrongAnswersPractice(quizId);
      navigate(`/quiz/${session.quizId}/take/${session.sessionId || session.attemptId}`, {
        state: { attempt: session },
      });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; code?: string } } };
      showError("Lỗi khởi tạo ôn tập", apiError.response?.data?.message || "Không thể khởi tạo phiên ôn câu sai.");
    } finally {
      setPracticing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1.5 border border-red-200 dark:border-red-800/50">
                <AlertTriangle className="w-3.5 h-3.5" /> Ngân hàng câu sai
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              Sửa lỗi & Ôn tập câu hỏi sai
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tập hợp tất cả các câu hỏi bạn từng trả lời sai. Luyện lại theo chu trình học tập để ghi nhớ lâu hơn.
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => handleStartPracticeAll()}
              disabled={practicing}
              className="w-full sm:w-auto h-12 min-h-[48px] px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-60 shrink-0 active:scale-98"
            >
              {practicing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Ôn luyện tất cả {total} câu sai</span>
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Tuyệt vời! Bạn không có câu hỏi sai nào chưa được xử lý.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Hãy tiếp tục duy trì phong độ bằng cách làm các đề thi thử và bài kiểm tra mới trong kho đề HUBT.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4F46E5] text-white text-xs font-bold hover:bg-[#4338CA] transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Khám phá đề thi mới
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => {
              const correctAnswer = item.answers.find((a) => a.isCorrect);

              return (
                <div
                  key={item.questionId}
                  className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                        Câu #{idx + 1}
                      </span>
                      {item.quiz?.title && (
                        <span className="text-xs text-slate-500 font-semibold truncate max-w-xs">
                          {item.quiz.title}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartPracticeAll(item.quiz?.id)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Ôn câu sai đề này <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                    {item.content}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {correctAnswer && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                            Đáp án đúng:
                          </p>
                          <p className="text-emerald-900 dark:text-emerald-200 mt-0.5">
                            {correctAnswer.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {item.explanation && (
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-indigo-800 dark:text-indigo-300 text-[11px]">
                            Giải thích:
                          </p>
                          <p className="text-indigo-950 dark:text-indigo-200 mt-0.5 line-clamp-2">
                            {item.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WrongAnswersPage;
