import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ChevronRight, Sun, Moon, Bell, Search } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import type { BreadcrumbMap } from "../../../config/navigation/types";

interface AppHeaderProps {
  /** Callback bật mobile sidebar */
  onMobileMenuOpen: () => void;
  /** Callback toggle sidebar collapse (desktop) */
  onToggleCollapse: () => void;
  /** Sidebar đang thu gọn */
  isCollapsed: boolean;
  /** Map segment URL → nhãn tiếng Việt */
  breadcrumbMap: BreadcrumbMap;
  /** Hiển thị ô tìm kiếm */
  showSearch?: boolean;
  /** Placeholder ô tìm kiếm */
  searchPlaceholder?: string;
  /** Hiển thị chuông thông báo */
  showNotifications?: boolean;
  /** Số thông báo chưa đọc */
  notificationCount?: number;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onMobileMenuOpen,
  onToggleCollapse,
  isCollapsed,
  breadcrumbMap,
  showSearch = false,
  searchPlaceholder = "Tìm kiếm...",
  showNotifications = false,
  notificationCount = 0,
}) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Generate breadcrumbs from pathname
  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, idx) => {
    const url = `/${segments.slice(0, idx + 1).join("/")}`;
    const label = breadcrumbMap[seg] || seg;
    return { url, label };
  });

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#0E1326] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMobileMenuOpen}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop sidebar collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
          title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={b.url}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-slate-900 dark:text-white">
                  {b.label}
                </span>
              ) : (
                <Link to={b.url} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {b.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        {showSearch && (
          <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 w-56 lg:w-72">
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="bg-transparent outline-none w-full text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        )}

        {/* Notifications */}
        {showNotifications && (
          <button
            type="button"
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
        )}

        {/* Quick Link to Student/Public Portal */}
        <Link
          to="/explore"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold transition-all shadow-2xs"
          title="Xem kho đề thi và hệ thống học tập sinh viên"
        >
          <span>Kho đề thi</span>
          <span className="text-[10px] opacity-75">HUBT</span>
        </Link>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Đổi giao diện Sáng / Tối"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
