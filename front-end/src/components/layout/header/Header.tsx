import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  LogOut,
  Plus,
  User as UserIcon,
  Sun,
  Moon,
  Search,
  X,
  ShieldCheck,
  School,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../../store";
import { clearUser } from "../../../store/slices/auth.slice";
import { NotificationBell, useNotification } from "../../Notification";
import { useSidebar } from "../sidebar/SidebarContext";
import { useTheme } from "../../../context/ThemeContext";
import logo from "../../../assets/images/logo_quiz.png";

const Header: React.FC = () => {
  const { toggleMobile, toggleCollapse, isCollapsed } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showSuccess } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    dispatch(clearUser());
    showSuccess("Đã đăng xuất", "Hẹn gặp lại bạn lần sau tại InnoQuiz!");
    navigate("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/quiz?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#090D1A]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#1E293B] px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile Toggle Button (Touch target 40px, active scale) */}
        <button
          type="button"
          onClick={toggleMobile}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 active:scale-90 lg:hidden transition-all cursor-pointer shadow-2xs"
          aria-label="Mở thanh menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden lg:flex p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={isCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand */}
        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <img
            src={logo}
            alt="InnoQuiz"
            className="w-7 h-7 rounded-lg object-contain"
          />
          <span className="font-extrabold text-sm text-[#4F46E5] dark:text-indigo-400">
            InnoQuiz
          </span>
        </Link>
      </div>

      {/* Center: Search Bar "Tìm môn học, đề thi..." */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md mx-3 lg:mx-6 relative"
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm môn học, đề thi..."
          className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-[#111827] focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            {/* <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-200/70 dark:bg-slate-700/60 border border-slate-300/60 dark:border-slate-600/60 rounded">
              Enter
            </kbd> */}
          </div>
        )}
      </form>

      {/* Right: Tinh gọn cho Mobile (chống tràn viền) & Đầy đủ trên Desktop */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Nút Tạo đề thi chính: Chỉ hiện từ màn hình sm trở lên vì Mobile đã có Bottom Nav & Sidebar */}
        <Link
          to="/create-quiz"
          className="hidden sm:flex px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          title="Tạo đề thi mới"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Tạo đề thi</span>
        </Link>

        {/* Nút Chuyển đổi nền Trắng / Đen (Light / Dark mode) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-all cursor-pointer shadow-2xs"
          title={
            theme === "dark"
              ? "Chuyển sang nền Sáng (Trắng tinh)"
              : "Chuyển sang nền Tối (Đen sâu)"
          }
          aria-label="Đổi giao diện Sáng / Tối"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Chuông thông báo */}
        <NotificationBell />

        <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700 my-auto" />

        {/* Profile / Auth Actions */}
        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {user.role === "ADMIN" && (
              <Link
                to="/admin"
                className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-bold items-center gap-1.5 transition-all shadow-2xs"
                title="Vào Cổng Quản trị Admin"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Admin</span>
              </Link>
            )}
            {user.role === "TEACHER" && (
              <Link
                to="/teacher"
                className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold items-center gap-1.5 transition-all shadow-2xs"
                title="Vào Cổng Giảng viên"
              >
                <School className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Giảng viên</span>
              </Link>
            )}
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/60 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 transition-all cursor-pointer"
              title="Trang cá nhân"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-[#4F46E5] dark:text-indigo-300 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.name?.charAt(0)?.toUpperCase() || (
                    <UserIcon className="w-3.5 h-3.5" />
                  )
                )}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate hidden md:inline">
                {user.name}
              </span>
            </Link>

            {/* Nút Đăng xuất: Chỉ hiện từ sm trở lên vì trên mobile đã có trong Drawer và Profile */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-bold text-[#4F46E5] dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-xl shadow-xs transition-all"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
