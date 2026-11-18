import { Card } from "../../../../components/ui";

const ApplicationGuide = () => {
  const steps = [
    { step: "01", title: "Tạo tài khoản thí sinh", desc: "Đăng ký thông tin cá nhân và xác thực tài khoản qua email/SĐT trên Inno Quiz." },
    { step: "02", title: "Hoàn thiện hồ sơ trực tuyến", desc: "Cập nhật ảnh đại diện, thông tin lớp học/trường và các môn học quan tâm." },
    { step: "03", title: "Lựa chọn kỳ thi & Tham gia", desc: "Chọn ca thi phù hợp, đăng ký đề thi thử và theo dõi kết quả tự động." },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-slate-800 shadow-xs transition-colors">
        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">
          Hướng dẫn nộp hồ sơ đăng ký dự thi
        </h2>
        <p className="text-[#475569] dark:text-slate-400 text-sm mb-6">
          Các bước quy chuẩn để hoàn thiện hồ sơ đăng ký thi trắc nghiệm trực tuyến nhanh chóng.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((item) => (
            <Card key={item.step} className="relative space-y-3 border-[#E2E8F0] dark:border-slate-800">
              <div className="text-3xl font-extrabold text-[#4F46E5] dark:text-indigo-400 bg-[#EEF2FF] dark:bg-indigo-950/70 border border-indigo-200/50 dark:border-indigo-800/40 w-12 h-12 rounded-xl flex items-center justify-center mb-2">
                {item.step}
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{item.title}</h3>
              <p className="text-xs text-[#475569] dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApplicationGuide;
