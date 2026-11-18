import React, { useState, useEffect } from "react";
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Globe,
  Code,
  ShieldCheck,
  Calendar,
  X,
} from "lucide-react";
import { Button, Pagination } from "../../../components/ui";
import { useNotification } from "../../../components/Notification";

interface AuditLogItem {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  actionLabel: string;
  category: "CLASS" | "MAJOR" | "USER" | "QUIZ" | "SECURITY" | "SETTINGS";
  targetType: string;
  targetName: string;
  ipAddress: string;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
  details?: Record<string, unknown>;
}

export const AdminAuditLogPage: React.FC = () => {
  const { showSuccess, showInfo } = useNotification();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [timeRange, setTimeRange] = useState("7d");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Mock audit log items
  const mockAuditLogs: AuditLogItem[] = [
    {
      id: "log-1",
      adminEmail: "admin@hubt.edu.vn",
      adminName: "Quản trị viên HUBT",
      action: "UPDATE_SECURITY_SETTINGS",
      actionLabel: "Cập nhật cấu hình bảo mật",
      category: "SECURITY",
      targetType: "SecuritySetting",
      targetName: "MAX_CONCURRENT_SESSIONS -> 5",
      ipAddress: "127.0.0.1",
      status: "SUCCESS",
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      details: {
        settingKey: "MAX_CONCURRENT_SESSIONS",
        oldValue: "3",
        newValue: "5",
        reason: "Điều chỉnh hạn mức thiết bị sinh viên",
      },
    },
    {
      id: "log-2",
      adminEmail: "admin@hubt.edu.vn",
      adminName: "Quản trị viên HUBT",
      action: "BLOCK_IDENTIFIER",
      actionLabel: "Chặn địa chỉ IP nghi vấn",
      category: "SECURITY",
      targetType: "BlockedIdentifier",
      targetName: "IP: 113.190.234.12",
      ipAddress: "127.0.0.1",
      status: "SUCCESS",
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      details: {
        ip: "113.190.234.12",
        reason: "Đăng nhập sai quá 10 lần liên tục",
        duration: "24h",
      },
    },
    {
      id: "log-3",
      adminEmail: "admin@hubt.edu.vn",
      adminName: "Quản trị viên HUBT",
      action: "CREATE_CLASS",
      actionLabel: "Thêm lớp học phần mới",
      category: "CLASS",
      targetType: "AcademicClass",
      targetName: "TH28.01 - Công nghệ phần mềm K28",
      ipAddress: "127.0.0.1",
      status: "SUCCESS",
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      details: {
        classCode: "TH28.01",
        name: "Công nghệ phần mềm 01",
        cohort: "K28",
        majorCode: "CNTT",
      },
    },
    {
      id: "log-4",
      adminEmail: "admin@hubt.edu.vn",
      adminName: "Quản trị viên HUBT",
      action: "UPDATE_STUDENT_STATUS",
      actionLabel: "Khóa tài khoản sinh viên vi phạm",
      category: "USER",
      targetType: "User",
      targetName: "Sinh viên 24D190123 (Nguyễn Văn B)",
      ipAddress: "127.0.0.1",
      status: "SUCCESS",
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      details: {
        studentId: "usr-49281",
        status: "BLOCKED",
        reason: "Gian lận trong phòng thi trực tuyến",
      },
    },
    {
      id: "log-5",
      adminEmail: "admin@hubt.edu.vn",
      adminName: "Quản trị viên HUBT",
      action: "PUBLISH_QUIZ_GLOBAL",
      actionLabel: "Duyệt xuất bản đề thi toàn trường",
      category: "QUIZ",
      targetType: "Quiz",
      targetName: "Cơ sở dữ liệu - Thi kết thúc học phần HK1",
      ipAddress: "127.0.0.1",
      status: "SUCCESS",
      createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      details: {
        quizId: "qz-9921",
        questionsCount: 50,
        timeLimit: 45,
      },
    },
  ];

  const filteredLogs = mockAuditLogs.filter((log) => {
    if (selectedCategory !== "ALL" && log.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.adminEmail.toLowerCase().includes(q) ||
        log.actionLabel.toLowerCase().includes(q) ||
        log.targetName.toLowerCase().includes(q) ||
        log.ipAddress.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Nhật ký Kiểm toán & Hoạt động Hệ thống
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Truy vết toàn bộ thao tác cấu hình, phân quyền, quản lý đề thi và an ninh của Quản trị viên HUBT.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Admin Email, Tên thao tác, Đối tượng..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Tất cả danh mục thao tác</option>
            <option value="SECURITY">An ninh & Bảo mật</option>
            <option value="CLASS">Quản lý Lớp học</option>
            <option value="MAJOR">Quản lý Ngành</option>
            <option value="USER">Tài khoản & Phân quyền</option>
            <option value="QUIZ">Ngân hàng đề thi</option>
            <option value="SETTINGS">Cấu hình tham số</option>
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="24h">24 giờ qua</option>
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => showSuccess("Làm mới", "Đã cập nhật dữ liệu nhật ký mới nhất.")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-3">Thời gian</th>
                <th className="py-3 px-3">Quản trị viên</th>
                <th className="py-3 px-3">Hành động</th>
                <th className="py-3 px-3">Đối tượng tác động</th>
                <th className="py-3 px-3">Địa chỉ IP</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-3 text-slate-500 font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{log.adminName}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{log.adminEmail}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.category === "SECURITY"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : log.category === "USER"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : log.category === "CLASS"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      }`}
                    >
                      {log.actionLabel}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {log.targetName}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">{log.ipAddress}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3" /> Thành công
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(filteredLogs.length / limit) || 1}
            totalItems={filteredLogs.length}
            pageSize={limit}
            onPageChange={setPage}
            onPageSizeChange={setLimit}
            pageSizeOptions={[10, 15, 20]}
          />
        </div>
      </div>

      {/* Modal View Detail */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-indigo-600" />
                Chi tiết thao tác kiểm toán
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div>
                  <span className="text-slate-400">Quản trị viên: </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedLog.adminName} ({selectedLog.adminEmail})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Hành động: </span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {selectedLog.actionLabel} ({selectedLog.action})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Đối tượng: </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedLog.targetName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Thời gian: </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(selectedLog.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* JSON Diff Payload */}
              <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] space-y-1">
                <span className="text-slate-400 block pb-1 border-b border-slate-800">
                  Thao tác Payload / Diff:
                </span>
                <pre className="text-emerald-400 leading-relaxed overflow-x-auto">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogPage;
