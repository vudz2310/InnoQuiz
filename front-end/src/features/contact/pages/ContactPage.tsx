import React, { useState } from "react";
import { MapPin, Phone, Mail, Send, CheckCircle2 } from "lucide-react";
import { Input, Select, Textarea, Button } from "../../../components/ui";
import { useNotification } from "../../../components/Notification";

const CONTACT_INFO = [
  {
    icon: MapPin,
    title: "Địa chỉ",
    content: "Số 29A, Ngõ 124, Phố Vĩnh Tuy, Quận Hai Bà Trưng, Hà Nội",
  },
  {
    icon: Phone,
    title: "Hotline",
    content: "1900 xxxx",
    href: "tel:1900xxxx",
  },
  {
    icon: Mail,
    title: "Email",
    content: "support@innoquiz.edu.vn",
    href: "mailto:support@innoquiz.edu.vn",
  },
];

const ContactPage = () => {
  const { showSuccess, addNotification } = useNotification();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    course: "Luyện thi THPT Quốc gia",
    note: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    showSuccess(
      "Gửi yêu cầu thành công!",
      `Cảm ơn ${formData.fullName || "bạn"}, ban tư vấn InnoQuiz sẽ liên hệ trong thời gian sớm nhất.`
    );

    addNotification({
      title: "Yêu cầu tư vấn đã được tiếp nhận",
      message: `Chủ đề: ${formData.course}. Chúng tôi sẽ gọi lại cho bạn qua SĐT ${formData.phone || "đã đăng ký"}.`,
      type: "info",
    });

    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        fullName: "",
        phone: "",
        course: "Luyện thi THPT Quốc gia",
        note: "",
      });
    }, 4000);
  };

  return (
    <div className="base-container py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
        {/* Left Column: Heading, Banner Card & Contact Information */}
        <div className="w-full flex flex-col justify-between h-full space-y-6">
          <div>
            {/* Main Heading */}
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400 bg-[#EEF2FF] dark:bg-indigo-950/70 px-3 py-1 rounded-full border border-[#C7D2FE] dark:border-indigo-800/40">
              Hỗ trợ 24/7
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight mt-3">
              Liên hệ với chúng tôi
            </h1>
            {/* Subtitle */}
            <p className="mt-2 text-[#475569] dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Hãy để lại thông tin, đội ngũ Inno Quiz sẽ phản hồi trong thời gian sớm nhất.
            </p>

            {/* Support Preview / Banner Card */}
            <div className="mt-6 bg-white dark:bg-[#111827] rounded-3xl p-3 sm:p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <div className="relative rounded-2xl overflow-hidden bg-[#EEF2FF] dark:bg-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                  alt="Tư vấn Inno Quiz"
                  className="w-full h-auto max-h-75 object-cover rounded-2xl transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>

          {/* Contact Details List */}
          <div className="space-y-5 pt-2">
            {CONTACT_INFO.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-[#EEF2FF] dark:bg-indigo-950/70 border border-[#C7D2FE]/60 dark:border-indigo-800/50 flex items-center justify-center text-[#4F46E5] dark:text-indigo-300">
                    <Icon className="w-5 h-5 stroke-2" />
                  </div>
                  <div className="flex flex-col justify-center pt-0.5">
                    <span className="font-bold text-[#0F172A] dark:text-white text-sm sm:text-base">
                      {item.title}
                    </span>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-sm text-[#475569] dark:text-slate-400 font-medium mt-0.5 hover:text-[#4F46E5] dark:hover:text-indigo-400 transition-colors"
                      >
                        {item.content}
                      </a>
                    ) : (
                      <span className="text-sm text-[#475569] dark:text-slate-400 font-normal mt-0.5 leading-snug">
                        {item.content}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="w-full h-full flex flex-col">
          <div className="w-full h-full bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 md:p-10 border border-[#E2E8F0] dark:border-slate-800 shadow-xs flex flex-col justify-between relative transition-colors">
            {isSubmitted && (
              <div className="mb-6 p-4 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#10B981]/30 dark:border-emerald-800/60 text-[#047857] dark:text-emerald-300 text-sm font-medium flex items-center gap-2 animate-in fade-in duration-300">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981] dark:text-emerald-400" />
                <span>
                  Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất.
                </span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col justify-between h-full space-y-5 sm:space-y-6"
            >
              {/* Họ và tên */}
              <Input
                label="Họ và tên"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
              />

              {/* Số điện thoại */}
              <Input
                type="tel"
                label="Số điện thoại"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
              />

              {/* Khóa học quan tâm */}
              <Select
                label="Chủ đề tư vấn"
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
              >
                <option value="Luyện thi THPT Quốc gia">
                  Luyện thi THPT Quốc gia
                </option>
                <option value="Ôn thi Đánh giá năng lực (HSA/APT)">
                  Ôn thi Đánh giá năng lực (HSA/APT)
                </option>
                <option value="Tiếng Anh giao tiếp / IELTS">
                  Tiếng Anh giao tiếp / IELTS
                </option>
                <option value="Hỗ trợ tài khoản Inno Quiz">
                  Hỗ trợ tài khoản Inno Quiz
                </option>
                <option value="Khác">Khác</option>
              </Select>

              {/* Ghi chú */}
              <Textarea
                label="Nội dung lời nhắn"
                id="note"
                name="note"
                rows={4}
                value={formData.note}
                onChange={handleChange}
                placeholder="Nhập nội dung cần tư vấn..."
              />

              {/* Submit Button */}
              <div className="flex justify-end pt-2 mt-auto">
                <Button type="submit" variant="primary" size="lg">
                  <Send className="w-4 h-4" />
                  Gửi Yêu Cầu
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
