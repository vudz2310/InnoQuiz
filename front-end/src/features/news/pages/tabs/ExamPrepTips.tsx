import { Badge, Card } from "../../../../components/ui";
import { Clock, ArrowRight } from "lucide-react";

const ExamPrepTips = () => {
  const tips = [
    {
      id: 1,
      title: "Phương pháp phân bổ thời gian làm bài trắc nghiệm hiệu quả",
      category: "Kinh nghiệm ôn thi",
      date: "14/08/2026",
      summary:
        "Cách chia thời gian làm bài 50 phút với 40 câu hỏi trắc nghiệm để đạt điểm số tối đa mà không bị vội vã.",
      readTime: "5 phút đọc",
    },
    {
      id: 2,
      title: "Bí quyết rèn luyện kỹ năng loại trừ đáp án nhiễu",
      category: "Kinh nghiệm ôn thi",
      date: "12/08/2026",
      summary:
        "Phân tích các phương án bẫy trong đề thi trắc nghiệm và phương pháp suy luận logic để chọn đáp án đúng.",
      readTime: "7 phút đọc",
    },
    {
      id: 3,
      title: "Chiến thuật ôn tập giai đoạn nước rút 30 ngày trước kỳ thi",
      category: "Kinh nghiệm ôn thi",
      date: "10/08/2026",
      summary:
        "Tổng hợp kiến thức trọng tâm, giải đề thi thử và chuẩn bị tâm lý vững vàng trước ngày thi.",
      readTime: "6 phút đọc",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-slate-800 shadow-xs transition-colors">
        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">
          Kinh nghiệm ôn thi & Bí quyết đạt điểm cao
        </h2>
        <p className="text-[#475569] dark:text-slate-400 text-sm mb-6">
          Tổng hợp bài viết chia sẻ phương pháp học tập thông minh và chiến thuật làm bài thi trắc nghiệm.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tips.map((item) => (
            <Card key={item.id} clickable className="flex flex-col justify-between hover:border-[#C7D2FE] dark:hover:border-indigo-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400">
                  <Badge variant="primary">{item.category}</Badge>
                  <span>{item.date}</span>
                </div>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white line-clamp-2 hover:text-[#4F46E5] dark:hover:text-indigo-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-[#475569] dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#4F46E5] dark:text-indigo-400">
                <span className="flex items-center gap-1 text-[#64748B] dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> {item.readTime}
                </span>
                <span className="flex items-center gap-1 hover:underline cursor-pointer">
                  Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamPrepTips;
