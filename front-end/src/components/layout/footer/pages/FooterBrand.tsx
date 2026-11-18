import { Link } from "react-router-dom";

export function FooterBrand() {
  return (
    <div className="max-w-xs">
      <Link to="/" className="inline-flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5] text-lg font-bold text-white shadow-xs">
          Q
        </div>
        <span className="text-lg font-bold tracking-tight text-[#0F172A] dark:text-white">
          Inno Quiz
        </span>
      </Link>

      <p className="mt-4 text-sm leading-6 text-[#64748B] dark:text-slate-400">
        Nền tảng trắc nghiệm trực tuyến giúp Sinh viên HUBT luyện tập, thi thử và ôn tập kiến thức môn học hiệu quả.
      </p>

      <div className="mt-5 flex items-center gap-2">
        <span className="rounded-lg bg-[#EEF2FF] dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-semibold text-[#4F46E5] dark:text-indigo-300">
          Learn
        </span>
        <span className="rounded-lg bg-[#F5F3FF] dark:bg-purple-950/60 px-2.5 py-1 text-xs font-semibold text-[#7C3AED] dark:text-purple-300">
          Practice
        </span>
        <span className="rounded-lg bg-[#ECFDF5] dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-[#047857] dark:text-emerald-300">
          Master
        </span>
      </div>
    </div>
  );
}
