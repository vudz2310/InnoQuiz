import type { DocumentBlock, QuizDraft } from "../features/converter/types/converter.types";
import {
  extractDocxBlocks,
  extractPdfBlocks,
  extractTxtBlocks,
  extractJsonToQuizDraft,
  quizDraftToDocumentBlocks,
} from "../features/converter/extractors";

export interface DocumentReadResult {
  text: string;
  type: "text" | "json" | "pdf" | "docx";
  filename: string;
  blocks: DocumentBlock[];
  draft?: QuizDraft;
}

export interface ReadDocumentProgress {
  stage: "extracting" | "parsing";
  current: number;
  total: number;
  percent: number;
  message: string;
}

export interface ReadDocumentOptions {
  signal?: AbortSignal;
  onProgress?: (progress: ReadDocumentProgress) => void;
}

function blocksToText(blocks: DocumentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "TEXT" || block.type === "TABLE") {
        return block.content || block.normalizedText || block.rawText || "";
      }
      if (block.type === "IMAGE") {
        return "{ảnh}";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Đọc nội dung văn bản từ các định dạng tệp: .pdf, .docx, .txt, .json
 * Chuẩn hóa toàn bộ thành DocumentBlock[] thống nhất và hỗ trợ trực tiếp QuizDraft cho JSON.
 */
export async function readDocumentFile(
  file: File,
  options?: ReadDocumentOptions,
): Promise<DocumentReadResult> {
  const filename = file.name;
  const ext = filename.split(".").pop()?.toLowerCase();

  options?.signal?.throwIfAborted?.();

  // 1. Tệp PDF (.pdf)
  if (ext === "pdf" || file.type === "application/pdf") {
    const blocks = await extractPdfBlocks(file, options);
    options?.signal?.throwIfAborted?.();
    return { text: blocksToText(blocks), type: "pdf", filename, blocks };
  }

  // 2. Tệp Word DOCX (.docx)
  if (
    ext === "docx" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const blocks = await extractDocxBlocks(file, options);
    options?.signal?.throwIfAborted?.();
    return { text: blocksToText(blocks), type: "docx", filename, blocks };
  }

  // 3. Tệp JSON (.json)
  if (ext === "json" || file.type === "application/json") {
    const draft = await extractJsonToQuizDraft(file, options);
    options?.signal?.throwIfAborted?.();
    const blocks = quizDraftToDocumentBlocks(draft);
    return {
      text: blocksToText(blocks),
      type: "json",
      filename,
      blocks,
      draft,
    };
  }

  // 4. Mặc định là tệp văn bản thô (.txt, .md, .csv...)
  const blocks = await extractTxtBlocks(file, options);
  options?.signal?.throwIfAborted?.();
  return { text: blocksToText(blocks), type: "text", filename, blocks };
}
