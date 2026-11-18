import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi, type AdminStats } from "../../../services/api/Admin.api";
import {
  GraduationCap,
  Layers,
  Users2,
  BookOpenCheck,
  CalendarCheck2,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getStats();
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
      label: "Sinh viên",
      value: stats?.totalStudents ?? 0,
      icon: Users2,
      color: "indigo",
      bgLight: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/50",
      link: "/admin/students",
      subtext: "Tài khoản sinh viên hoạt động",
    },
    {
      label: "Ngành học",
      value: stats?.totalMajors ?? 0,
      icon: GraduationCap,
      color: "emerald",
      bgLight: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50",
      link: "/admin/majors",
      subtext: "Các chuyên ngành tại HUBT",
    },
    {
      label: "Lớp học",
      value: stats?.totalClasses ?? 0,
      icon: Layers,
      color: "blue",
      bgLight: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/50",
      link: "/admin/classes",
      subtext: "Lớp học phần theo khóa",
    },
    {
      label: "Ngân hàng đề",
      value: stats?.totalQuizzes ?? 0,
      icon: BookOpenCheck,
      color: "amber",
      bgLight: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50",
      link: "/quiz",
      subtext: "Đề thi và bài ôn tập",
    },
    {
      label: "Lượt thi & Làm bài",
      value: stats?.totalAttempts ?? 0,
      icon: CalendarCheck2,
      color: "purple",
      bgLight: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/50",
      link: "/history",
      subtext: "Tổng số lượt nộp bài",
    },
    {
      label: "Giảng viên",
      value: stats?.totalTeachers ?? 0,
      icon: ShieldCheck,
      color: "cyan",
      bgLight: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 border-cyan-200/60 dark:border-cyan-800/50",
      link: "/admin/teachers",
      subtext: "Cán bộ giảng dạy bộ môn",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-[#1E1B4B] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" /> Trung tâm điều hành InnoQuiz HUBT
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tổng quan Hệ thống Quản trị
          </h1>
          <p className="mt-2 text-indigo-200 text-sm leading-relaxed">
            Theo dõi dữ liệu đào tạo, quản lý cấu trúc ngành - lớp, giám sát người dùng và ngân hàng đề thi tập trung cho sinh viên toàn trường.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-rose-700 dark:text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchStats}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Statistical Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl border ${card.bgLight}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {loading ? (
                    <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                  ) : (
                    card.value.toLocaleString("vi-VN")
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {card.subtext}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions & Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Quản trị Đào tạo HUBT
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thiết lập danh mục các ngành và lớp trực thuộc để sinh viên đăng ký tài khoản chính xác.
          </p>

          <div className="mt-4 space-y-2.5">
            <Link
              to="/admin/majors"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1A2238] hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                  N
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Danh mục Ngành học
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Cấu hình trạng thái, thứ tự hiển thị và cho phép đăng ký
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>

            <Link
              to="/admin/classes"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1A2238] hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  L
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Danh mục Lớp học phần
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Gắn lớp với ngành, phân bổ khóa K28, K29, K30...
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Quản trị Người dùng & Sinh viên
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý mã sinh viên, phân bổ lớp, chuyển lớp và theo dõi tình trạng kích hoạt.
          </p>

          <div className="mt-4 space-y-2.5">
            <Link
              to="/admin/students"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1A2238] hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  SV
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Danh sách Sinh viên
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Gán lớp, chuyển lớp, khóa tài khoản sinh viên
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>

            <Link
              to="/admin/quizzes"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1A2238] hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                  Đ
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Giám sát Đề thi & Kho đề
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Kiểm duyệt nội dung đề thi công khai và theo chuyên ngành
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
