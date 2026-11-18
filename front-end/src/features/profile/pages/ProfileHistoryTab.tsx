import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { attemptApi } from "../../../services/api/Attempt.api";
import type { HistoryItem } from "../../../types/attempt.types";
import { Clock, Loader2, ArrowRight, CheckCircle2, XCircle, Calendar, Award } from "lucide-react";

export default function ProfileHistoryTab() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attemptApi
      .getHistory({ limit: 15 })
      .then((res) => {
        setHistory(res.items || []);
      })
      .catch((err) => console.error("History tab error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#4F46E5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
        <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#4F46E5]" />
          Lịch sử làm bài thi
        </h2>
        <span className="text-xs text-[#64748B] dark:text-slate-400 font-semibold">
          Tổng số: {history.length} bài thi
        </span>
      </div>

      {history.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <p className="text-xs text-slate-500">Bạn chưa hoàn thành bài thi nào.</p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:underline"
          >
            Làm bài thi ngay <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          {/* 1. DESKTOP VIEW (Bảng chuẩn đa cột cho màn hình >= 768px) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F19]">
                  <th className="py-3 px-4 text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                    Môn học / Đề thi
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                    Chế độ
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                    Điểm số
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                    Số câu đúng
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider">
                    Thời gian hoàn thành
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#475569] dark:text-slate-400 uppercase tracking-wider text-right">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                {history.map((item) => {
                  const score10 = Math.round((item.score / 10) * 10) / 10;
                  const isPassed = item.score >= 50;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-xs font-bold text-[#0F172A] dark:text-white max-w-xs truncate">
                        {item.quiz?.title || "Bài thi trắc nghiệm"}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                          {item.mode === "PRACTICE"
                            ? "Ôn thi"
                            : item.mode === "TEST"
                            ? "Kiểm tra"
                            : item.mode === "ASSIGNMENT"
                            ? "Bài tập"
                            : item.mode === "FLASHCARD"
                            ? "Flashcard"
                            : "Thi thử"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span
                          className={`font-black ${
                            isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {score10} / 10
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">({item.score}%)</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#475569] dark:text-slate-300">
                        {item.correctAnswers} / {item.totalQuestions} câu
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#64748B] dark:text-slate-400">
                        {item.finishedAt
                          ? new Date(item.finishedAt).toLocaleDateString("vi-VN")
                          : item.startedAt
                          ? new Date(item.startedAt).toLocaleDateString("vi-VN")
                          : "--"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/quiz/${item.quizId}/result/${item.id}`}
                          className="text-xs font-bold text-[#4F46E5] hover:underline"
                        >
                          Xem lại
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. MOBILE VIEW: VERTICAL TIMELINE / CARD LIST (Màn hình < 768px chống tràn ngang) */}
          <div className="md:hidden space-y-3">
            {history.map((item, idx) => {
              const score10 = Math.round((item.score / 10) * 10) / 10;
              const isPassed = item.score >= 50;
              const completedDate = item.finishedAt
                ? new Date(item.finishedAt).toLocaleDateString("vi-VN")
                : item.startedAt
                ? new Date(item.startedAt).toLocaleDateString("vi-VN")
                : "--";

              return (
                <div
                  key={item.id || idx}
                  className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isPassed ? "bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950" : "bg-red-500 ring-4 ring-red-100 dark:ring-red-950"
                        }`}
                      />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.quiz?.title || "Bài thi trắc nghiệm"}
                      </h4>
                    </div>

                    <span
                      className={`text-xs font-black shrink-0 px-2 py-0.5 rounded-lg ${
                        isPassed
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                      }`}
                    >
                      {score10}/10 ({item.score}%)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                      {item.mode === "PRACTICE"
                        ? "Ôn thi"
                        : item.mode === "TEST"
                        ? "Kiểm tra"
                        : item.mode === "ASSIGNMENT"
                        ? "Bài tập"
                        : item.mode === "FLASHCARD"
                        ? "Flashcard"
                        : "Thi thử"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                      )}
                      {item.correctAnswers}/{item.totalQuestions} đúng
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {completedDate}
                    </span>
                  </div>

                  <Link
                    to={`/quiz/${item.quizId}/result/${item.id}`}
                    className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-98"
                  >
                    <span>Xem lại đáp án & kết quả</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

