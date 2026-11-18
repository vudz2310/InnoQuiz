import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { teacherApi, type TeacherStats } from "../../../services/api/Teacher.api";
import {
  School,
  ClipboardList,
  Users,
  PlusCircle,
  ArrowUpRight,
  Sparkles,
  BookOpenCheck,
  AlertCircle,
  Clock,
  Award,
} from "lucide-react";

export const TeacherDashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherApi.getStats();
      setStats(data);
    } catch {
      setError("Không thể tải số liệu thống kê. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Đề thi đã tạo",
      value: stats?.totalQuizzes ?? 0,
      icon: ClipboardList,
      color: "indigo",
      bgLight: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/50",
      link: "/teacher/quizzes",
      subtext: "Bộ đề trắc nghiệm biên soạn",
    },
    {
      label: "Lượt sinh viên thi",
      value: stats?.totalAttempts ?? 0,
      icon: BookOpenCheck,
      color: "emerald",
      bgLight: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50",
      link: "/teacher/quizzes",
      subtext: "Tổng số lượt nộp bài",
    },
    {
      label: "Lớp học phần",
      value: stats?.totalClasses ?? 0,
      icon: School,
      color: "blue",
      bgLight: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/50",
      link: "/teacher/classes",
      subtext: "Lớp học trong học kỳ",
    },
    {
      label: "Sinh viên theo dõi",
      value: stats?.totalStudents ?? 0,
      icon: Users,
      color: "purple",
      bgLight: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/50",
      link: "/teacher/students",
      subtext: "Sinh viên trong chuyên ngành",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Teacher Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Không gian Giảng viên HUBT
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {user?.name || "Thầy / Cô"}
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Khu vực quản lý lớp giảng dạy, ngân hàng đề thi bộ môn và theo dõi tiến độ làm bài của sinh viên trong học kỳ này.
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-rose-700 dark:text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchStats}
            className="font-semibold underline hover:text-rose-800 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Statistics Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`p-2.5 rounded-xl border ${card.bgLight}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                  ) : (
                    card.value.toLocaleString("vi-VN")
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {card.subtext}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Columns: Recent Quizzes & Recent Student Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Đề thi gần đây của Giảng viên */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Đề thi của bạn
                </h2>
              </div>
              <Link
                to="/teacher/quizzes"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Đang tải đề thi...</div>
              ) : !stats?.recentQuizzes || stats.recentQuizzes.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bạn chưa tạo đề thi nào.
                  </p>
                  <Link
                    to="/create-quiz"
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Tạo đề thi đầu tiên
                  </Link>
                </div>
              ) : (
                stats.recentQuizzes.map((q) => (
                  <div key={q.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {q.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <BookOpenCheck className="w-3.5 h-3.5" /> {q._count.questions} câu
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {q._count.attempts} lượt thi
                        </span>
                        {q.timeLimit && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {q.timeLimit} phút
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        q.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      {q.status === "PUBLISHED" ? "Đã duyệt" : "Bản nháp"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 2. Lượt nộp bài gần đây nhất */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Lượt sinh viên nộp bài gần đây
                </h2>
              </div>
              <span className="text-xs text-slate-400">Cập nhật trực tiếp</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Đang tải kết quả thi...</div>
              ) : !stats?.recentAttempts || stats.recentAttempts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Chưa có lượt nộp bài nào trên các đề của bạn.
                </div>
              ) : (
                stats.recentAttempts.map((att) => (
                  <div key={att.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {att.user.name}
                        </span>
                        {att.user.studentCode && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {att.user.studentCode}
                          </span>
                        )}
                        {att.user.academicClass && (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                            ({att.user.academicClass.code})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Đề: {att.quiz.title}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {att.score.toFixed(1)} đ
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {att.correctAnswers}/{att.totalQuestions} đúng
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Phím tắt chức năng Giảng viên
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/teacher/classes"
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Lớp học phần
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Xem sĩ số và danh sách lớp
              </span>
            </div>
          </Link>

          <Link
            to="/teacher/students"
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Hồ sơ Sinh viên
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Tra cứu MSV và số lượt thi
              </span>
            </div>
          </Link>

          <Link
            to="/teacher/quizzes"
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex items-center gap-3"
          >
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Ngân hàng Đề thi
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Biên soạn và quản lý đề
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
