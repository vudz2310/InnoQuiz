
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/Dashboard";
import { attemptApi } from "../../../services/api/Attempt.api";
import type { LearningProgress, ExamMode } from "../../../types/attempt.types";
import {
  BarChart3,
  Trophy,
  CheckCircle2,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Loader2,
} from "lucide-react";


export const MyProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attemptApi
      .getLearningProgress()
      .then((data) => setProgress(data))
      .catch((err) => console.error("Get progress error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const formatStudyTime = (seconds: number) => {
    if (!seconds) return "0 phút";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}p`;
    return `${mins} phút`;
  };

  const modeLabels: Record<ExamMode, { name: string; color: string; bg: string }> = {
    PRACTICE: { name: "Ôn thi", color: "text-blue-600", bg: "bg-blue-500" },
    MOCK_EXAM: { name: "Thi thử", color: "text-indigo-600", bg: "bg-indigo-500" },
    TEST: { name: "Kiểm tra", color: "text-emerald-600", bg: "bg-emerald-500" },
    ASSIGNMENT: { name: "Bài tập", color: "text-amber-600", bg: "bg-amber-500" },
    FLASHCARD: { name: "Flashcard", color: "text-purple-600", bg: "bg-purple-500" },
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800/50">
                <TrendingUp className="w-3.5 h-3.5" /> Thống kê học tập HUBT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              Tiến độ & Kết quả học tập
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Theo dõi hiệu quả làm bài qua các chế độ: Ôn thi, Thi thử, Kiểm tra, Bài tập và Flashcard.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/my/wrong-answers"
              className="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Ngân hàng câu sai ({progress?.totalIncorrect || 0})
            </Link>
            <Link
              to="/explore"
              className="px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-500/20"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Làm đề mới
            </Link>
          </div>
        </div>

        {/* 4 Big Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">Tổng bài đã làm</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {progress?.totalSessions || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Phiên học & thi hoàn thành</p>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">Tỷ lệ chính xác</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {progress?.accuracyRate || 0}%
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {progress?.totalCorrect || 0} / {progress?.totalQuestionsAnswered || 0} câu đúng
            </p>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">Điểm trung bình</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {progress?.avgScore ? Math.round((progress.avgScore / 10) * 10) / 10 : 0}
              <span className="text-xs text-slate-400 font-semibold"> / 10</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Quy đổi hệ số 10</p>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">Thời gian học tập</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {formatStudyTime(progress?.totalStudyTimeSeconds || 0)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Tổng thời lượng rèn luyện</p>
          </div>
        </div>

        {/* 2-column breakdown: Progress by Subject & Breakdown by Mode */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Progress by Subject */}
          <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#4F46E5]" />
                  Tiến độ theo Môn học / Khoa
                </h3>
                <p className="text-xs text-slate-500">Tỷ lệ làm đúng theo từng học phần</p>
              </div>
            </div>

            {progress?.categoryProgress && progress.categoryProgress.length > 0 ? (
              <div className="space-y-4">
                {progress.categoryProgress.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {cat.categoryName}
                      </span>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>{cat.totalAttempts} bài thi</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {cat.accuracyRate}% đúng
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-[#4F46E5] rounded-full transition-all duration-500"
                        style={{ width: `${cat.accuracyRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có dữ liệu học tập môn học. Hãy bắt đầu làm bài thi đầu tiên!
              </div>
            )}
          </div>

          {/* Breakdown by Mode */}
          <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Phân bố theo Chế độ học
              </h3>
              <p className="text-xs text-slate-500">Số lượt rèn luyện cho 5 chế độ</p>
            </div>

            <div className="space-y-3">
              {(
                [
                  "PRACTICE",
                  "MOCK_EXAM",
                  "TEST",
                  "ASSIGNMENT",
                  "FLASHCARD",
                ] as ExamMode[]
              ).map((m) => {
                const count = progress?.modeStats?.[m] || 0;
                const total = progress?.totalSessions || 1;
                const pct = Math.round((count / total) * 100);
                const info = modeLabels[m];

                return (
                  <div key={m} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {info.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{count} lượt hoàn thành</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Bài thi vừa hoàn thành gần đây
            </h3>
            <Link
              to="/history"
              className="text-xs font-bold text-[#4F46E5] hover:underline flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {progress?.recentSessions && progress.recentSessions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {progress.recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl px-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {session.quizTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                        {modeLabels[session.mode]?.name || session.mode}
                      </span>
                      <span>•</span>
                      <span>
                        {session.correctAnswers}/{session.totalQuestions} câu đúng
                      </span>
                      <span>•</span>
                      <span>{new Date(session.finishedAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                        session.score >= 50
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                      }`}
                    >
                      {session.score}%
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/quiz/${session.quizId}/result/${session.id}`)}
                      className="text-xs font-bold text-[#4F46E5] hover:underline cursor-pointer"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">Chưa có bài thi nào.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyProgressPage;
