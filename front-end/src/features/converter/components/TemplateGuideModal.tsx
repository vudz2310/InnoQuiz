import React from "react";
import { Download, FileText, X } from "lucide-react";
import templateFile from "../../../assets/Mau_cau_hoi_trac_nhiem.docx?url";

interface TemplateGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const TEMPLATE_TEXT = `PHẦN 1: KIẾN THỨC CƠ BẢN

Câu 1: Nội dung câu hỏi?

*A. Đáp án đúng
B. Đáp án sai
C. Đáp án sai
D. Đáp án sai

Câu 2: Nội dung câu hỏi?
A. Đáp án A
B. Đáp án B
C. Đáp án C
D. Đáp án D
Đáp án: C`;

export const TemplateGuideModal: React.FC<TemplateGuideModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="template-guide-title">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 id="template-guide-title" className="font-bold text-slate-900 dark:text-white">
              Hướng dẫn định dạng file câu hỏi
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Phần là tùy chọn. Mỗi phần sẽ được đánh số câu độc lập từ 1. Đáp án có thể đánh dấu bằng dấu <code>*</code> hoặc dùng dòng <code>Đáp án: C</code>.
          </p>
          <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            {TEMPLATE_TEXT}
          </pre>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
            <li>Hỗ trợ A./A)/A: và đáp án viết thường a/b/c/d.</li>
            <li>Các đáp án nằm cùng dòng cũng được tách tự động.</li>
            <li>Câu không có đáp án hoặc có xung đột sẽ được đánh dấu cần kiểm tra.</li>
            <li>Có thể chèn hình ảnh trong câu hỏi hoặc trong đáp án.</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Đóng
          </button>
          <a href={templateFile} download="Mau_cau_hoi_trac_nhiem.docx" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
            <Download className="h-4 w-4" />
            Tải file Word mẫu
          </a>
        </div>
      </div>
    </div>
  );
};
