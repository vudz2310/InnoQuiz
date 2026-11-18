import type { QuestionDraft } from "../types/quiz.types";
import type { ImportedSection } from "../types/quiz-section.types";
import type { DocumentBlock, NormalizedQuiz } from "../features/converter/types/converter.types";
import { convertText } from "../features/converter/services/converter.service";
import { converterResultToParseResult } from "../features/converter/adapters/parse-result.adapter";
import {
  parseWordQuestions,
  parsePdfQuestions,
  parseTextQuestions,
  parseJsonQuestions,
  healVietnameseSpacedText,
  normalizeWordText,
  cleanQuestionText,
  cleanAnswerText,
  detectSectionHeader,
  isIgnorableMetaLine,
  splitMultiOptionsInLine,
} from "./parsers";

export interface ParseResult {
  success: boolean;
  sections: ImportedSection[];
  questions: QuestionDraft[]; // Flattened questions for backward compatibility
  errors: string[];
  totalParsed: number;
  validCount: number;
  warningCount: number;
  normalized?: NormalizedQuiz;
  blocks?: DocumentBlock[];
}

/**
 * Tự động phân tích câu hỏi từ văn bản thô theo định dạng phù hợp nhất
 * (Tự động nhận diện PDF EduQuiz, Bảng Word DOCX, hoặc Văn bản thuần A B C D)
 */
export function parseQuestionsFromText(text: string, hint?: "pdf" | "docx" | "txt" | "json"): ParseResult {
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

  if (hint === "json") {
    return parseJsonQuestions(text);
  }

  // Auto detect:
  // 1. Kiểm tra nếu là JSON
  if (/^\s*[\{\[]/.test(text.trim()) && /"answers"|"questions"|"sections"/i.test(text)) {
    try {
      const res = parseJsonQuestions(text);
      if (res.success && res.totalParsed > 0) return res;
    } catch {
      // Tiếp tục auto detect text
    }
  }

  return converterResultToParseResult(convertText(text));
}

// Re-export tất cả các parser & normalizer theo từng module chuyên biệt để dễ debug & mở rộng
export const parseQuestionsFromJson = parseJsonQuestions;

export {
  parseWordQuestions,
  parsePdfQuestions,
  parseTextQuestions,
  parseJsonQuestions,
  healVietnameseSpacedText,
  normalizeWordText,
  cleanQuestionText,
  cleanAnswerText,
  detectSectionHeader,
  isIgnorableMetaLine,
  splitMultiOptionsInLine,
};
