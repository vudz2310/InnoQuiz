import { User as UserIcon, History, BarChart3, ShieldCheck } from "lucide-react";

export type ProfileTabType = "info" | "history" | "stats" | "security";

interface ProfileTabsNavProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
}

export default function ProfileTabsNav({
  activeTab,
  onTabChange,
}: ProfileTabsNavProps) {
  const tabs = [
    {
      id: "info" as ProfileTabType,
      label: "Thông tin cá nhân",
      icon: UserIcon,
    },
    {
      id: "history" as ProfileTabType,
      label: "Lịch sử thi thử",
      icon: History,
    },
    {
      id: "stats" as ProfileTabType,
      label: "Tiến độ học tập",
      icon: BarChart3,
    },
    {
      id: "security" as ProfileTabType,
      label: "Bảo mật & Thiết bị",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F19]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              isActive
                ? "border-[#4F46E5] text-[#4F46E5] dark:text-indigo-400 bg-white dark:bg-[#111827]"
                : "border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
