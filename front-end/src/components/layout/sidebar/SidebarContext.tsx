import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isMobileOpen: boolean;
  isCollapsed: boolean;
  toggleMobile: () => void;
  toggleCollapse: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Chặn cuộn trang nền khi mở menu trên di động
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        isCollapsed,
        toggleMobile,
        toggleCollapse,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

const defaultSidebarContext: SidebarContextType = {
  isMobileOpen: false,
  isCollapsed: false,
  toggleMobile: () => {},
  toggleCollapse: () => {},
  closeMobile: () => {},
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  return context || defaultSidebarContext;
};
