import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Clock,
  Mail,
  Phone,
  RefreshCw,
  LogOut,
  AlertOctagon,
  Lock,
  Building2,
  MapPin,
} from "lucide-react";
import { Button } from "../ui";

export interface BlockedAccessDetail {
  isBlocked: boolean;
  type?: "IP" | "USER" | "STUDENT_CODE" | "SYSTEM";
  reason: string;
  blockedUntil?: string | null;
  identifier?: string;
}

export const BlockedAccessBanner: React.FC = () => {
  const [blockedInfo, setBlockedInfo] = useState<BlockedAccessDetail | null>(() => {
    // Kiểm tra nếu có trạng thái bị chặn đã lưu trong session
    const cached = sessionStorage.getItem("HUBT_BLOCKED_STATE");
    if (cached) {
      try {
        return JSON.parse(cached) as BlockedAccessDetail;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleBlockedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<BlockedAccessDetail>;
      if (customEvent.detail) {
        const info: BlockedAccessDetail = {
          isBlocked: true,
          type: customEvent.detail.type || "IP",
          reason:
            customEvent.detail.reason ||
            "Hệ thống an ninh InnoQuiz HUBT phát hiện hành vi vi phạm chính sách bảo mật hoặc tài khoản của bạn đã bị Quản trị viên đình chỉ.",
          blockedUntil: customEvent.detail.blockedUntil || null,
          identifier: customEvent.detail.identifier,
        };
        setBlockedInfo(info);
        sessionStorage.setItem("HUBT_BLOCKED_STATE", JSON.stringify(info));
      }
    };

    window.addEventListener("HUBT_ACCESS_BLOCKED", handleBlockedEvent);

    return () => {
      window.removeEventListener("HUBT_ACCESS_BLOCKED", handleBlockedEvent);
    };
  }, []);

  // Tính toán thời gian đếm ngược nếu có blockedUntil
  useEffect(() => {
    if (!blockedInfo?.blockedUntil) {
      setTimeLeft("");
      return;
    }

    const calculateRemaining = () => {
      const targetTime = new Date(blockedInfo.blockedUntil!).getTime();
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft("Đã hết thời hạn khóa. Bạn có thể bấm 'Thử lại kết nối'!");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours} giờ`);
      if (minutes > 0 || hours > 0) parts.push(`${minutes} phút`);
      parts.push(`${seconds} giây`);

      setTimeLeft(parts.join(" "));
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [blockedInfo?.blockedUntil]);

  if (!blockedInfo || !blockedInfo.isBlocked) {
    return null;
  }

  const handleRetry = async () => {
    try {
      setChecking(true);
      // Gửi request kiểm tra đến máy chủ
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL || "http://localhost:5000/v1"}/health`,
        {
          method: "GET",
        },
      );
      if (res.ok) {
        sessionStorage.removeItem("HUBT_BLOCKED_STATE");
        setBlockedInfo(null);
        window.location.reload();
      }
    } catch {
      // Vẫn bị chặn
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("HUBT_BLOCKED_STATE");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="max-w-2xl w-full bg-[#0F172A] border-2 border-rose-600/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/50 space-y-6 text-slate-100 my-auto animate-in zoom-in-95 duration-300">
        {/* Header with Red Shield */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-3xl bg-rose-950/80 border-2 border-rose-500/40 text-rose-500 shadow-lg shadow-rose-900/30 animate-pulse">
            <ShieldAlert className="w-12 h-12" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-900/60 border border-rose-700/60 text-rose-300 mb-2">
              <Lock className="w-3.5 h-3.5" />
              Hệ thống Bảo vệ & Giám sát An ninh HUBT
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              TRUY CẬP ĐÃ BỊ KHÓA
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto leading-relaxed">
              Bạn tạm thời không thể truy cập hoặc tương tác với bất kỳ nội dung nào trên hệ thống InnoQuiz HUBT do phát hiện vi phạm quy chuẩn an toàn.
            </p>
          </div>
        </div>

        {/* Detailed Info Cards */}
        <div className="space-y-3 text-xs">
          {/* Card: Lý do */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-900/50 space-y-1.5">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <AlertOctagon className="w-4 h-4" />
              <span>Lý do ghi nhận vi phạm:</span>
            </div>
            <p className="text-slate-200 leading-relaxed font-medium bg-rose-950/30 p-3 rounded-xl border border-rose-900/30">
              {blockedInfo.reason}
            </p>
            {blockedInfo.identifier && (
              <p className="text-[11px] text-slate-400 font-mono pt-1">
                Đối tượng bị hạn chế: <span className="text-white font-bold">{blockedInfo.identifier}</span> ({blockedInfo.type === "IP" ? "Địa chỉ IP" : "Tài khoản sinh viên"})
              </p>
            )}
          </div>

          {/* Card: Thời hạn */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Clock className="w-4 h-4" />
              <span>Thời hạn hiệu lực của lệnh chặn:</span>
            </div>
            {blockedInfo.blockedUntil ? (
              <div className="space-y-1">
                <p className="text-amber-300 font-mono font-black text-base">
                  {timeLeft || "Đang tính toán..."}
                </p>
                <p className="text-[11px] text-slate-400">
                  Thời điểm tự động gỡ chặn: {new Date(blockedInfo.blockedUntil).toLocaleString("vi-VN")}
                </p>
              </div>
            ) : (
              <p className="text-rose-400 font-bold text-sm">
                Khóa vĩnh viễn (Cần Ban Quản trị phê duyệt mở khóa thủ công)
              </p>
            )}
          </div>

          {/* Card: Thông tin Ban Quản trị HUBT */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
              <Building2 className="w-4 h-4" />
              <span>Đơn vị hỗ trợ & Giải quyết khiếu nại:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">innoquiz.hubt@gmail.com</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>(024) 3633 6513 (Khoa CNTT)</span>
              </div>
              <div className="sm:col-span-2 flex items-start gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>Số 29A, Ngõ 124, Phố Vĩnh Tuy, P. Vĩnh Tuy, Q. Hai Bà Trưng, Hà Nội</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRetry}
            disabled={checking}
            className="w-full sm:flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border-slate-700 font-bold text-xs justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin text-indigo-400" : ""}`} />
            <span>{checking ? "Đang kiểm tra kết nối..." : "Kiểm tra & Thử lại kết nối"}</span>
          </Button>

          <Button
            variant="danger"
            size="md"
            onClick={handleLogout}
            className="w-full sm:flex-1 py-2.5 font-bold text-xs justify-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlockedAccessBanner;
