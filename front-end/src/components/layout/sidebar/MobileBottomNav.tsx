import React from "react";
import { NavLink } from "react-router-dom";
import { Flame, BookOpen, Plus, Target, Menu } from "lucide-react";
import { useSidebar } from "./SidebarContext";

export const MobileBottomNav: React.FC = () => {
  const { toggleMobile, isMobileOpen } = useSidebar();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] py-1 text-[10px] font-bold transition-all active:scale-90 ${
      isActive
        ? "text-[#4F46E5] dark:text-[#818CF8]"
        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
    }`;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-[#090D1A]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-[#1E293B] px-3 flex items-center justify-around shadow-lg select-none"
      aria-label="Thanh điều hướng dưới điện thoại"
    >
      {/* 1. Khám phá */}
      <NavLink to="/explore" className={navItemClass}>
        {({ isActive }) => (
          <>
            <Flame className={`w-5 h-5 ${isActive ? "text-[#4F46E5] dark:text-[#818CF8]" : ""}`} />
            <span>Khám phá</span>
          </>
        )}
      </NavLink>

      {/* 2. Kho đề thi */}
      <NavLink to="/quiz" className={navItemClass}>
        {({ isActive }) => (
          <>
            <BookOpen className={`w-5 h-5 ${isActive ? "text-[#4F46E5] dark:text-[#818CF8]" : ""}`} />
            <span>Kho đề</span>
          </>
        )}
      </NavLink>

      {/* 3. Nút Tạo đề thi nổi bật ở giữa */}
      <NavLink
        to="/create-quiz"
        className="flex flex-col items-center justify-center -mt-5 group"
        title="Tạo đề thi mới"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#4F46E5] to-indigo-500 hover:from-[#4338CA] hover:to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-active:scale-95 transition-all ring-4 ring-white dark:ring-[#090D1A]">
          <Plus className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1">
          Tạo đề
        </span>
      </NavLink>

      {/* 4. Ôn tập */}
      <NavLink to="/practice" className={navItemClass}>
        {({ isActive }) => (
          <>
            <Target className={`w-5 h-5 ${isActive ? "text-[#4F46E5] dark:text-[#818CF8]" : ""}`} />
            <span>Ôn tập</span>
          </>
        )}
      </NavLink>

      {/* 5. Nút mở toàn bộ Menu Drawer */}
      <button
        type="button"
        onClick={toggleMobile}
        className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] py-1 text-[10px] font-bold transition-all active:scale-90 cursor-pointer ${
          isMobileOpen
            ? "text-[#4F46E5] dark:text-[#818CF8]"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
        aria-label="Mở toàn bộ menu"
      >
        <Menu className="w-5 h-5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
