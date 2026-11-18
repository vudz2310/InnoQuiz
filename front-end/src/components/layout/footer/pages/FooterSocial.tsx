export function FooterSocial() {
  return (
    <div>
      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
        Theo dõi Inno Quiz
      </h3>

      <p className="mt-4 text-sm leading-6 text-[#64748B] dark:text-slate-400">
        Theo dõi kênh chính thức để cập nhật đề thi và tài liệu mới nhất.
      </p>

      <div className="mt-4 flex gap-2">
        <a
          href="#"
          aria-label="Facebook"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-sm font-bold text-[#475569] dark:text-slate-300 transition-all hover:bg-[#EEF2FF] dark:hover:bg-slate-700 hover:border-[#C7D2FE] hover:text-[#4F46E5] dark:hover:text-indigo-400"
        >
          f
        </a>
        <a
          href="#"
          aria-label="Instagram"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-sm font-bold text-[#475569] dark:text-slate-300 transition-all hover:bg-[#EEF2FF] dark:hover:bg-slate-700 hover:border-[#C7D2FE] hover:text-[#4F46E5] dark:hover:text-indigo-400"
        >
          ig
        </a>
        <a
          href="#"
          aria-label="GitHub"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-sm font-bold text-[#475569] dark:text-slate-300 transition-all hover:bg-[#EEF2FF] dark:hover:bg-slate-700 hover:border-[#C7D2FE] hover:text-[#4F46E5] dark:hover:text-indigo-400"
        >
          gh
        </a>
      </div>
    </div>
  );
}
