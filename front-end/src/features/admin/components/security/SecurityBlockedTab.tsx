import React, { useState } from "react";
import {
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
  Globe,
  Trash2,
} from "lucide-react";
import type { BlockedIdentifierItem } from "../../../../services/api/Security.api";
import { Button, Pagination } from "../../../../components/ui";

interface SecurityBlockedTabProps {
  blockedItems: BlockedIdentifierItem[];
  total: number;
  page: number;
  limit: number;
  search: string;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
  onAddBlock: (payload: {
    type: "IP" | "USER" | "STUDENT_CODE";
    value: string;
    reason: string;
    riskScore?: number;
    blockedUntil?: string | null;
    notes?: string;
  }) => Promise<void>;
  onUnblock: (id: string, reason?: string) => Promise<void>;
}

export const SecurityBlockedTab: React.FC<SecurityBlockedTabProps> = ({
  blockedItems,
  total,
  page,
  limit,
  search,
  loading,
  onPageChange,
  onLimitChange,
  onSearchChange,
  onRefresh,
  onAddBlock,
  onUnblock,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newType, setNewType] = useState<"IP" | "USER" | "STUDENT_CODE">("IP");
  const [newValue, setNewValue] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newDuration, setNewDuration] = useState("24h");
  const [adding, setAdding] = useState(false);

  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || !newReason.trim()) return;

    let blockedUntil: string | null = null;
    if (newDuration !== "PERMANENT") {
      const now = new Date();
      if (newDuration === "1h") now.setHours(now.getHours() + 1);
      else if (newDuration === "24h") now.setHours(now.getHours() + 24);
      else if (newDuration === "7d") now.setDate(now.getDate() + 7);
      else if (newDuration === "30d") now.setDate(now.getDate() + 30);
      blockedUntil = now.toISOString();
    }

    try {
      setAdding(true);
      await onAddBlock({
        type: newType,
        value: newValue.trim(),
        reason: newReason.trim(),
        riskScore: 90,
        blockedUntil,
      });
      setIsAddModalOpen(false);
      setNewValue("");
      setNewReason("");
    } finally {
      setAdding(false);
    }
  };

  const handleUnblockClick = async (id: string) => {
    try {
      setUnblockingId(id);
      await onUnblock(id, "Admin mở khóa thủ công từ trang quản trị bảo mật");
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo IP, User ID, Mã sinh viên..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Thêm chặn mới</span>
          </Button>
        </div>
      </div>

      {/* Blocked Items Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xs">
        {loading && blockedItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <span>Đang tải danh sách chặn...</span>
          </div>
        ) : blockedItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
            <span>Danh sách đen trống. Hiện không có IP hay tài khoản nào bị chặn.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Loại chặn</th>
                  <th className="py-3 px-3">Giá trị / Định danh</th>
                  <th className="py-3 px-3">Lý do vi phạm</th>
                  <th className="py-3 px-3">Thời hạn chặn</th>
                  <th className="py-3 px-3">Người chặn</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {blockedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {item.value}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {item.reason}
                    </td>
                    <td className="py-3 px-3">
                      {item.blockedUntil ? (
                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Hết hạn: {new Date(item.blockedUntil).toLocaleString("vi-VN")}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Vĩnh viễn
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{item.blockedBy || "Hệ thống"}</td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUnblockClick(item.id)}
                        disabled={unblockingId === item.id}
                      >
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{unblockingId === item.id ? "Đang mở..." : "Mở khóa"}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit) || 1}
              totalItems={total}
              pageSize={limit}
              onPageChange={onPageChange}
              onPageSizeChange={onLimitChange}
              pageSizeOptions={[10, 15, 20]}
            />
          </div>
        )}
      </div>

      {/* Add Block Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600" />
                Thêm thực thể vào Danh sách chặn
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Loại thực thể chặn:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: "IP", label: "Địa chỉ IP" },
                    { type: "USER", label: "User ID" },
                    { type: "STUDENT_CODE", label: "Mã Sinh viên" },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setNewType(item.type as "IP" | "USER" | "STUDENT_CODE")}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        newType === item.type
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-500 dark:text-indigo-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {newType === "IP"
                    ? "Địa chỉ IP cần chặn (Ví dụ: 192.168.1.100)"
                    : newType === "STUDENT_CODE"
                    ? "Mã sinh viên HUBT (Ví dụ: 24D190001)"
                    : "ID Tài khoản (UUID)"}
                  :
                </label>
                <input
                  type="text"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Nhập giá trị cần chặn..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Thời hạn chặn:
                </label>
                <select
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="1h">1 giờ</option>
                  <option value="24h">24 giờ (1 ngày)</option>
                  <option value="7d">7 ngày</option>
                  <option value="30d">30 ngày</option>
                  <option value="PERMANENT">Khóa vĩnh viễn</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Lý do chặn:
                </label>
                <textarea
                  rows={3}
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Ví dụ: Đăng nhập sai quá nhiều lần, hành vi scraping dữ liệu trái phép..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={adding}
              >
                Hủy bỏ
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={adding}>
                {adding ? "Đang áp dụng..." : "Áp dụng chặn"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
