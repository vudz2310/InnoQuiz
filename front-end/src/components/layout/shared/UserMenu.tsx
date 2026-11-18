import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import type { RootState } from "../../../store";
import { clearUser } from "../../../store/slices/auth.slice";

interface UserMenuProps {
  /** Ẩn thông tin khi sidebar thu gọn */
  isCollapsed: boolean;
  /** Ký tự mặc định khi không có tên user */
  fallbackInitial?: string;
  /** Tên mặc định */
  fallbackName?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({
  isCollapsed,
  fallbackInitial = "U",
  fallbackName = "User",
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(clearUser());
    navigate("/login", { replace: true });
  };

  return (
    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#090D1A] shrink-0">
      <div className="flex items-center justify-between gap-2">
        {!isCollapsed && (
          <Link
            to="/profile"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity cursor-pointer flex-1"
            title="Xem hồ sơ & Bảo mật tài khoản"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || fallbackInitial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || fallbackName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </span>
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title="Đăng xuất"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default UserMenu;
