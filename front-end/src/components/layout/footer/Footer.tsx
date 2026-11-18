import { FooterBrand } from "../footer/pages/FooterBrand";
import { FooterLinks } from "../footer/pages/FooterLinks";
import { FooterSocial } from "../footer/pages/FooterSocial";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#090D1A] border-t border-[#E2E8F0] dark:border-slate-800 transition-colors">
      {/* CTA Section */}
      <section className="border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 rounded-2xl bg-[#EEF2FF] dark:bg-[#111827] px-6 py-8 sm:px-10 sm:py-9 md:flex-row md:items-center md:justify-between border border-[#C7D2FE]/60 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                Sẵn sàng chinh phục kiến thức?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#475569] dark:text-slate-400">
                Tham gia Inno Quiz và bắt đầu luyện tập với hàng nghìn câu hỏi trắc nghiệm ngay hôm nay.
              </p>
            </div>

            <a
              href="/quiz"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#4F46E5] px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-[#4338CA]"
            >
              Bắt đầu ngay
              <span className="ml-2">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <FooterBrand />

          <FooterLinks
            title="Sản phẩm"
            links={[
              { label: "Kho câu hỏi", href: "/quiz" },
              { label: "Đề thi trắc nghiệm", href: "/quiz" },
              { label: "Luyện tập tự do", href: "/practice" },
              { label: "Kết quả & Thống kê", href: "/history" },
            ]}
          />

          <FooterLinks
            title="Hỗ trợ"
            links={[
              { label: "Trung tâm trợ giúp", href: "/contact" },
              { label: "Câu hỏi thường gặp", href: "/news" },
              { label: "Liên hệ tư vấn", href: "/contact" },
              { label: "Đề xuất tính năng", href: "/feature-requests" },
            ]}
          />

          <FooterSocial />
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="border-t border-[#E2E8F0] dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 text-sm text-[#64748B] dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Inno Quiz (HUBT EDTECH). All rights reserved.</p>

            <div className="flex gap-6 text-xs sm:text-sm">
              <a href="/terms" className="hover:text-[#4F46E5] dark:hover:text-indigo-400 transition-colors">
                Điều khoản dịch vụ
              </a>
              <a href="/privacy" className="hover:text-[#4F46E5] dark:hover:text-indigo-400 transition-colors">
                Chính sách bảo mật
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
