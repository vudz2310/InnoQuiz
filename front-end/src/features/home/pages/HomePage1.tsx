import { Search, Sparkles, Check, X, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Badge } from "../../../components/ui";

const avatars = [
  "https://i.pravatar.cc/100?img=12",
  "https://i.pravatar.cc/100?img=32",
  "https://i.pravatar.cc/100?img=47",
  "https://i.pravatar.cc/100?img=14",
  "https://i.pravatar.cc/100?img=5",
];

function QuizDemoCard() {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden text-left transition-colors">
      {/* Browser Window Header */}
      <div className="bg-[#F8FAFC] dark:bg-[#0B0F19] px-4 py-3 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#EF4444]/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#10B981]/80 inline-block" />
        </div>
        <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Inno Quiz - Giao diện Luyện thi Trắc nghiệm</div>
        <Badge variant="primary">Demo App</Badge>
      </div>

      {/* Main Interactive Demo Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Step Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#EEF2FF] dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-300 rounded-lg font-bold text-xs border border-indigo-200/50 dark:border-indigo-800/40">
              Câu 1 / 20
            </span>
            <span className="text-xs text-[#64748B] dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 14:25 còn lại
            </span>
          </div>
          <Badge variant="success">Đang làm bài</Badge>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-[#0B0F19] rounded-xl border border-[#E2E8F0] dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="px-2.5 py-1 bg-[#EEF2FF] dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-300 font-bold text-xs rounded-lg shrink-0 border border-indigo-200/50 dark:border-indigo-800/40">
              Q1
            </span>
            <h4 className="text-sm sm:text-base font-semibold text-[#0F172A] dark:text-white">
              Một trong những đối tượng nghiên cứu trọng tâm của Kinh tế chính trị Mác - Lênin là:
            </h4>
          </div>

          {/* Options with state representation */}
          <div className="space-y-2.5 pt-1">
            {/* Wrong option demo */}
            <div className="p-3 rounded-xl border border-[#EF4444] dark:border-red-800 bg-[#FEF2F2] dark:bg-red-950/40 text-[#DC2626] dark:text-red-300 text-xs sm:text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#EF4444] text-white flex items-center justify-center text-[10px] font-bold shrink-0">A</span>
                <span>Lịch sử các học thuyết văn học cổ đại</span>
              </div>
              <X className="w-4 h-4 text-[#EF4444]" />
            </div>

            {/* Selected option demo */}
            <div className="p-3 rounded-xl border border-[#4F46E5] dark:border-indigo-500 bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#3730A3] dark:text-indigo-200 text-xs sm:text-sm font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-[10px] font-bold shrink-0">B</span>
                <span>Quan hệ sản xuất trong sự tác động qua lại với lực lượng sản xuất</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
            </div>

            {/* Correct option demo */}
            <div className="p-3 rounded-xl border border-[#10B981] dark:border-emerald-700 bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#047857] dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[10px] font-bold shrink-0">C</span>
                <span>Các quy luật tự nhiên trong vật lý đại cương</span>
              </div>
              <Check className="w-4 h-4 text-[#10B981]" />
            </div>

            {/* Default hover option demo */}
            <div className="p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/80 hover:border-[#C7D2FE] dark:hover:border-slate-700 text-[#0F172A] dark:text-slate-200 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#64748B] dark:text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0">D</span>
                <span>Phương pháp lập trình phần mềm nâng cao</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage1() {
  return (
    <section className="py-8 md:py-14 bg-[#F8FAFC] dark:bg-[#090D1A] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* LEFT: Hero Info */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2FF] dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-300 text-xs font-semibold border border-[#C7D2FE] dark:border-indigo-800/50">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hệ thống Ôn thi Trắc nghiệm Sinh viên HUBT</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] dark:text-white tracking-tight leading-tight">
              Giải pháp luyện thi & <br />
              <span className="text-[#4F46E5] dark:text-indigo-400">ôn tập hiệu quả cho Sinh viên HUBT</span>
            </h1>

            <p className="text-[#475569] dark:text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl">
              Inno Quiz đồng hành cùng sinh viên Trường Đại học Kinh doanh và Công nghệ Hà Nội (HUBT) trong các kỳ thi trắc nghiệm môn học, đánh giá năng lực và chuẩn đầu ra.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link to="/register">
                <Button variant="primary" size="lg">
                  <BookOpen className="w-5 h-5" />
                  Bắt đầu ngay
                </Button>
              </Link>

              <Link to="/news">
                <Button variant="outline" size="lg">
                  <Search className="w-5 h-5 text-[#475569] dark:text-slate-400" />
                  Khám phá tin tức
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="pt-4 flex items-center gap-4 border-t border-[#E2E8F0] dark:border-slate-800">
              <div className="flex -space-x-2 overflow-hidden">
                {avatars.map((avatar, idx) => (
                  <img
                    key={idx}
                    src={avatar}
                    alt="User Avatar"
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#111827]"
                  />
                ))}
              </div>
              <div className="text-xs text-[#475569] dark:text-slate-400">
                Đã có hơn <strong className="text-[#0F172A] dark:text-white font-bold">200.000+</strong> học viên tin tưởng sử dụng
              </div>
            </div>
          </div>

          {/* RIGHT: Visual Interactive Demo */}
          <div className="lg:col-span-6">
            <QuizDemoCard />
          </div>
        </div>
      </div>
    </section>
  );
}
