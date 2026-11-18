import type { QuestionDraft, QuestionType } from "../../types/quiz.types";
import type { ImportedSection } from "../../types/quiz-section.types";
import type { ParseResult } from "../questionParser";
import {
  healVietnameseSpacedText,
  normalizeWordText,
  cleanQuestionText,
  cleanAnswerText,
  detectSectionHeader,
  isIgnorableMetaLine,
  splitMultiOptionsInLine,
} from "./textNormalizer";

interface RawQuestionBlock {
  headerNumber?: number;
  lines: string[];
}

/**
 * Phân tích cú pháp tệp / văn bản trích xuất từ PDF (EduQuiz, OCR Scanned PDF)
 * Tự động hàn gắn tiếng Việt bị vỡ, xóa sạch 100% mã thẻ HA/HB/HC/TA/TB/TC,
 * bóc tách từng phần thi (Phần 1, Phần 2...) và xác định đáp án đúng chính xác.
 */
export function parsePdfQuestions(text: string): ParseResult {
  const errors: string[] = [];

  if (!text || !text.trim()) {
    return {
      success: false,
      sections: [],
      questions: [],
      errors: ["Văn bản PDF rỗng, vui lòng nhập nội dung đề thi."],
      totalParsed: 0,
      validCount: 0,
      warningCount: 0,
    };
  }

  const healedText = normalizeWordText(healVietnameseSpacedText(text));
  const rawLines = healedText.split(/\r?\n/);

  const sections: ImportedSection[] = [];
  let currentSection: ImportedSection = {
    tempId: "sec-1",
    title: "Phần mặc định",
    order: 1,
    questions: [],
  };

  const taAnswerRegex = /^(\\?\*?|★|✔)?\s*T\s*([A-Z])?\s*\(?\s*(?:[A-Z],)?\s*(\d+)\s*[,.\s]+\s*(\d+)\s*\)?\s*[:=“"']?\s*(.*)$/i;
  const letterAnswerRegex = /^(\\?\*?|★|✔)?\s*(?:\[|\()?([A-Ha-h])[\.\)\:\-\]\s]\s*(.*)$/;
  const answerKeyRegex = /^(?:đáp án|dap an|answer|key|chọn|đáp án đúng)\s*[:\.\-]?\s*([A-Ha-h\d])/i;
  const starAnswerRegex = /^(?:\\?\*|★|✔)\s*(.*)$/;

  const isRealQuestionStart = (line: string): { isStart: boolean; questionNumber?: number; content: string } => {
    const trimmed = line.trim();
    if (!trimmed) return { isStart: false, content: "" };
    if (isIgnorableMetaLine(trimmed)) return { isStart: false, content: "" };
    if (detectSectionHeader(trimmed).isSection) return { isStart: false, content: "" };
    if (/^T[A-Z]?\s*\(?\s*(?:[A-Z],)?\s*\d+/i.test(trimmed)) return { isStart: false, content: "" };

    const explicitMatch = trimmed.match(/^(?:câu\s*hỏi|câu|question|bài)\s*(?:số\s*)?(\d+)\s*[:\.\-\–\—\)]?\s*(.*)$/i);
    if (explicitMatch) {
      const qNum = parseInt(explicitMatch[1], 10);
      let rest = explicitMatch[2] || "";
      if (/^[\(\[]?\s*(?:m\s*ộ\s*t|n\s*h\s*i\s*ề\s*u)\s*đ\s*á\s*p\s*á\s*n\s*[\)\]]?$/i.test(rest.trim())) {
        return { isStart: false, content: "" };
      }
      return { isStart: true, questionNumber: qNum, content: cleanQuestionText(rest) };
    }

    const numberMatch = trimmed.match(/^(\d+)[\.\:\)]\s+([A-ZÀ-Ỹ].{4,})$/);
    if (numberMatch) {
      const qNum = parseInt(numberMatch[1], 10);
      const rest = numberMatch[2];
      if (!/^(?:đúng|sai|true|false)$/i.test(rest)) {
        return { isStart: true, questionNumber: qNum, content: cleanQuestionText(rest) };
      }
    }

    return { isStart: false, content: "" };
  };

  const processQuestionBlock = (block: RawQuestionBlock) => {
    const rawLines = block.lines.map((l) => l.trim()).filter(Boolean);
    if (rawLines.length === 0) return;

    let questionContent = "";
    let detectedKey: string | undefined;
    const rawAnswers: { content: string; isCorrect: boolean; keyLetter?: string }[] = [];

    let optionStartIndex = -1;
    const firstLine = rawLines[0];
    const qCheck = isRealQuestionStart(firstLine);
    let initialQText = qCheck.isStart ? qCheck.content : firstLine;
    initialQText = cleanQuestionText(initialQText);

    const qContentParts: string[] = [initialQText];

    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i];

      const hasStar = starAnswerRegex.test(line);
      const hasLetter = letterAnswerRegex.test(line);
      const hasTA = taAnswerRegex.test(line);
      const hasMulti = splitMultiOptionsInLine(line) !== null;
      const hasKey = answerKeyRegex.test(line);

      if (hasStar || hasLetter || hasTA || hasMulti || hasKey) {
        optionStartIndex = i;
        break;
      }

      const lastQText = qContentParts[qContentParts.length - 1];
      if (/[\?\:]\s*$/.test(lastQText)) {
        optionStartIndex = i;
        break;
      }

      const startsWithLower = /^[a-zà-ỹ]/.test(line);
      if (startsWithLower) {
        qContentParts.push(line);
        continue;
      }

      if (/[\?\:]\s*$/.test(line)) {
        qContentParts.push(line);
        optionStartIndex = i + 1;
        break;
      }

      optionStartIndex = i;
      break;
    }

    questionContent = cleanQuestionText(qContentParts.join(" ").replace(/\s{2,}/g, " ").trim());

    const optionLines = optionStartIndex >= 0 ? rawLines.slice(optionStartIndex) : [];

    for (let i = 0; i < optionLines.length; i++) {
      const line = optionLines[i];

      const keyMatch = line.match(answerKeyRegex);
      if (keyMatch) {
        detectedKey = keyMatch[1];
        continue;
      }

      const multi = splitMultiOptionsInLine(line);
      if (multi) {
        multi.forEach((opt) => rawAnswers.push(opt));
        continue;
      }

      const taMatch = line.match(taAnswerRegex);
      if (taMatch) {
        const isCorrect = Boolean(taMatch[1] && (taMatch[1].includes("*") || taMatch[1].includes("★") || taMatch[1].includes("✔")));
        const content = cleanAnswerText(taMatch[5]);
        if (content) {
          rawAnswers.push({ content, isCorrect });
        }
        continue;
      }

      const letterMatch = line.match(letterAnswerRegex);
      if (letterMatch) {
        const isCorrect = Boolean(letterMatch[1] && (letterMatch[1].includes("*") || letterMatch[1].includes("★") || letterMatch[1].includes("✔")));
        const keyLetter = letterMatch[2].toUpperCase();
        const content = cleanAnswerText(letterMatch[3]);
        if (content) {
          rawAnswers.push({ content, isCorrect, keyLetter });
        }
        continue;
      }

      const starMatch = line.match(starAnswerRegex);
      if (starMatch) {
        const starContent = cleanAnswerText(starMatch[1]);
        if (starContent) {
          rawAnswers.push({ content: starContent, isCorrect: true });
        }
        continue;
      }

      const startsWithLower = /^[a-zà-ỹ]/.test(line);
      const isShortConnector = /^(?:của|và|hoặc|cho|để|vào|trong|với|tại|theo|như|là|ra|lên|xuống|được|bị|kia|này|thành)\b/i.test(line);

      if (rawAnswers.length > 0 && (startsWithLower || isShortConnector)) {
        rawAnswers[rawAnswers.length - 1].content += " " + cleanAnswerText(line);
      } else {
        const cleaned = cleanAnswerText(line);
        if (cleaned) {
          rawAnswers.push({ content: cleaned, isCorrect: false });
        }
      }
    }

    if (rawAnswers.length === 0) {
      return;
    }

    if (detectedKey) {
      const key = detectedKey.toUpperCase();
      let matched = false;
      rawAnswers.forEach((ans) => {
        if (ans.keyLetter === key) {
          ans.isCorrect = true;
          matched = true;
        }
      });
      if (!matched) {
        const idx = /^\d+$/.test(key) ? parseInt(key, 10) - 1 : key.charCodeAt(0) - 65;
        if (idx >= 0 && idx < rawAnswers.length) {
          rawAnswers[idx].isCorrect = true;
        }
      }
    }

    const qOrderInSection = currentSection.questions.length + 1;
    const hasCorrect = rawAnswers.some((a) => a.isCorrect);
    if (!hasCorrect && rawAnswers.length > 0) {
      rawAnswers[0].isCorrect = true;
      errors.push(`${currentSection.title} - Câu ${qOrderInSection}: Chưa đánh dấu đáp án đúng, đã tự động chọn đáp án đầu.`);
    }

    if (rawAnswers.length < 2) {
      errors.push(`${currentSection.title} - Câu ${qOrderInSection}: Có ít hơn 2 lựa chọn.`);
    }

    let type: QuestionType = "MULTIPLE_CHOICE";
    if (
      rawAnswers.length === 2 &&
      rawAnswers.some((a) => /^(?:đúng|true)$/i.test(a.content.trim())) &&
      rawAnswers.some((a) => /^(?:sai|false)$/i.test(a.content.trim()))
    ) {
      type = "TRUE_FALSE";
    }

    currentSection.questions.push({
      tempId: `q-${currentSection.order}-${qOrderInSection}`,
      order: qOrderInSection,
      content: questionContent || `Câu hỏi số ${qOrderInSection}`,
      type,
      points: 1,
      answers: rawAnswers.map((a, aIdx) => ({
        order: aIdx + 1,
        content: a.content || `Lựa chọn ${aIdx + 1}`,
        isCorrect: a.isCorrect,
      })),
    });
  };

  let currentBlock: RawQuestionBlock | null = null;

  const flushBlock = () => {
    if (currentBlock && currentBlock.lines.length > 0) {
      processQuestionBlock(currentBlock);
      currentBlock = null;
    }
  };

  const finalizeSection = () => {
    flushBlock();
    if (currentSection.questions.length > 0) {
      sections.push(currentSection);
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

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

    const qCheck = isRealQuestionStart(line);
    if (qCheck.isStart) {
      flushBlock();
      currentBlock = {
        headerNumber: qCheck.questionNumber,
        lines: [line],
      };
      continue;
    }

    if (currentBlock) {
      currentBlock.lines.push(line);
    } else {
      currentBlock = {
        lines: [line],
      };
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
