import React from "react";
import Header from "../components/layout/header/Header";
import { Footer } from "../components/layout/footer/Footer";
import { Sidebar } from "../components/layout/sidebar/Sidebar";
import { MobileBottomNav } from "../components/layout/sidebar/MobileBottomNav";
import { SidebarProvider, useSidebar } from "../components/layout/sidebar/SidebarContext";

const DashboardLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#090D1A] text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200 overflow-x-hidden">
      {/* 1. Sidebar bên trái (Desktop hiển thị cố định, Mobile là ngăn kéo vuốt trượt) */}
      <Sidebar />

      {/* 2. Main Layout bên phải (tự động điều chỉnh khoảng lề theo trạng thái sidebar) */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-x-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Header tinh gọn */}
        <Header />

        {/* Nội dung trang (có padding đáy pb-20 trên mobile để không bị che bởi Bottom Nav) */}
        <main className="flex-1 py-6 pb-20 lg:pb-6">{children}</main>

        {/* Footer */}
        <Footer />
      </div>

      {/* 3. Thanh điều hướng cố định dưới đáy màn hình trên Mobile */}
      <MobileBottomNav />
    </div>
  );
};

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
};

export default DashboardLayout;
