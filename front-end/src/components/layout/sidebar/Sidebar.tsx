import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../../store";
import { clearUser } from "../../../store/slices/auth.slice";
import { useSidebar } from "./SidebarContext";
import { useTheme } from "../../../context/ThemeContext";
import { useNotification } from "../../Notification";
import {
  X,
  Flame,
  BookOpen,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Heart,
  Target,
  FileCheck,
  Layers,
  Lightbulb,
  Newspaper,
  Headphones,
  Sparkles,
  FileSpreadsheet,
  Plus,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
  School,
} from "lucide-react";
import logo from "../../../assets/images/logo_quiz.png";

export const Sidebar: React.FC = () => {
  const { isMobileOpen, isCollapsed, closeMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showSuccess } = useNotification();

  const handleLogout = () => {
    dispatch(clearUser());
    closeMobile();
    showSuccess("Đã đăng xuất", "Hẹn gặp lại bạn lần sau tại InnoQuiz!");
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 lg:px-3 lg:py-2 rounded-xl text-sm lg:text-xs font-semibold lg:font-medium transition-all group active:scale-[0.98] lg:active:scale-100 ${
      isActive
        ? "bg-indigo-50/90 text-[#4F46E5] font-bold border border-indigo-200/80 shadow-2xs dark:bg-[#1E1B4B] dark:text-[#A5B4FC] dark:border-indigo-500/40"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-[#131B2E]"
    }`;

  return (
    <>
      {/* 1. Backdrop mờ khi mở trên Mobile (Click ngoài đóng menu) */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* 2. Sidebar Drawer Container - Tối ưu kích thước & vuốt trượt trên Mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#090D1A] text-slate-800 dark:text-slate-300 border-r border-[#E2E8F0] dark:border-[#1E293B] shadow-2xl lg:shadow-none transition-transform duration-300 ease-out ${
          isMobileOpen
            ? "translate-x-0 w-[84vw] max-w-[320px] sm:w-72"
            : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
        aria-label="Thanh điều hướng chính"
      >
        {/* Top Header: Inno Quiz & HUBT EDTECH */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#1E293B] shrink-0">
          <Link
            to="/"
            onClick={closeMobile}
            className="flex items-center gap-3 overflow-hidden select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-[#1E1B4B] border border-indigo-200/70 dark:border-indigo-500/30 p-1 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src={logo}
                alt="InnoQuiz"
                className="w-full h-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  Inno<span className="text-[#4F46E5] dark:text-[#818CF8]">Quiz</span>
                </span>
                <span className="text-[9px] font-bold text-[#4F46E5] dark:text-indigo-400/90 uppercase tracking-widest -mt-0.5">
                  HUBT EDTECH
                </span>
              </div>
            )}
          </Link>

          {/* Nút đóng trên mobile - Touch Target chuẩn 40px */}
          <button
            type="button"
            onClick={closeMobile}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 active:scale-90 lg:hidden transition-all cursor-pointer"
            aria-label="Đóng thanh menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div
          className="flex-1 overflow-y-auto py-3 px-3 space-y-4 no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* USER PROFILE CARD (Chỉ hiển thị trên Mobile để truy cập nhanh tài khoản) */}
          <div className="lg:hidden">
            {user ? (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-2.5">
                <Link
                  to="/profile"
                  onClick={closeMobile}
                  className="flex items-center gap-3 transition-opacity active:opacity-80"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-[#4F46E5] dark:text-indigo-300 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || (
                        <UserIcon className="w-5 h-5" />
                      )
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>

                {/* Role Portals if Admin or Teacher */}
                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    onClick={closeMobile}
                    className="h-9 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Cổng Quản trị Admin
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {user.role === "TEACHER" && (
                  <Link
                    to="/teacher"
                    onClick={closeMobile}
                    className="h-9 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <School className="w-4 h-4" /> Cổng Giảng viên
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-[#111827] border border-indigo-200/80 dark:border-slate-800 flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="flex-1 h-9 rounded-xl bg-[#4F46E5] text-white text-xs font-bold flex items-center justify-center shadow-xs"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobile}
                  className="flex-1 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Primary CTA: Tạo đề thi mới */}
            <Link
              to="/create-quiz"
              onClick={closeMobile}
              className="mt-2.5 h-11 w-full rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề thi mới</span>
            </Link>
          </div>

          {/* NHÓM 1: KHÁM PHÁ */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="block px-3 mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Khám phá
              </span>
            )}

            <NavLink
              to="/explore"
              onClick={closeMobile}
              className={navLinkClass}
              title="Khám phá"
            >
              <Flame className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Khám phá</span>}
            </NavLink>

            <NavLink
              to="/quiz"
              onClick={closeMobile}
              className={navLinkClass}
              title="Kho đề thi"
            >
              <BookOpen className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Kho đề thi</span>}
            </NavLink>

            <NavLink
              to="/majors"
              onClick={closeMobile}
              className={navLinkClass}
              title="Trường & chuyên ngành"
            >
              <GraduationCap className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Trường & chuyên ngành</span>}
            </NavLink>

            <NavLink
              to="/converter"
              onClick={closeMobile}
              className={navLinkClass}
              title="Chuyển đổi đề EduQuiz / PDF"
            >
              <FileSpreadsheet className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>Chuyển đổi đề PDF</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
                    EduQuiz
                  </span>
                </div>
              )}
            </NavLink>
          </div>

          {/* NHÓM 2: CỦA TÔI */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="block px-3 mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Của tôi
              </span>
            )}

            <NavLink
              to="/my-quizzes"
              onClick={closeMobile}
              className={navLinkClass}
              title="Đề thi của tôi"
            >
              <ClipboardList className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Đề thi của tôi</span>}
            </NavLink>

            <NavLink
              to="/history"
              onClick={closeMobile}
              className={navLinkClass}
              title="Lịch sử làm bài"
            >
              <BarChart3 className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Lịch sử làm bài</span>}
            </NavLink>

            <NavLink
              to="/favorites"
              onClick={closeMobile}
              className={navLinkClass}
              title="Yêu thích"
            >
              <Heart className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Yêu thích</span>}
            </NavLink>
          </div>

          {/* NHÓM 3: HỌC TẬP */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="block px-3 mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Học tập
              </span>
            )}

            <NavLink
              to="/practice"
              onClick={closeMobile}
              className={navLinkClass}
              title="Ôn tập"
            >
              <Target className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Ôn tập</span>}
            </NavLink>

            <NavLink
              to="/mock-exam"
              onClick={closeMobile}
              className={navLinkClass}
              title="Thi thử"
            >
              <FileCheck className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Thi thử</span>}
            </NavLink>

            <NavLink
              to="/flashcards"
              onClick={closeMobile}
              className={navLinkClass}
              title="Flashcard"
            >
              <Layers className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Flashcard</span>}
            </NavLink>
          </div>

          {/* Đường phân cách */}
          <div className="border-t border-slate-200 dark:border-[#1E293B] my-2" />

          {/* NHÓM 4: TIỆN ÍCH / HỖ TRỢ */}
          <div className="space-y-1">
            <NavLink
              to="/feature-requests"
              onClick={closeMobile}
              className={navLinkClass}
              title="Đề xuất tính năng"
            >
              <Lightbulb className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Đề xuất tính năng</span>}
            </NavLink>

            <NavLink
              to="/news"
              onClick={closeMobile}
              className={navLinkClass}
              title="Tin tức"
            >
              <Newspaper className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Tin tức</span>}
            </NavLink>

            <NavLink
              to="/contact"
              onClick={closeMobile}
              className={navLinkClass}
              title="Hỗ trợ"
            >
              <Headphones className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200 shrink-0 transition-colors" />
              {!isCollapsed && <span>Hỗ trợ</span>}
            </NavLink>
          </div>
        </div>

        {/* Chân trang Sidebar: Tích hợp Đổi giao diện Sáng / Tối & Đăng xuất trên Mobile */}
        <div className="p-3 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50/70 dark:bg-[#070A14] text-[11px] text-slate-500 shrink-0 select-none transition-colors">
          {/* Mobile Quick Utility Controls */}
          <div className="lg:hidden flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nền sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>Nền tối</span>
                </>
              )}
            </button>

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="h-9 px-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Thoát</span>
              </button>
            )}
          </div>

          {!isCollapsed && (
            <>
              <div className="flex flex-wrap justify-center gap-x-2 text-slate-500 dark:text-slate-500">
                <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                  Điều khoản
                </span>
                <span>•</span>
                <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                  Bảo mật
                </span>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-[#4F46E5] dark:text-indigo-400/90 font-medium">
                <Sparkles className="w-3 h-3" />
                <span>InnoQuiz Engine</span>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
