export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex flex-wrap gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-2 ${className}`}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2
              ${
                isActive
                  ? "bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300 border border-[#4F46E5] dark:border-indigo-500 font-bold shadow-2xs"
                  : "bg-white dark:bg-[#111827] text-[#475569] dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-800 hover:text-[#4F46E5] dark:hover:text-indigo-400 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
              }
            `}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${isActive ? "bg-[#4F46E5] text-white" : "bg-[#F1F5F9] dark:bg-slate-800 text-[#64748B] dark:text-slate-400"}
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
