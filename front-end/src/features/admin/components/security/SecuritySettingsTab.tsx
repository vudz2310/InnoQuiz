import React, { useState, useEffect } from "react";
import { Sliders, Save, RefreshCw, Lock, ShieldAlert, KeyRound, Radio } from "lucide-react";
import { Button } from "../../../../components/ui";

interface SecuritySettingsTabProps {
  settings: Record<string, string>;
  loading: boolean;
  onRefresh: () => void;
  onSaveSettings: (settings: Record<string, string>) => Promise<void>;
}

export const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({
  settings,
  loading,
  onRefresh,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: string) => {
    const current = formData[key] === "true";
    setFormData((prev) => ({ ...prev, [key]: current ? "false" : "true" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSaveSettings(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top action bar */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Cấu hình chính sách bảo mật động toàn hệ thống:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Nạp lại</span>
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={saving}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Session & Authentication Limits */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Quản lý Phiên đăng nhập & Thiết bị
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Giới hạn số phiên đồng thời mỗi tài khoản:
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.MAX_CONCURRENT_SESSIONS || "5"}
                onChange={(e) => handleChange("MAX_CONCURRENT_SESSIONS", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tự động đăng xuất phiên cũ nhất khi người dùng vượt quá số lượng thiết bị cho phép.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Thời gian hết hạn của Access Token (phút):
              </label>
              <input
                type="number"
                min={5}
                max={1440}
                value={formData.ACCESS_TOKEN_EXPIRY_MINUTES || "60"}
                onChange={(e) => handleChange("ACCESS_TOKEN_EXPIRY_MINUTES", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Bắt buộc đăng xuất thiết bị khác khi đổi mật khẩu
                </span>
                <span className="text-[11px] text-slate-400">
                  Thu hồi toàn bộ Refresh Token của các thiết bị cũ ngay tức thì.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.REVOKE_SESSIONS_ON_PASSWORD_CHANGE !== "false"}
                onChange={() => handleToggle("REVOKE_SESSIONS_ON_PASSWORD_CHANGE")}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Lockout & Brute-Force Prevention */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Chống dò mật khẩu (Brute-Force Protection)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Số lần đăng nhập sai tối đa trước khi khóa tạm thời:
              </label>
              <input
                type="number"
                min={3}
                max={20}
                value={formData.MAX_FAILED_LOGIN_ATTEMPTS || "5"}
                onChange={(e) => handleChange("MAX_FAILED_LOGIN_ATTEMPTS", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Thời gian khóa tài khoản tạm thời (phút):
              </label>
              <input
                type="number"
                min={5}
                max={1440}
                value={formData.ACCOUNT_LOCKOUT_DURATION_MINUTES || "15"}
                onChange={(e) => handleChange("ACCOUNT_LOCKOUT_DURATION_MINUTES", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Tự động chặn IP khi vượt quá 20 lần thử sai liên tục
                </span>
                <span className="text-[11px] text-slate-400">
                  Ghi vào danh sách Blocked Identifier trong 24 giờ.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.AUTO_BLOCK_SUSPICIOUS_IP !== "false"}
                onChange={() => handleToggle("AUTO_BLOCK_SUSPICIOUS_IP")}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 3: OTP & Email Verification */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <KeyRound className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Quy chuẩn Mã xác thực OTP
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Thời hạn hiệu lực của mã OTP (phút):
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={formData.OTP_EXPIRY_MINUTES || "5"}
                onChange={(e) => handleChange("OTP_EXPIRY_MINUTES", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Khoảng cách tối thiểu giữa 2 lần gửi lại OTP (giây):
              </label>
              <input
                type="number"
                min={30}
                max={300}
                value={formData.OTP_RESEND_COOLDOWN_SECONDS || "60"}
                onChange={(e) => handleChange("OTP_RESEND_COOLDOWN_SECONDS", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Threat Detection & Scraping Limits */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cảnh báo Quét dữ liệu Đề thi (Anti-Scraping)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Ngưỡng tải đề thi tối đa mỗi phút / IP:
              </label>
              <input
                type="number"
                min={10}
                max={200}
                value={formData.MAX_QUIZ_DOWNLOAD_PER_MINUTE || "30"}
                onChange={(e) => handleChange("MAX_QUIZ_DOWNLOAD_PER_MINUTE", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tự động gửi cảnh báo HIGH Severity khi phát hiện IP tải đề bất thường.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Bật bộ lọc User-Agent nghi vấn (Headless browser / Python script)
                </span>
                <span className="text-[11px] text-slate-400">
                  Tăng điểm rủi ro khi phát hiện request từ công cụ bot tự động.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.BLOCK_HEADLESS_AGENTS !== "false"}
                onChange={() => handleToggle("BLOCK_HEADLESS_AGENTS")}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
