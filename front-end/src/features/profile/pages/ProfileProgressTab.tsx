import { useState, useEffect } from "react";

import { attemptApi } from "../../../services/api/Attempt.api";
import type { LearningProgress } from "../../../types/attempt.types";
import { BarChart3, Loader2 } from "lucide-react";

export default function ProfileProgressTab() {
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attemptApi
      .getLearningProgress()
      .then((data) => setProgress(data))
      .catch((err) => console.error("Profile progress error:", err))
      .finally(() => setLoading(false));
  }, []);

  const defaultSubjects = [
    { name: "Triết học Mác - Lênin", percentage: 90, color: "bg-[#4F46E5]", text: "text-[#4F46E5]" },
    { name: "Kinh tế chính trị Mác - Lênin", percentage: 85, color: "bg-[#7C3AED]", text: "text-[#7C3AED]" },
    { name: "Tiếng Anh Chuyên ngành (B1/B2)", percentage: 75, color: "bg-[#0891B2]", text: "text-[#0891B2]" },
    { name: "Tin học Văn phòng Đại cương", percentage: 95, color: "bg-[#10B981]", text: "text-[#10B981]" },
  ];

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#4F46E5] animate-spin" />
      </div>
    );
  }

  const categoryList =
    progress?.categoryProgress && progress.categoryProgress.length > 0
      ? progress.categoryProgress.map((cat, idx) => {
          const colors = ["bg-[#4F46E5]", "bg-[#7C3AED]", "bg-[#0891B2]", "bg-[#10B981]"];
          const textColors = ["text-[#4F46E5]", "text-[#7C3AED]", "text-[#0891B2]", "text-[#10B981]"];
          return {
            name: cat.categoryName,
            percentage: cat.accuracyRate,
            color: colors[idx % colors.length],
            text: textColors[idx % textColors.length],
          };
        })
      : defaultSubjects;

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#4F46E5]" />
            Phân tích môn học & Tiến độ
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Tỷ lệ hoàn thiện các bộ đề trắc nghiệm HUBT
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {categoryList.map((subject, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-[#0F172A] dark:text-slate-200">
              <span>{subject.name}</span>
              <span className={subject.text}>
                {subject.percentage}% Hoàn thành
              </span>
            </div>
            <div className="w-full bg-[#E2E8F0] dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`${subject.color} h-full rounded-full transition-all duration-500`}
                style={{ width: `${subject.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
