import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import Forbidden403 from "../layout/Forbidden403";

interface RoleRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

  // 1. Chưa đăng nhập -> Chuyển về trang đăng nhập
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Đã đăng nhập nhưng chưa tải xong user state trong Redux -> thử lấy từ localStorage / JWT
  let currentRole = (user?.role || "").toUpperCase();
  if (!currentRole) {
    try {
      const saved = localStorage.getItem("user");
      if (saved) currentRole = (JSON.parse(saved)?.role || "").toUpperCase();
    } catch {}
  }
  if (!currentRole && token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        currentRole = (JSON.parse(atob(parts[1]))?.role || "").toUpperCase();
      }
    } catch {}
  }

  if (!currentRole) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = currentRole === "USER" ? "STUDENT" : currentRole;

  const hasPermission = allowedRoles
    .map((r) => r.toUpperCase())
    .includes(normalizedRole);

  // 3. Sai quyền -> Hiển thị trang 403 Forbidden
  if (!hasPermission) {
    return <Forbidden403 currentRole={normalizedRole} />;
  }

  return <>{children}</>;
};

export default RoleRoute;
