import DashboardLayout from "../../layouts/Dashboard";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui";
import { Home } from "lucide-react";

export default function Notfound() {
  const navigate = useNavigate();
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center bg-white dark:bg-[#111827] p-8 sm:p-12 rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
            404
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">
            Không tìm thấy trang
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
            Trang bạn đang truy cập không tồn tại hoặc đã được chuyển dời.
          </p>
          <Button onClick={() => navigate("/")} variant="primary" size="md">
            <Home className="w-4 h-4" />
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
