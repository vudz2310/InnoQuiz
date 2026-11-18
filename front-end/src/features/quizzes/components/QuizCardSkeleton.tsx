import React from "react";

export const QuizCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-5 shadow-xs animate-pulse flex flex-col justify-between h-[230px]">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
        <div className="space-y-1.5 mb-4">
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800/60 rounded" />
          <div className="w-4/5 h-3.5 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
      </div>

      <div>
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="w-full h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
};
