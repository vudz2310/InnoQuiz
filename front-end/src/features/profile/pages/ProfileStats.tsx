import { useState, useEffect } from "react";

import { BookOpen, Award, CheckCircle2, Clock } from "lucide-react";
import { attemptApi } from "../../../services/api/Attempt.api";
import type { LearningProgress } from "../../../types/attempt.types";

interface ProfileStatsProps {
  progressData?: LearningProgress | null;
}

export default function ProfileStats({ progressData }: ProfileStatsProps) {
  const [progress, setProgress] = useState<LearningProgress | null>(progressData || null);
  const [loading, setLoading] = useState(!progressData);

  useEffect(() => {
    if (progressData) {
      setProgress(progressData);
      setLoading(false);
      return;
    }

    attemptApi
      .getLearningProgress()
      .then((data) => {
        if (data) setProgress(data);
      })
      .catch((err) => {
        console.error("Fetch profile stats error:", err);
      })
      .finally(() => setLoading(false));
  }, [progressData]);

  const totalSessions = progress?.totalSessions !== undefined ? progress.totalSessions : 18;
  const avgScore =
    progress?.avgScore !== undefined
      ? (progress.avgScore / 10).toFixed(2).replace(/\.00$/, "")
      : "8.75";
  const accuracyRate =
    progress?.accuracyRate !== undefined ? `${progress.accuracyRate}%` : "88%";

  const formatStudyTime = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "14 giờ";
    if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} phút`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (mins > 0) return `${hours}h ${mins}p`;
    return `${hours} giờ`;
  };

  const studyTime = formatStudyTime(progress?.totalStudyTimeSeconds);

  const stats = [
    {
      label: "Đề thi đã hoàn thành",
      value: loading ? "--" : totalSessions,
      icon: BookOpen,
      bgColor: "bg-[#EEF2FF] dark:bg-indigo-950/60",
      textColor: "text-[#4F46E5] dark:text-indigo-400",
    },
    {
      label: "Điểm trung bình",
      value: loading ? "--" : avgScore,
      icon: Award,
      bgColor: "bg-[#F3E8FF] dark:bg-purple-950/60",
      textColor: "text-[#7C3AED] dark:text-purple-400",
    },
    {
      label: "Tỷ lệ trả lời đúng",
      value: loading ? "--" : accuracyRate,
      icon: CheckCircle2,
      bgColor: "bg-[#ECFDF5] dark:bg-emerald-950/60",
      textColor: "text-[#10B981] dark:text-emerald-400",
    },
    {
      label: "Thời gian ôn thi",
      value: loading ? "--" : studyTime,
      icon: Clock,
      bgColor: "bg-[#CFFAFE] dark:bg-cyan-950/60",
      textColor: "text-[#0891B2] dark:text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md dark:hover:border-slate-700 transition-all"
          >
            <div className={`p-3.5 rounded-2xl ${stat.bgColor} ${stat.textColor} shrink-0 flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-[#0F172A] dark:text-white leading-tight">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-[#64748B] dark:text-slate-400 mt-1 leading-snug">
                {stat.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
