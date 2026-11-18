import type { ParseResult } from "../questionParser";
import { parseWordQuestions } from "./docxParser";
import { parsePdfQuestions } from "./pdfParser";

/**
 * Phân tích cú pháp tệp / văn bản thuần (.txt, .md, sao chép dán thông thường)
 * Tự động chọn chiến lược phù hợp (nhận diện theo mẫu Word / EduQuiz / Standard text).
 */
export function parseTextQuestions(text: string): ParseResult {
  if (!text || !text.trim()) {
    return {
      success: false,
      sections: [],
      questions: [],
      errors: ["Văn bản rỗng, vui lòng nhập nội dung đề thi."],
      totalParsed: 0,
      validCount: 0,
      warningCount: 0,
    };
  }

  // Nếu chứa mẫu EduQuiz (HA / TA / eduquiz.vn)
  if (/HA\s*\(?\s*\d|TA\s*\(?\s*\d|eduquiz/i.test(text)) {
    return parsePdfQuestions(text);
  }

  // Nếu chứa mẫu bảng Word / dòng nhãn chữ cái đơn A \n Content \n Đúng
  const hasVerticalOptionLayout = /\n\s*[A-D]\s*\n/i.test(text) || /\n\s*Trắc\s*nghiệm\s*\n/i.test(text);
  if (hasVerticalOptionLayout) {
    return parseWordQuestions(text);
  }

  // Mặc định chạy bộ phân tích tổng quát
  const pdfParsed = parsePdfQuestions(text);
  if (pdfParsed.totalParsed > 0) {
    return pdfParsed;
  }

  return parseWordQuestions(text);
}
