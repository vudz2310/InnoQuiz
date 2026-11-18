import { Badge, Button, Card } from "../../../../components/ui";
import { ArrowRight } from "lucide-react";

const AdmissionsInfo = () => {
  const newsList = [
    {
      id: 1,
      title: "Thông báo tuyển sinh hệ chính quy kỳ thi trực tuyến sắp tới",
      date: "14/08/2026",
      badge: "Mới nhất",
      desc: "Thông tin chi tiết về chỉ tiêu tuyển sinh, hình thức xét tuyển và các mốc thời gian quan trọng.",
    },
    {
      id: 2,
      title: "Quy chế tuyển sinh & Điều kiện xét tuyển trắc nghiệm mới nhất",
      date: "11/08/2026",
      badge: "Tuyển sinh",
      desc: "Cập nhật những thay đổi quan trọng trong quy chế tuyển sinh trắc nghiệm trực tuyến.",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-slate-800 shadow-xs transition-colors">
        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">
          Thông tin tuyển sinh chính thức
        </h2>
        <p className="text-[#475569] dark:text-slate-400 text-sm mb-6">
          Cập nhật nhanh chóng thông báo tuyển sinh, lịch thi và tiêu chuẩn xét tuyển mới nhất.
        </p>

        <div className="space-y-4">
          {newsList.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-[#E2E8F0] dark:border-slate-800"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{item.badge}</Badge>
                  <span className="text-xs text-[#64748B] dark:text-slate-400 font-medium">
                    {item.date}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-[#475569] dark:text-slate-400 max-w-2xl leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <Button variant="secondary" size="sm">
                Đọc thông báo
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdmissionsInfo;
