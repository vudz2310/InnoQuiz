import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, Clock } from "lucide-react";
import DashboardLayout from "../../layouts/Dashboard";

interface PlaceholderFeaturePageProps {
  title: string;
  badge: string;
  description: string;
  expectedFeatureList: string[];
  /** Bọc bởi DashboardLayout cho các trang độc lập (mặc định false khi nằm trong Admin/Teacher layout) */
  withLayout?: boolean;
}

export const PlaceholderFeaturePage: React.FC<PlaceholderFeaturePageProps> = ({
  title,
  badge,
  description,
  expectedFeatureList,
  withLayout = false,
}) => {
  const content = (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs transition-colors text-center relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-bold text-[#4F46E5] dark:text-indigo-400 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{badge}</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            {description}
          </p>

          {/* Planned Features List */}
          <div className="bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 max-w-lg mx-auto text-left mb-8">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Dự kiến ra mắt trong đợt cập nhật tiếp theo:</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {expectedFeatureList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Button */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/quiz"
              className="px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Khám phá kho đề thi có sẵn</span>
            </Link>
        </div>
      </div>
    </div>
  );

  if (withLayout) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
};

export default PlaceholderFeaturePage;
