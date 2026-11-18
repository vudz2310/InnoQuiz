import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/Dashboard";

const tabs = [
  {
    name: "All",
    value: "Tất cả tin tức",
    path: "/news",
  },
  {
    name: "examPrepTips",
    value: "Kinh nghiệm ôn thi",
    path: "/news/examPrepTips",
  },
  {
    name: "admissionsInformation",
    value: "Thông tin tuyển sinh",
    path: "/news/admissionsInformation",
  },
  {
    name: "examStructure",
    value: "Cấu trúc đề thi",
    path: "/news/examStructure",
  },
  {
    name: "applicationGuide",
    value: "Hướng dẫn nộp hồ sơ",
    path: "/news/applicationGuide",
  },
];

const NewsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isTabActive = (tabPath: string) => {
    if (tabPath === "/news") {
      return location.pathname === "/news" || location.pathname === "/news/";
    }
    return location.pathname.startsWith(tabPath);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-y-6 px-4">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400 bg-[#EEF2FF] dark:bg-indigo-950/70 px-3 py-1 rounded-full border border-[#C7D2FE] dark:border-indigo-800/40">
            Cập nhật mới nhất
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] dark:text-white tracking-tight">
            Tin tức & Hướng dẫn ôn thi
          </h1>
          <p className="text-[#475569] dark:text-slate-400 text-sm sm:text-base font-medium max-w-xl">
            Cập nhật tin tức tuyển sinh, phương pháp làm bài trắc nghiệm và thông tin quan trọng.
          </p>
        </div>

        {/* Dynamic URL Tab Navigation */}
        <div className="flex flex-wrap gap-2.5 mt-2 justify-center items-center">
          {tabs.map((tab) => {
            const isActive = isTabActive(tab.path);
            return (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className={`
                  px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? "bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300 border border-[#4F46E5] dark:border-indigo-500 font-bold shadow-xs"
                      : "bg-white dark:bg-[#111827] text-[#475569] dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-800 hover:text-[#4F46E5] dark:hover:text-indigo-400 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
                  }
                `}
              >
                {tab.value}
              </button>
            );
          })}
        </div>

        {/* Sub-route Content */}
        <div className="w-full mt-4">
          <Outlet />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewsPage;
