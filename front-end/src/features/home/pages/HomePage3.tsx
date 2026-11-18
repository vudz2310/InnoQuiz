import { Link } from "react-router-dom";
import { Clock, FileText, ArrowRight, User } from "lucide-react";
import { Card, Badge, Button } from "../../../components/ui";

const sampleQuizzes = [
  {
    id: 1,
    title: "Trắc nghiệm Triết học Mác - Lênin (HUBT)",
    questions: 50,
    time: "45 phút",
    category: "Lý luận chính trị",
    level: "Nâng cao",
    participants: 1420,
  },
  {
    id: 2,
    title: "Đề thi Kinh tế chính trị Mác - Lênin HUBT",
    questions: 40,
    time: "40 phút",
    category: "Khoa Kinh tế",
    level: "Trung bình",
    participants: 980,
  },
  {
    id: 3,
    title: "Ôn tập Tiếng Anh chuyên ngành HUBT",
    questions: 40,
    time: "50 phút",
    category: "Ngoại ngữ HUBT",
    level: "Cơ bản",
    participants: 760,
  },
];

export default function HomePage3() {
  return (
    <section className="py-12 md:py-16 bg-white dark:bg-[#090D1A] border-y border-[#E2E8F0] dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400 bg-[#EEF2FF] dark:bg-indigo-950/70 px-3 py-1 rounded-full border border-indigo-200/50 dark:border-indigo-800/40">
              Bộ đề phổ biến
            </span>
            <h2 className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight mt-3">
              Đề thi nổi bật tuần này
            </h2>
            <p className="text-[#475569] dark:text-slate-400 text-sm mt-1">
              Thử sức ngay với những đề thi trắc nghiệm được chọn lọc nhiều nhất.
            </p>
          </div>

          <Link to="/register">
            <Button variant="outline" size="md">
              Khám phá ngay
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleQuizzes.map((quiz) => (
            <Card key={quiz.id} clickable className="flex flex-col justify-between hover:border-[#C7D2FE] dark:hover:border-indigo-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="primary">{quiz.category}</Badge>
                  <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 bg-[#F1F5F9] dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    {quiz.level}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white leading-snug line-clamp-2">
                  {quiz.title}
                </h3>
              </div>

              <div className="pt-6 mt-4 border-t border-[#E2E8F0] dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {quiz.questions} câu
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {quiz.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {quiz.participants} lượt
                  </span>
                </div>

                <Link to="/register" className="block w-full">
                  <Button variant="secondary" fullWidth size="sm">
                    Thi thử ngay
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
