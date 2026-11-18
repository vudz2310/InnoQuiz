import type { QuestionDraft, QuestionType } from "../../types/quiz.types";
import type { ImportedSection } from "../../types/quiz-section.types";
import type { ParseResult } from "../questionParser";
import {
  normalizeWordText,
  cleanQuestionText,
  cleanAnswerText,
  detectSectionHeader,
  isIgnorableMetaLine,
  splitMultiOptionsInLine,
} from "./textNormalizer";

interface TempOption {
  keyLetter: string;
  isCorrect: boolean;
  content: string;
}

interface TempQuestion {
  order: number;
  content: string;
  options: TempOption[];
}

/**
 * Phân tích cú pháp tệp / văn bản Word (.docx)
 * Hỗ trợ các định dạng bảng biểu Word, dòng chữ cái độc lập (A, B, C, D),
 * nhãn Đúng/Sai (True/False) bên dưới đáp án, và các phần thi độc lập.
 */
export function parseWordQuestions(text: string): ParseResult {
  const errors: string[] = [];

  if (!text || !text.trim()) {
    return {
      success: false,
      sections: [],
      questions: [],
      errors: ["Văn bản Word rỗng."],
      totalParsed: 0,
      validCount: 0,
      warningCount: 1,
    };
  }

  const normalized = normalizeWordText(text);
  const rawLines = normalized.split(/\r?\n/);

  const sections: ImportedSection[] = [];
  let currentSection: ImportedSection = {
    tempId: "sec-1",
    title: "Phần mặc định",
    order: 1,
    questions: [],
  };

  let currentQ: TempQuestion | null = null;
  let currentOpt: TempOption | null = null;

  const letterAloneRegex = /^(\\?\*?|★|✔)?\s*(?:\[|\()?([A-Ha-h])[\.\)\:\-\]]?\s*$/;
  const standardLetterOptionRegex = /^(\\?\*?|★|✔)?\s*(?:\[|\()?([A-Ha-h])[\.\)\:\-\]\s]\s*(.*)$/;
  const isCorrectIndicatorRegex = /^(?:đúng|chính xác|true|correct|đáp án đúng)$/i;
  const isIncorrectIndicatorRegex = /^(?:sai|không chính xác|false|incorrect)$/i;

  const flushOption = () => {
    if (currentOpt && currentQ) {
      if (currentOpt.content.trim()) {
        currentQ.options.push({ ...currentOpt, content: currentOpt.content.trim() });
      }
      currentOpt = null;
    }
  };

  const flushQuestion = () => {
    flushOption();
    if (currentQ && currentQ.options.length > 0) {
      const qOrder = currentSection.questions.length + 1;
      const hasCorrect = currentQ.options.some((o) => o.isCorrect);
      if (!hasCorrect && currentQ.options.length > 0) {
        currentQ.options[0].isCorrect = true;
      }

      let type: QuestionType = "MULTIPLE_CHOICE";
      if (
        currentQ.options.length === 2 &&
        currentQ.options.some((a) => /^(?:đúng|true)$/i.test(a.content.trim())) &&
        currentQ.options.some((a) => /^(?:sai|false)$/i.test(a.content.trim()))
      ) {
        type = "TRUE_FALSE";
      }

      currentSection.questions.push({
        tempId: `q-${currentSection.order}-${qOrder}`,
        order: qOrder,
        content: currentQ.content || `Câu hỏi số ${qOrder}`,
        type,
        points: 1,
        answers: currentQ.options.map((opt, idx) => ({
          order: idx + 1,
          content: opt.content || `Lựa chọn ${idx + 1}`,
          isCorrect: opt.isCorrect,
        })),
      });

      currentQ = null;
    }
  };

  const finalizeSection = () => {
    flushQuestion();
    if (currentSection.questions.length > 0) {
      sections.push(currentSection);
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // 1. Kiểm tra Tiêu đề Phần (Section Header)
    const secCheck = detectSectionHeader(line);
    if (secCheck.isSection) {
      finalizeSection();
      const nextSecOrder = sections.length + 1;
      currentSection = {
        tempId: `sec-${nextSecOrder}`,
        title: secCheck.title,
        order: nextSecOrder,
        questions: [],
      };
      continue;
    }

    if (isIgnorableMetaLine(line)) continue;

    // 2. Kiểm tra nhiều đáp án trên cùng 1 hàng: A. xxx   B. yyy ...
    const multi = splitMultiOptionsInLine(line);
    if (multi && currentQ) {
      flushOption();
      multi.forEach((opt) => {
        currentQ!.options.push({
          keyLetter: opt.keyLetter,
          isCorrect: opt.isCorrect,
          content: opt.content,
        });
      });
      continue;
    }

    // 3. Dòng chỉ báo Đúng/Sai cho đáp án ngay trước đó (trong bảng Word)
    if (isCorrectIndicatorRegex.test(line)) {
      if (currentOpt) {
        currentOpt.isCorrect = true;
      } else if (currentQ && currentQ.options.length > 0) {
        currentQ.options[currentQ.options.length - 1].isCorrect = true;
      }
      continue;
    }
    if (isIncorrectIndicatorRegex.test(line)) {
      if (currentOpt) {
        currentOpt.isCorrect = false;
      }
      continue;
    }

    // 4. Kiểm tra dòng Đáp án: A / Key: B / Đáp án đúng: C / Chọn: D
    const answerKeyMatch = line.match(/^(?:đáp\s*án(?:\s*đúng)?|key|chọn)\s*[:\.\-]?\s*([A-Ha-h\d])/i);
    if (answerKeyMatch && currentQ) {
      flushOption();
      const rawKey = answerKeyMatch[1].toUpperCase();
      let matched = false;
      for (const opt of currentQ.options) {
        if (opt.keyLetter === rawKey) {
          opt.isCorrect = true;
          matched = true;
        } else {
          opt.isCorrect = false;
        }
      }
      if (!matched && /^\d+$/.test(rawKey)) {
        const idx = parseInt(rawKey, 10) - 1;
        if (currentQ.options[idx]) {
          currentQ.options.forEach((o, i) => {
            o.isCorrect = i === idx;
          });
        }
      }
      continue;
    }

    // 5. Bắt đầu câu hỏi có tiền tố rõ ràng: "Câu 1:", "Câu 24: ...", "Question 1:"
    const qMatch = line.match(/^(?:câu\s*hỏi|câu|question|bài)\s*(?:số\s*)?(\d+)\s*[:\.\-\–\—\)]?\s*(.*)$/i);
    if (qMatch) {
      flushQuestion();
      const qNum = parseInt(qMatch[1], 10);
      const content = cleanQuestionText(qMatch[2]);
      currentQ = {
        order: qNum,
        content: content,
        options: [],
      };
      continue;
    }

    // 5. Dòng nhãn chữ cái độc lập trên 1 hàng: "A", "B", "C", "D", "*A"
    const letterAloneMatch = line.match(letterAloneRegex);
    if (letterAloneMatch) {
      flushOption();
      currentOpt = {
        keyLetter: letterAloneMatch[2].toUpperCase(),
        isCorrect: Boolean(letterAloneMatch[1] && (letterAloneMatch[1].includes("*") || letterAloneMatch[1].includes("★") || letterAloneMatch[1].includes("✔"))),
        content: "",
      };
      continue;
    }

    // 6. Dòng đáp án chuẩn có tiền tố chữ cái: "A. xxx", "*B. yyy"
    const standardMatch = line.match(standardLetterOptionRegex);
    if (standardMatch) {
      flushOption();
      currentOpt = {
        keyLetter: standardMatch[2].toUpperCase(),
        isCorrect: Boolean(standardMatch[1] && (standardMatch[1].includes("*") || standardMatch[1].includes("★") || standardMatch[1].includes("✔"))),
        content: cleanAnswerText(standardMatch[3]),
      };
      continue;
    }

    // 7. Nếu đang chờ nội dung cho đáp án (vừa gặp dòng nhãn chữ cái 'A')
    if (currentOpt && !currentOpt.content) {
      currentOpt.content = cleanAnswerText(line);
      continue;
    }

    // 8. Nếu đang có đáp án và gặp dòng nối tiếp
    if (currentOpt && currentOpt.content) {
      currentOpt.content += " " + cleanAnswerText(line);
      continue;
    }

    // 9. Nếu chưa có câu hỏi nào hoặc câu hỏi không có tiền tố "Câu 1:"
    if (!currentQ) {
      currentQ = {
        order: currentSection.questions.length + 1,
        content: cleanQuestionText(line),
        options: [],
      };
    } else {
      // Nối tiếp nội dung câu hỏi
      currentQ.content += " " + cleanQuestionText(line);
    }
  }

  finalizeSection();

  const flattenedQuestions: QuestionDraft[] = [];
  sections.forEach((sec) => {
    sec.questions.forEach((q) => {
      flattenedQuestions.push({ ...q });
    });
  });

  return {
    success: flattenedQuestions.length > 0,
    sections,
    questions: flattenedQuestions,
    errors,
    totalParsed: flattenedQuestions.length,
    validCount: flattenedQuestions.filter(
      (q) => q.content.trim() && q.answers.length >= 2 && q.answers.some((a) => a.isCorrect)
    ).length,
    warningCount: errors.length,
  };
}
