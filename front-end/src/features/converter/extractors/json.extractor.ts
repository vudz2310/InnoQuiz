import {
  type QuizDraft,
  type QuizSectionDraft,
  type QuizQuestionDraft,
  type QuizOptionDraft,
  type AnswerEvidence,
  type DocumentBlock,
  PARSER_VERSION,
} from "../types/converter.types";
import type { ReadDocumentProgress } from "../../../utils/fileDocumentReader";

function createId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type JsonRecord = Record<string, unknown>;

function isRecord(val: unknown): val is JsonRecord {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function findStringField(record: JsonRecord, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function findArrayField(record: JsonRecord, keys: string[]): unknown[] | undefined {
  for (const k of keys) {
    const v = record[k];
    if (Array.isArray(v)) return v;
  }
  return undefined;
}

/**
 * Trích xuất an toàn một câu hỏi từ đối tượng JSON tùy ý.
 */
function parseJsonQuestionObject(
  rawQ: unknown,
  qIndex: number,
  secIndex: number,
  sourceFileName: string,
): QuizQuestionDraft {
  const record = isRecord(rawQ) ? rawQ : {};
  const content = findStringField(record, ["content", "question", "text", "title"]) || `Câu hỏi ${qIndex + 1}`;
  const rawOptions = findArrayField(record, ["options", "answers", "choices"]) || [];

  const rawCorrectKey = record["correctAnswer"] ?? record["correct"] ?? record["answerKey"] ?? record["key"];

  const options: QuizOptionDraft[] = rawOptions.map((rawOpt, optIndex) => {
    let text = "";
    let isCorrect: boolean | null = null;
    const evidence: AnswerEvidence[] = [];

    if (typeof rawOpt === "string") {
      text = rawOpt.trim();
    } else if (isRecord(rawOpt)) {
      text = findStringField(rawOpt, ["text", "content", "choice", "title"]) || `Lựa chọn ${optIndex + 1}`;
      if (typeof rawOpt["isCorrect"] === "boolean") {
        isCorrect = rawOpt["isCorrect"];
        if (isCorrect) {
          evidence.push({
            type: "JSON_FIELD",
            sourceBlockId: `json-opt-${optIndex + 1}`,
            confidence: 1.0,
            description: "Thuộc tính isCorrect: true trong JSON",
          });
        }
      } else if (typeof rawOpt["correct"] === "boolean") {
        isCorrect = rawOpt["correct"];
        if (isCorrect) {
          evidence.push({
            type: "JSON_FIELD",
            sourceBlockId: `json-opt-${optIndex + 1}`,
            confidence: 1.0,
            description: "Thuộc tính correct: true trong JSON",
          });
        }
      }
    }

    const label = String.fromCharCode(65 + optIndex);

    // Đối chiếu với correctKey bên ngoài câu hỏi nếu có
    if (rawCorrectKey !== undefined && rawCorrectKey !== null) {
      if (typeof rawCorrectKey === "number" && rawCorrectKey === optIndex) {
        isCorrect = true;
        evidence.push({
          type: "JSON_FIELD",
          sourceBlockId: `json-key`,
          confidence: 1.0,
          description: `Chỉ số đáp án đúng correctAnswer: ${rawCorrectKey}`,
        });
      } else if (typeof rawCorrectKey === "string") {
        const cleanKey = rawCorrectKey.trim().toUpperCase();
        if (cleanKey === label || cleanKey === text.toUpperCase()) {
          isCorrect = true;
          evidence.push({
            type: "JSON_FIELD",
            sourceBlockId: `json-key`,
            confidence: 1.0,
            description: `Nhãn đáp án đúng: ${cleanKey}`,
          });
        }
      }
    }

    return {
      id: createId(`opt-${secIndex + 1}-${qIndex + 1}`),
      label,
      order: optIndex + 1,
      text,
      mediaAssetIds: [],
      isCorrect,
      evidence,
      sourceBlockIds: [`json-q-${qIndex + 1}-opt-${optIndex + 1}`],
    };
  });

  const correctOptionIds = options.filter((o) => o.isCorrect === true).map((o) => o.id);
  const answerStatus =
    options.some((o) => o.isCorrect !== null) && correctOptionIds.length > 0
      ? "DETECTED"
      : "MISSING";

  return {
    id: createId(`q-${secIndex + 1}-${qIndex + 1}`),
    sourceNumber: typeof record["sourceNumber"] === "number" ? record["sourceNumber"] : qIndex + 1,
    order: qIndex + 1,
    type: options.length === 2 && options.every((o) => /^(đúng|sai|true|false)$/i.test(o.text))
      ? "TRUE_FALSE"
      : "MULTIPLE_CHOICE",
    content,
    contentSegments: [
      {
        id: createId("seg-text"),
        type: "TEXT",
        rawContent: content,
        normalizedContent: content,
      },
    ],
    mediaAssetIds: [],
    options,
    correctOptionIds: correctOptionIds.length > 0 ? correctOptionIds : null,
    answerStatus,
    parseStatus: content && options.length >= 2 ? "VALID" : "NEEDS_REVIEW",
    confidence: 1.0,
    warnings: [],
    sourceBlockIds: [`json-block-${qIndex + 1}`],
    sourceLocation: {
      sourceName: sourceFileName,
      blockIndex: qIndex + 1,
    },
  };
}

/**
 * Phân tích tệp JSON thành Canonical QuizDraft.
 * Hỗ trợ:
 * 1. Canonical Schema (schemaVersion: "1.0.0")
 * 2. Mảng câu hỏi phẳng
 * 3. Cấu trúc lồng sections
 */
export async function extractJsonToQuizDraft(
  file: File,
  options?: { signal?: AbortSignal; onProgress?: (progress: ReadDocumentProgress) => void },
): Promise<QuizDraft> {
  options?.signal?.throwIfAborted?.();

  options?.onProgress?.({
    stage: "extracting",
    current: 1,
    total: 2,
    percent: 30,
    message: "Đang đọc tệp JSON...",
  });

  const text = await file.text();
  options?.signal?.throwIfAborted?.();

  const data: unknown = JSON.parse(text);

  // 1. Kiểm tra nếu là Canonical Schema
  if (isRecord(data) && data["schemaVersion"] === "1.0.0" && Array.isArray(data["sections"])) {
    return data as unknown as QuizDraft;
  }

  // 2. Trường hợp cấu trúc { title, sections: [...] }
  if (isRecord(data) && Array.isArray(data["sections"])) {
    const title = typeof data["title"] === "string" ? data["title"] : file.name.replace(/\.[^/.]+$/, "");
    const sections: QuizSectionDraft[] = data["sections"].map((sec, secIdx) => {
      const secRecord = isRecord(sec) ? sec : {};
      const secTitle = findStringField(secRecord, ["title", "name"]) || `Phần ${secIdx + 1}`;
      const rawQs = findArrayField(secRecord, ["questions", "items"]) || [];
      const questions = rawQs.map((q, qIdx) => parseJsonQuestionObject(q, qIdx, secIdx, file.name));

      return {
        id: createId(`sec-${secIdx + 1}`),
        title: secTitle,
        order: secIdx + 1,
        questions,
      };
    });

    const allQuestions = sections.flatMap((s) => s.questions);
    return {
      schemaVersion: "1.0.0",
      parserVersion: PARSER_VERSION,
      title,
      sourceType: "JSON",
      sections,
      mediaAssets: [],
      mediaPlacements: [],
      warnings: [],
      statistics: {
        totalSections: sections.length,
        totalQuestions: allQuestions.length,
        totalImages: 0,
        readyQuestions: allQuestions.filter((q) => q.parseStatus === "VALID" && q.answerStatus === "DETECTED").length,
        waitingAnswerQuestions: allQuestions.filter((q) => q.parseStatus === "VALID" && q.answerStatus === "MISSING").length,
        needsReviewQuestions: allQuestions.filter((q) => q.parseStatus === "NEEDS_REVIEW").length,
        invalidQuestions: allQuestions.filter((q) => q.parseStatus === "INVALID").length,
        unassignedMediaCount: 0,
      },
    };
  }

  // 3. Trường hợp danh sách câu hỏi phẳng (Array hoặc { questions: [...] })
  const rawList: unknown[] = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data["questions"])
      ? data["questions"]
      : [];

  const questions = rawList.map((q, idx) => parseJsonQuestionObject(q, idx, 0, file.name));
  const defaultSection: QuizSectionDraft = {
    id: createId("sec-1"),
    title: "Phần 1: Trắc nghiệm",
    order: 1,
    questions,
  };

  return {
    schemaVersion: "1.0.0",
    parserVersion: PARSER_VERSION,
    title: (isRecord(data) && typeof data["title"] === "string" ? data["title"] : undefined) || file.name.replace(/\.[^/.]+$/, ""),
    sourceType: "JSON",
    sections: [defaultSection],
    mediaAssets: [],
    mediaPlacements: [],
    warnings: [],
    statistics: {
      totalSections: 1,
      totalQuestions: questions.length,
      totalImages: 0,
      readyQuestions: questions.filter((q) => q.parseStatus === "VALID" && q.answerStatus === "DETECTED").length,
      waitingAnswerQuestions: questions.filter((q) => q.parseStatus === "VALID" && q.answerStatus === "MISSING").length,
      needsReviewQuestions: questions.filter((q) => q.parseStatus === "NEEDS_REVIEW").length,
      invalidQuestions: questions.filter((q) => q.parseStatus === "INVALID").length,
      unassignedMediaCount: 0,
    },
  };
}

/**
 * Chuyển đổi QuizDraft thành DocumentBlock[] để đảm bảo toàn bộ pipeline
 * đều có thể biểu diễn và đối chiếu trên giao diện.
 */
export function quizDraftToDocumentBlocks(draft: QuizDraft): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  let order = 0;

  for (const sec of draft.sections) {
    blocks.push({
      id: createId("blk-sec"),
      kind: "SECTION_BREAK",
      type: "TEXT",
      content: sec.title,
      order: order++,
    });

    for (const q of sec.questions) {
      blocks.push({
        id: createId("blk-q"),
        kind: "TEXT",
        type: "TEXT",
        content: `Câu ${q.order}: ${q.content}`,
        order: order++,
      });

      for (const opt of q.options) {
        const star = opt.isCorrect === true ? "* " : "";
        blocks.push({
          id: createId("blk-opt"),
          kind: "TEXT",
          type: "TEXT",
          content: `${star}${opt.label}. ${opt.text}`,
          order: order++,
        });
      }
    }
  }

  return blocks;
}

/**
 * Xuất QuizDraft thành Canonical JSON chuỗi, bảo toàn 100% dữ liệu.
 */
export function exportToCanonicalJson(draft: QuizDraft): string {
  return JSON.stringify(draft, null, 2);
}
