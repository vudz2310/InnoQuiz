import { Link } from "react-router-dom";
import { Button, Badge } from "../../../../components/ui";
import { CheckCircle2, ArrowRight } from "lucide-react";

const AllNews = () => {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-2">
      {/* Left Column: Feature Banner Card Frame */}
      <div className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="relative rounded-xl overflow-hidden bg-[#EEF2FF] dark:bg-slate-800">
          <img
            className="rounded-xl w-full h-64 sm:h-80 object-cover"
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80"
            alt="Inno Quiz Test Preparation"
          />
          <div className="absolute top-4 left-4">
            <Badge variant="primary">Nền tảng thi thử Inno Quiz</Badge>
          </div>
        </div>
      </div>

      {/* Right Column: Features List & Call to Action */}
      <div className="lg:col-span-5 flex flex-col justify-center space-y-5 lg:pl-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white leading-tight">
          Tạo nhanh đề thi trắc nghiệm chuẩn hóa
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white dark:bg-[#111827] p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400 shrink-0" />
            <span className="text-[#0F172A] dark:text-slate-100 font-semibold text-sm">
              Dễ dàng tạo đề thi từ ngân hàng câu hỏi.
            </span>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-[#111827] p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400 shrink-0" />
            <span className="text-[#0F172A] dark:text-slate-100 font-semibold text-sm">
              Giao diện trực quan, thao tác nhanh chóng.
            </span>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-[#111827] p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400 shrink-0" />
            <span className="text-[#0F172A] dark:text-slate-100 font-semibold text-sm">
              Hỗ trợ nhiều định dạng câu hỏi trắc nghiệm.
            </span>
          </div>
        </div>

        <div className="pt-2">
          <Link to="/register">
            <Button variant="primary" size="lg">
              Đăng ký ngay
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AllNews;
