import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import type { SidebarConfig } from "../../../config/navigation/types";
import UserMenu from "./UserMenu";
import logo from "../../../assets/images/logo_quiz.png";

interface AppSidebarProps {
  /** Cấu hình menu theo role */
  config: SidebarConfig;
  /** Sidebar đang thu gọn (desktop) */
  isCollapsed: boolean;
  /** Sidebar mobile đang mở */
  isMobileOpen: boolean;
  /** Callback đóng sidebar mobile */
  onMobileClose: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  config,
  isCollapsed,
  isMobileOpen,
  onMobileClose,
}) => {
  const location = useLocation();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
      isActive
        ? "bg-indigo-50/90 text-[#4F46E5] font-bold border border-indigo-200/80 shadow-2xs dark:bg-[#1E1B4B] dark:text-[#A5B4FC] dark:border-indigo-500/40"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-[#131B2E]"
    }`;

  const RoleBadgeIcon = config.roleBadgeIcon;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#0E1326] text-slate-800 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Link
            to={config.basePath}
            onClick={onMobileClose}
            className="flex items-center gap-3 overflow-hidden select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-[#1E1B4B] border border-indigo-200/70 dark:border-indigo-500/30 p-1 flex items-center justify-center shrink-0">
              <img src={logo} alt="InnoQuiz HUBT" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  {config.brandName}
                  <span className="text-[#4F46E5] dark:text-[#818CF8]">{config.brandSuffix}</span>
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-widest -mt-0.5 flex items-center gap-1 ${config.roleBadgeColor}`}
                >
                  <RoleBadgeIcon className="w-3 h-3" /> {config.roleLabel}
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div
          className="flex-1 overflow-y-auto py-4 px-3 space-y-4 no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {config.navigation.map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <span className="block px-3 mb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.label}
                </span>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isHighlight = item.highlight;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={onMobileClose}
                    className={isHighlight ? undefined : navLinkClass}
                    {...(isHighlight
                      ? {
                          className: ({ isActive }: { isActive: boolean }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                              isActive
                                ? "bg-indigo-50/90 text-[#4F46E5] font-bold border border-indigo-200/80 shadow-2xs dark:bg-[#1E1B4B] dark:text-[#A5B4FC] dark:border-indigo-500/40"
                                : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30"
                            }`,
                        }
                      : {})}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isHighlight
                          ? "text-indigo-500"
                          : "text-slate-400 group-hover:text-slate-600 dark:text-slate-400"
                      }`}
                    />
                    {!isCollapsed && (
                      <span className={isHighlight ? "font-semibold" : ""}>
                        {item.label}
                      </span>
                    )}
                    {item.badge !== undefined && item.badge > 0 && !isCollapsed && (
                      <span className="ml-auto text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer: User Info & Logout */}
        <UserMenu
          isCollapsed={isCollapsed}
          fallbackInitial={config.brandName[0]}
          fallbackName={config.roleLabel}
        />
      </aside>
    </>
  );
};

export default AppSidebar;
