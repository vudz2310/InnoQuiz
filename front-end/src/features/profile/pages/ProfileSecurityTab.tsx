import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  Globe,
  LogOut,
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { securityApi, type UserSessionItem } from "../../../services/api/Security.api";
import { useNotification } from "../../../components/Notification";

export default function ProfileSecurityTab() {
  const { showSuccess, showError } = useNotification();
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [confirmRevokeOther, setConfirmRevokeOther] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await securityApi.getUserSessions();
      setSessions(data);
    } catch (err: unknown) {
      console.error("Lỗi khi tải danh sách phiên đăng nhập:", err);
      showError("Không thể tải phiên đăng nhập", "Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingId(sessionId);
      await securityApi.revokeSession(sessionId);
      showSuccess("Đã đăng xuất thiết bị", "Phiên đăng nhập đã được thu hồi thành công.");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: unknown) {
      console.error("Lỗi khi thu hồi phiên:", err);
      showError("Lỗi thao tác", "Không thể đăng xuất phiên đã chọn.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      setRevokingOthers(true);
      await securityApi.revokeOtherSessions();
      showSuccess("Đã đăng xuất tất cả thiết bị khác", "Chỉ còn phiên hiện tại đang duy trì đăng nhập.");
      setConfirmRevokeOther(false);
      fetchSessions();
    } catch (err: unknown) {
      console.error("Lỗi khi thu hồi các phiên khác:", err);
      showError("Lỗi thao tác", "Không thể thu hồi các phiên đăng nhập khác.");
    } finally {
      setRevokingOthers(false);
    }
  };

  const isMobile = (deviceInfo?: string | null) => {
    if (!deviceInfo) return false;
    const lower = deviceInfo.toLowerCase();
    return lower.includes("mobile") || lower.includes("android") || lower.includes("iphone") || lower.includes("ipad");
  };

  return (
    <div className="space-y-8">
      {/* Header Overview Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Quản lý phiên đăng nhập & Thiết bị
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Xem và kiểm soát tất cả thiết bị và trình duyệt đang duy trì đăng nhập tài khoản HUBT của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </button>
            {sessions.length > 1 && (
              <button
                onClick={() => setConfirmRevokeOther(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất thiết bị khác</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Sessions List */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Danh sách thiết bị ({sessions.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Tự động thu hồi sau 7 ngày không hoạt động
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Đang quét danh sách thiết bị...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            Không tìm thấy phiên đăng nhập nào.
          </div>
        ) : (
          <div className="space-y-3.5">
            {sessions.map((session) => {
              const mobile = isMobile(session.deviceInfo);
              const DeviceIcon = mobile ? Smartphone : Laptop;
              return (
                <div
                  key={session.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    session.isCurrent
                      ? "border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                        session.isCurrent
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <DeviceIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {session.deviceInfo || "Trình duyệt Web"}
                        </span>
                        {session.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Thiết bị này (Hiện tại)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Globe className="w-3.5 h-3.5" />
                          IP: {session.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Đăng nhập: {new Date(session.createdAt).toLocaleString("vi-VN")}
                        </span>
                        <span>• Hoạt động gần nhất: {new Date(session.lastActiveAt).toLocaleString("vi-VN")}</span>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingId === session.id}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer disabled:opacity-50 self-end sm:self-auto shrink-0 flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{revokingId === session.id ? "Đang hủy..." : "Đăng xuất"}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Best Practices & Tips */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-sm">
          <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Khuyến nghị an toàn cho tài khoản HUBT</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              1. Máy tính phòng máy / Thư viện HUBT
            </p>
            <p>
              Luôn đăng xuất sau khi làm bài thi hoặc ôn tập tại các máy tính công cộng để tránh bị lưu phiên.
            </p>
          </div>
          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              2. Mã xác thực OTP qua Email
            </p>
            <p>
              Mã OTP đăng ký/quên mật khẩu có hiệu lực 5 phút và chỉ sử dụng 1 lần. Tuyệt đối không chia sẻ mã này.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Xác nhận đăng xuất thiết bị khác */}
      {confirmRevokeOther && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Đăng xuất khỏi tất cả thiết bị khác?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Tất cả các trình duyệt và thiết bị khác sẽ bị đăng xuất ngay lập tức. Bạn chỉ duy trì phiên làm việc trên trình duyệt này.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmRevokeOther(false)}
                disabled={revokingOthers}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRevokeOtherSessions}
                disabled={revokingOthers}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {revokingOthers ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Xác nhận đăng xuất</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
