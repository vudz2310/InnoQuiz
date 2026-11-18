import {
  healVietnameseSpacedText,
  normalizeWordText,
} from "../../../utils/parsers/textNormalizer";
import {
  decodeHtmlEntities,
  decodeLegacyEncodedLineBreaks,
} from "./legacy-linebreak.normalizer";

export { decodeHtmlEntities, decodeLegacyEncodedLineBreaks };

export const HIDDEN_CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const VN_ACCENTS_REGEX = /[àáảãạăằắẳẵặâầấẩẪẬèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

const QUESTION_PREFIX =
  /^(câu\s*(?:hỏi\s*)?|question\s*|q\s*\.?\s*|bài\s*)0*(\d+)(\s*[:.)-]?)(?:\s*)(.*)$/i;
const NUMERIC_QUESTION_PREFIX = /^(0*\d+)\s*([.):-])\s*(.+)$/;
const OPTION_PREFIX = /^(\*)?\s*(?:\[|\()?([A-Ha-h])\s*[.):-]\s*(.*)$/;

/**
 * Lọc bỏ ký tự điều khiển ẩn và Null bytes nhưng giữ nguyên:
 * - \t (\u0009)
 * - \n (\u000A)
 * - \r (\u000D)
 */
export function sanitizeControlCharacters(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFC")
    .replace(HIDDEN_CONTROL_CHARACTERS, "")
    .replace(/[\u200B\uFEFF]/g, "");
}

/**
 * Chuẩn hóa Unicode NFC cơ bản, giải mã legacy line breaks & html entities,
 * và thống nhất dấu ngoặc, xuống dòng.
 */
export function normalizeUnicode(value: string): string {
  if (!value) return "";
  const decoded = decodeLegacyEncodedLineBreaks(value);
  return sanitizeControlCharacters(decoded)
    .normalize("NFC")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‛]/g, "'")
    .replace(/\r\n?/g, "\n");
}

/**
 * Bảo vệ các chuỗi kỹ thuật (URLs, code, mã phiên bản, CamelCase) trước khi sửa khoảng cách.
 */
export function protectTechnicalTokens(text: string): {
  text: string;
  restore: (processed: string) => string;
} {
  const tokenMap: string[] = [];
  const addToken = (val: string) => {
    const key = `@@@TECHTOKEN${tokenMap.length}@@@`;
    tokenMap.push(val);
    return key;
  };

  let protectedText = text;

  // 1. URLs
  protectedText = protectedText.replace(/https?:\/\/[^\s]+/g, (match) => addToken(match));
  // 2. Emails
  protectedText = protectedText.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, (match) => addToken(match));
  // 3. Đoạn mã có dấu chấm: System.out, java.sql.Connection
  protectedText = protectedText.replace(/\b(?:[a-zA-Z_][a-zA-Z0-9_]*\.)+[a-zA-Z_][a-zA-Z0-9_]*\b/g, (match) => addToken(match));
  // 4. Token kỹ thuật đứng riêng kèm dấu chấm: Java.
  protectedText = protectedText.replace(/\bJava\.(?=\s|$)/g, (match) => addToken(match));
  // 5. Mã phiên bản/gạch nối: K30-2026, test_size=0.2, UTF-8
  protectedText = protectedText.replace(/\b[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+\b/g, (match) => addToken(match));
  protectedText = protectedText.replace(/\b[a-zA-Z_]+=\d+(?:\.\d+)?\b/g, (match) => addToken(match));
  // 6. Thẻ EduQuiz dạng TA( 1,1 ) hoặc TA(1,1)
  protectedText = protectedText.replace(/\b[TH][A-Z]?\s*\(\s*\d+\s*(?:,\s*\d+\s*)?\s*\)/gi, (match) => addToken(match));
  // 7. PascalCase / CamelCase kỹ thuật phổ biến: OpenOffice, PowerPoint
  protectedText = protectedText.replace(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g, (match) => addToken(match));

  return {
    text: protectedText,
    restore: (processed: string) => {
      let restored = processed;
      for (let i = 0; i < tokenMap.length; i++) {
        restored = restored.replace(`@@@TECHTOKEN${i}@@@`, tokenMap[i]);
      }
      return restored;
    },
  };
}

/**
 * Hàn gắn ký tự bị giãn cách bởi OCR / PDF trích xuất lỗi (chỉ với chuỗi ký tự đơn liên tiếp).
 * Tuyệt đối không can thiệp vào các token đặc biệt hoặc code.
 */
export function repairCharacterSpacing(line: string): string {
  if (line.includes("@@@TECHTOKEN")) return line;

  const chunks = line.split(/([ \t]{2,})/);

  return chunks
    .map((chunk) => {
      if (/^[ \t]+$/.test(chunk)) return chunk;
      const tokens = chunk.trim().split(/[ \t]+/);
      const isSingleCharacterSequence =
        tokens.length >= 3 &&
        tokens.every((token) => /^[A-Za-zÀ-ỹĐđ0-9]$/.test(token));

      if (isSingleCharacterSequence) {
        return tokens.join("");
      }

      const isSpacedWord = /^(?:[A-Za-zÀ-ỹĐđ][ \t]+){1,}[A-Za-zÀ-ỹĐđ]$/.test(
        chunk.trim(),
      );
      return isSpacedWord ? chunk.trim().replace(/[ \t]+/g, "") : chunk;
    })
    .join("");
}

export function repairStructuralSpacing(line: string): string {
  const result = line.trim();

  const questionMatch = result.match(QUESTION_PREFIX);
  if (questionMatch) {
    const [, prefix, number, punctuation, content] = questionMatch;
    const normalizedPrefix = prefix.toLowerCase().startsWith("question")
      ? "Câu"
      : prefix.trim().toLowerCase().startsWith("q")
        ? "Câu"
        : prefix.trim().toLowerCase().startsWith("bài")
          ? "Câu"
          : "Câu";
    return `${normalizedPrefix} ${Number(number)}${punctuation.trim() || ":"}${content ? ` ${content}` : ""}`.trim();
  }

  const numericMatch = result.match(NUMERIC_QUESTION_PREFIX);
  if (numericMatch && !/^[A-Ha-h]\s*[.):-]/.test(result)) {
    return `Câu ${Number(numericMatch[1])}: ${numericMatch[3]}`.trim();
  }

  const optionMatch = result.match(OPTION_PREFIX);
  if (optionMatch) {
    const [, star, label, content] = optionMatch;
    return `${star ? "*" : ""}${label.toUpperCase()}. ${content}`.trim();
  }

  return result;
}

/** Chuẩn hóa từng block nhưng luôn giữ nguyên ranh giới dòng. */
export function normalizeDocumentText(value: string): string {
  const unicodeText = normalizeUnicode(value);
  const repairedLines = unicodeText.split("\n").map((line) => {
    const spaced = repairCharacterSpacing(line);
    return repairStructuralSpacing(spaced);
  });

  return repairedLines.join("\n");
}

/** Chuẩn hóa nội dung câu/đáp án sau khi đã xác định cấu trúc. */
export function normalizeTextFragment(value: string): string {
  if (!value || !value.trim()) return "";

  const sanitized = normalizeUnicode(value);
  const { text: protectedText, restore } = protectTechnicalTokens(sanitized);

  // Nếu chuỗi không chứa dấu tiếng Việt (thuần ASCII), không chạy unglueVietnameseWord
  const hasVietnamese = VN_ACCENTS_REGEX.test(protectedText);
  let processed = protectedText;

  if (hasVietnamese) {
    processed = normalizeWordText(healVietnameseSpacedText(processed));
  }

  processed = processed.replace(/[ \t]+/g, " ").trim();
  return restore(processed);
}

export function normalizeSourceLines(value: string): string[] {
  return normalizeDocumentText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function looksLikeSectionHeader(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("?")) return false;
  if (/^phần\s*(?:mềm|cứng|trăm|tử|quang|đoạn|thưởng|nào|gì|sau|trên|dưới|này|kia|lớn|bài|giải|đầu|cuối|khác|được|có|là|xử|chọn|gồm|thuộc|thi hành)\b/i.test(trimmed)) {
    return false;
  }
  if (/^phần\s*(?:\d+|MMT\s*\d+|[IVXLCDM]+)?\s*[:.-]\s*(?:các\s*)?câu\s*\d+/i.test(trimmed)) {
    return false;
  }
  return /^(?:phần|part|section|chương)\s*(?:thứ\s*)?(?:MMT\s*)?(?:\d+|[IVXLCDM]+|[A-E])(?=[\s:.-]|$)(?!\p{L})/iu.test(
    trimmed,
  );
}

export function normalizeSectionTitle(value: string): string {
  return normalizeTextFragment(value).replace(/\s*[:.-]\s*$/, "").trim();
}

export function isQuestionStart(value: string): boolean {
  return QUESTION_PREFIX.test(value.trim()) || NUMERIC_QUESTION_PREFIX.test(value.trim());
}

export function parseQuestionStart(value: string): { number?: number; content: string } | null {
  const line = value.trim();
  const explicit = line.match(QUESTION_PREFIX);
  if (explicit) {
    return {
      number: Number(explicit[2]),
      content: explicit[4] || "",
    };
  }

  const numeric = line.match(NUMERIC_QUESTION_PREFIX);
  if (numeric && !/^[A-Ha-h]\s*[.):-]/.test(line)) {
    return { number: Number(numeric[1]), content: numeric[3] };
  }

  return null;
}

export function parseOptionPrefix(value: string): {
  label: string;
  content: string;
  starred: boolean;
} | null {
  const match = value.trim().match(OPTION_PREFIX);
  if (!match) return null;
  return {
    label: match[2].toUpperCase(),
    content: match[3],
    starred: Boolean(match[1]),
  };
}
