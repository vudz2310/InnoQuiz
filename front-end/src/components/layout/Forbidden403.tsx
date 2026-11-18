import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { clearUser } from "../../store/slices/auth.slice";

interface Forbidden403Props {
  currentRole?: string;
}

export const Forbidden403: React.FC<Forbidden403Props> = ({ currentRole }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(clearUser());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D1A] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 mx-auto flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 mb-3">
          403 — Truy cập bị từ chối
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Bạn không có quyền truy cập
        </h1>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Khu vực này yêu cầu quyền hạn cao hơn vai trò hiện tại của bạn{" "}
          {currentRole && (
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              ({currentRole})
            </span>
          )}
          . Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ Ban Quản trị hệ thống InnoQuiz HUBT.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang trước
          </button>

          {currentRole === "ADMIN" ? (
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Về Cổng Quản trị
            </Link>
          ) : currentRole === "TEACHER" ? (
            <Link
              to="/teacher"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Về Cổng Giảng viên
            </Link>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Về Trang chủ
            </Link>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng nhập tài khoản khác
          </button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden403;
