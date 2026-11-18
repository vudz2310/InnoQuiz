import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Clock, FileCheck2, ClipboardList, Sparkles, ArrowRight } from "lucide-react";

const HOME_MODES = [
  {
    id: "PRACTICE",
    title: "ÔN THI",
    subtitle: "Học & củng cố kiến thức",
    desc: "Xem ngay giải thích chi tiết sau mỗi câu, không giới hạn thời gian.",
    icon: BookOpen,
    badge: "Linh hoạt",
    color: "text-blue-600 dark:text-blue-400",
    bgIcon: "bg-blue-50 dark:bg-blue-950/60",
    borderHover: "hover:border-blue-400",
    link: "/explore?mode=PRACTICE",
  },
  {
    id: "MOCK_EXAM",
    title: "THI THỬ",
    subtitle: "Mô phỏng kỳ thi thực tế",
    desc: "Đồng hồ bấm giờ chuẩn mực, xáo trộn đề và nộp bài tính điểm.",
    icon: Clock,
    badge: "Chuẩn HUBT",
    color: "text-indigo-600 dark:text-indigo-400",
    bgIcon: "bg-indigo-50 dark:bg-indigo-950/60",
    borderHover: "hover:border-indigo-400",
    link: "/explore?mode=MOCK_EXAM",
  },
  {
    id: "TEST",
    title: "KIỂM TRA",
    subtitle: "Đánh giá kiến thức",
    desc: "Kiểm tra giữa kỳ & kết thúc học phần theo khung giờ mở đề.",
    icon: FileCheck2,
    badge: "Đánh giá",
    color: "text-emerald-600 dark:text-emerald-400",
    bgIcon: "bg-emerald-50 dark:bg-emerald-950/60",
    borderHover: "hover:border-emerald-400",
    link: "/explore?mode=TEST",
  },
  {
    id: "ASSIGNMENT",
    title: "BÀI TẬP",
    subtitle: "Bài được giao",
    desc: "Bài tập tự luyện môn học có thời hạn nộp và theo dõi số lần làm.",
    icon: ClipboardList,
    badge: "Tiến độ",
    color: "text-amber-600 dark:text-amber-400",
    bgIcon: "bg-amber-50 dark:bg-amber-950/60",
    borderHover: "hover:border-amber-400",
    link: "/explore?mode=ASSIGNMENT",
  },
  {
    id: "FLASHCARD",
    title: "FLASHCARD",
    subtitle: "Ghi nhớ kiến thức",
    desc: "Lật thẻ 2 mặt ghi nhớ nhanh thuật ngữ, công thức và khái niệm.",
    icon: Sparkles,
    badge: "Ghi nhớ",
    color: "text-purple-600 dark:text-purple-400",
    bgIcon: "bg-purple-50 dark:bg-purple-950/60",
    borderHover: "hover:border-purple-400",
    link: "/explore?mode=FLASHCARD",
  },
];

export const LearningModesHomeSection: React.FC = () => {
  return (
    <section className="py-12 md:py-16 bg-white dark:bg-[#0B0F19] border-y border-slate-100 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-3 py-1 rounded-full border border-indigo-200/50 dark:border-indigo-800/40">
            Phương pháp học tập đa chế độ
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
            Bạn muốn học gì hôm nay?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2">
            Inno Quiz tối ưu hóa cùng một bộ câu hỏi cho 5 mục đích học tập khác nhau của sinh viên HUBT.
          </p>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {HOME_MODES.map((mode) => {
            const Icon = mode.icon;

            return (
              <Link
                key={mode.id}
                to={mode.link}
                className={`group bg-[#F8FAFC] dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-indigo-950/20 ${mode.borderHover}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${mode.bgIcon} ${mode.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                      {mode.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                    {mode.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {mode.subtitle}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-2.5 line-clamp-2">
                    {mode.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#4F46E5] dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Khám phá</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LearningModesHomeSection;
