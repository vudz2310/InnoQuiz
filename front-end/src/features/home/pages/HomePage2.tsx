import { BookOpen, CheckCircle, Award, BarChart3, Clock, ShieldCheck } from "lucide-react";
import { Card } from "../../../components/ui";

const features = [
  {
    icon: BookOpen,
    title: "Kho câu hỏi phong phú",
    desc: "Hàng nghìn câu hỏi trắc nghiệm phân loại theo chủ đề, môn học và mức độ từ dễ đến nâng cao.",
    color: "text-[#4F46E5]",
    bg: "bg-[#EEF2FF]",
  },
  {
    icon: Clock,
    title: "Thi thử bấm giờ real-time",
    desc: "Trải nghiệm áp lực phòng thi thật với bộ đếm thời gian tự động và tự nộp bài khi hết giờ.",
    color: "text-[#7C3AED]",
    bg: "bg-[#F5F3FF]",
  },
  {
    icon: BarChart3,
    title: "Thống kê kết quả tức thì",
    desc: "Nhận điểm số ngay lập tức kèm giải thích đáp án chi tiết và biểu đồ phân tích kỹ năng.",
    color: "text-[#06B6D4]",
    bg: "bg-[#ECFDF5]",
  },
  {
    icon: Award,
    title: "Luyện tập theo chuyên đề",
    desc: "Chủ động ôn luyện những chủ đề còn yếu để chuẩn bị tốt nhất cho các kỳ thi sắp tới.",
    color: "text-[#10B981]",
    bg: "bg-[#ECFDF5]",
  },
  {
    icon: CheckCircle,
    title: "Giao diện tối ưu trải nghiệm",
    desc: "Thiết kế hiện đại, tinh gọn, mượt mà trên cả máy tính, máy tính bảng và điện thoại di động.",
    color: "text-[#4F46E5]",
    bg: "bg-[#EEF2FF]",
  },
  {
    icon: ShieldCheck,
    title: "Bảo mật & Chuẩn hóa",
    desc: "Dữ liệu bài thi được bảo mật, mã hóa an toàn và tuân thủ đúng chuẩn cấu trúc đề thi.",
    color: "text-[#7C3AED]",
    bg: "bg-[#F5F3FF]",
  },
];

export default function HomePage2() {
  return (
    <section className="py-12 md:py-16 bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400 bg-[#EEF2FF] dark:bg-indigo-950/70 px-3 py-1 rounded-full border border-indigo-200/50 dark:border-indigo-800/40">
            Tính năng nổi bật
          </span>
          <h2 className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight mt-3">
            Vì sao nên chọn Inno Quiz?
          </h2>
          <p className="text-[#475569] dark:text-slate-400 text-sm sm:text-base mt-2">
            Được thiết kế nhằm tối ưu hiệu quả học tập và tạo cảm hứng ôn luyện cho mọi học viên.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} clickable className="flex flex-col justify-between">
                <div>
                  <div className={`w-11 h-11 rounded-xl ${item.bg} dark:bg-slate-800 ${item.color} dark:text-indigo-400 flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-[#475569] dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
