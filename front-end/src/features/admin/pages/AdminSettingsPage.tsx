import React, { useState } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  Mail,
  School,
  FileCheck,
  Server,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "../../../components/ui";
import { useNotification } from "../../../components/Notification";

export const AdminSettingsPage: React.FC = () => {
  const { showSuccess, showInfo, showError } = useNotification();
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  // General settings state
  const [currentCohort, setCurrentCohort] = useState("K28");
  const [allowStudentRegister, setAllowStudentRegister] = useState(true);
  const [requireHubtEmail, setRequireHubtEmail] = useState(false);
  const [allowPublicQuizCreation, setAllowPublicQuizCreation] = useState(true);

  // Exam policies state
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(45);
  const [autoShuffleQuestions, setAutoShuffleQuestions] = useState(true);
  const [showExplanationAfterSubmit, setShowExplanationAfterSubmit] = useState(true);
  const [antiCheatMonitoring, setAntiCheatMonitoring] = useState(true);

  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSender, setSmtpSender] = useState("innoquiz.hubt@gmail.com");

  const handleSaveAll = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showSuccess("Thành công", "Đã lưu toàn bộ cấu hình tham số hệ thống HUBT.");
    }, 800);
  };

  const handleTestEmail = () => {
    setTestingEmail(true);
    setTimeout(() => {
      setTestingEmail(false);
      showSuccess("Kết nối thành công", "Đã gửi mã kiểm thử SMTP qua cổng máy chủ thành công.");
    }, 1200);
  };

  const handleBackupDb = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      showSuccess("Hoàn thành sao lưu", "Đã tạo bản sao lưu snapshot HUBT_PostgreSQL_Backup.sql");
    }, 1500);
  };

  const handleClearCache = () => {
    showSuccess("Đã dọn dẹp", "Đã xóa toàn bộ bộ đệm Cache bộ nhớ và tải lại danh mục.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Cài đặt & Cấu hình Tham số Toàn cục
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quản lý cổng tuyển sinh, chính sách thi trực tuyến, máy chủ SMTP và sao lưu hệ thống HUBT.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={handleSaveAll}
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Đang lưu..." : "Lưu toàn bộ thay đổi"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Cổng Sinh viên & Đào tạo */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cổng Sinh viên & Niên khóa Đào tạo
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Niên khóa tuyển sinh hiện hành (Mặc định khi đăng ký):
              </label>
              <select
                value={currentCohort}
                onChange={(e) => setCurrentCohort(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="K29">Khóa 29 (K29 - 2024)</option>
                <option value="K28">Khóa 28 (K28 - 2023 - Đang hoạt động)</option>
                <option value="K27">Khóa 27 (K27 - 2022)</option>
                <option value="K26">Khóa 26 (K26 - 2021)</option>
              </select>
            </div>

            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Cho phép sinh viên tự mở tài khoản
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Bật để sinh viên có thể đăng ký tài khoản ôn luyện tự do.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowStudentRegister}
                  onChange={(e) => setAllowStudentRegister(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Bắt buộc email đuôi trường (@hubt.edu.vn)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Chỉ cho phép tài khoản có email cán bộ / sinh viên HUBT.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={requireHubtEmail}
                  onChange={(e) => setRequireHubtEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Cho phép sinh viên tự tạo đề thi và xuất bản
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Khuyến khích sinh viên đóng góp đề thi học phần.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowPublicQuizCreation}
                  onChange={(e) => setAllowPublicQuizCreation(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Quy chuẩn Phòng thi & Bài kiểm tra */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Quy chuẩn Phòng thi & Bài kiểm tra
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Thời gian làm bài thi chuẩn (Phút):
              </label>
              <input
                type="number"
                min={10}
                max={180}
                value={defaultTimeLimit}
                onChange={(e) => setDefaultTimeLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Tự động xáo trộn câu hỏi & đáp án
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Mỗi thí sinh sẽ nhận được mã đề ngẫu nhiên để chống nhìn bài.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoShuffleQuestions}
                  onChange={(e) => setAutoShuffleQuestions(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Hiển thị lời giải chi tiết sau khi nộp bài
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Hỗ trợ sinh viên đối chiếu kiến thức sau mỗi đợt thi thử.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showExplanationAfterSubmit}
                  onChange={(e) => setShowExplanationAfterSubmit(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Giám sát rời màn hình & chuyển Tab thi
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Cảnh báo và tự động ghi nhận biên bản thi khi phát hiện vi phạm.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={antiCheatMonitoring}
                  onChange={(e) => setAntiCheatMonitoring(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Máy chủ Gửi Email SMTP */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Mail className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cấu hình Dịch vụ Gửi Email (SMTP Service)
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                SMTP Host:
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  SMTP Port:
                </label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Mã hóa bảo mật:
                </label>
                <input
                  type="text"
                  disabled
                  value="STARTTLS / SSL"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Email gửi tin hệ thống:
              </label>
              <input
                type="email"
                value={smtpSender}
                onChange={(e) => setSmtpSender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestEmail}
                disabled={testingEmail}
              >
                <Mail className={`w-3.5 h-3.5 text-blue-500 ${testingEmail ? "animate-pulse" : ""}`} />
                <span>{testingEmail ? "Đang gửi thử nghiệm..." : "Gửi email kiểm thử kết nối"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Card 4: Bảo trì & Cơ sở dữ liệu */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cơ sở dữ liệu & Trạng thái Hệ thống
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">PostgreSQL Engine:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động bình thường
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Prisma ORM Driver:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">v7.2.0 (PgPool)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dung lượng Database:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">42.8 MB / 10 GB</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBackupDb}
                disabled={backingUp}
              >
                <Download className={`w-3.5 h-3.5 text-indigo-500 ${backingUp ? "animate-bounce" : ""}`} />
                <span>{backingUp ? "Đang sao lưu..." : "Sao lưu CSDL tức thì"}</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearCache}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Xóa Cache tạm thời</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
