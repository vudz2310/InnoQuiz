import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar, AppHeader } from "../components/layout/shared";
import { teacherNavigation, teacherBreadcrumbs } from "../config/navigation/teacher.navigation";

export const TeacherLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#090D1A] text-slate-900 dark:text-slate-100 antialiased transition-colors">
      {/* Sidebar giảng viên */}
      <AppSidebar
        config={teacherNavigation}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Header giảng viên: breadcrumb + tìm kiếm + thông báo + theme */}
        <AppHeader
          onMobileMenuOpen={() => setIsMobileOpen(true)}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isCollapsed={isCollapsed}
          breadcrumbMap={teacherBreadcrumbs}
          showSearch
          searchPlaceholder="Tìm đề thi, sinh viên..."
          showNotifications
        />

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
