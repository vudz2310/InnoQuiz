import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui";

export default function HomePage4() {
  return (
    <section className="py-12 md:py-16 bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#EEF2FF] dark:bg-gradient-to-r dark:from-[#1E1B4B] dark:to-[#0F172A] rounded-3xl p-8 sm:p-12 border border-[#C7D2FE]/60 dark:border-indigo-900/60 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs">
          <div className="space-y-4 text-center md:text-left max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-300 bg-white dark:bg-indigo-950/80 px-3 py-1 rounded-full border border-[#C7D2FE] dark:border-indigo-800">
              Bắt đầu miễn phí
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#0F172A] dark:text-white tracking-tight">
              Tạo tài khoản và trải nghiệm Inno Quiz ngay hôm nay
            </h2>
            <p className="text-[#475569] dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Không mất phí khởi tạo. Đăng ký trong 30 giây và tiếp cận ngay kho câu hỏi chất lượng cao.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start text-xs font-semibold text-[#0F172A] dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" /> 100% Miễn phí trải nghiệm
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" /> Không cần thẻ tín dụng
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" /> Hỗ trợ 24/7
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Đăng ký tài khoản
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
