import { Badge, Card } from "../../../../components/ui";

const ExamStructure = () => {
  const subjects = [
    { title: "Toán học trắc nghiệm", questions: 50, duration: "90 phút", level: "Cơ bản - Nâng cao" },
    { title: "Tiếng Anh chuẩn hóa", questions: 40, duration: "60 phút", level: "Đánh giá năng lực" },
    { title: "Khoa học tổng hợp", questions: 40, duration: "50 phút", level: "Trắc nghiệm nhanh" },
    { title: "Vật lý đại cương", questions: 40, duration: "50 phút", level: "Tự luyện tập" },
    { title: "Hóa học cơ bản", questions: 40, duration: "50 phút", level: "Trắc nghiệm lý thuyết" },
    { title: "Tin học ứng dụng", questions: 30, duration: "45 phút", level: "Kỹ năng thực hành" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-slate-800 shadow-xs transition-colors">
        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">
          Cấu trúc đề thi chi tiết
        </h2>
        <p className="text-[#475569] dark:text-slate-400 text-sm mb-6">
          Chi tiết số lượng câu hỏi, thời gian làm bài và phân bổ mức độ nhận biết của từng môn thi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects.map((sub, idx) => (
            <Card key={idx} className="space-y-3 border-[#E2E8F0] dark:border-slate-800">
              <Badge variant="primary">Môn thi {idx + 1}</Badge>
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{sub.title}</h3>
              <div className="space-y-2 text-xs text-[#334155] dark:text-slate-300 pt-1">
                <div className="flex justify-between py-1 border-b border-[#F1F5F9] dark:border-slate-800">
                  <span className="text-[#64748B] dark:text-slate-400">Số câu hỏi:</span>
                  <span className="font-bold text-[#0F172A] dark:text-white">{sub.questions} câu</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F1F5F9] dark:border-slate-800">
                  <span className="text-[#64748B] dark:text-slate-400">Thời gian:</span>
                  <span className="font-bold text-[#0F172A] dark:text-white">{sub.duration}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B] dark:text-slate-400">Định dạng:</span>
                  <span className="font-bold text-[#4F46E5] dark:text-indigo-400">{sub.level}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamStructure;
