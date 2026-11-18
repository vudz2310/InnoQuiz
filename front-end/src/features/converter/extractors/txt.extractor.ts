import type { DocumentBlock } from "../types/converter.types";
import type { ReadDocumentProgress } from "../../../utils/fileDocumentReader";
import { decodeLegacyEncodedLineBreaks } from "../normalizers/legacy-linebreak.normalizer";

function createBlockId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `txt-block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Trích xuất các DocumentBlock từ tệp văn bản thô (.txt, .md, .csv)
 * Bảo tồn encoding, loại bỏ BOM \uFEFF ở đầu file, giữ nguyên ranh giới dòng và thụt lề.
 */
export async function extractTxtBlocks(
  file: File,
  options?: { signal?: AbortSignal; onProgress?: (progress: ReadDocumentProgress) => void },
): Promise<DocumentBlock[]> {
  options?.signal?.throwIfAborted?.();

  options?.onProgress?.({
    stage: "extracting",
    current: 1,
    total: 2,
    percent: 30,
    message: "Đang đọc nội dung tệp văn bản...",
  });

  const rawBuffer = await file.arrayBuffer();
  options?.signal?.throwIfAborted?.();

  // Phát hiện UTF-8 BOM hoặc UTF-16
  const decoder = new TextDecoder("utf-8");
  let text = decoder.decode(rawBuffer);

  // Xóa ký tự BOM \uFEFF ở đầu nếu có
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  // Giải mã các ký tự ghép dòng legacy & HTML entities
  const decodedText = decodeLegacyEncodedLineBreaks(text);

  // Chuẩn hóa xuống dòng \r\n -> \n nhưng GIỮ NGUYÊN các dòng trống và thụt lề
  const lines = decodedText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const blocks: DocumentBlock[] = [];
  let currentParagraphLines: string[] = [];
  let order = 0;

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const content = currentParagraphLines.join("\n");
      blocks.push({
        id: createBlockId(),
        kind: "TEXT",
        type: "TEXT",
        content,
        rawText: content,
        normalizedText: content,
        order,
        sourceName: file.name,
        source: {
          fileName: file.name,
          paragraphIndex: order,
          blockIndex: order,
        },
      });
      order += 1;
      currentParagraphLines = [];
    }
  };

  for (const line of lines) {
    if (line.trim() === "") {
      flushParagraph();
    } else {
      currentParagraphLines.push(line);
    }
  }
  flushParagraph();

  // Trường hợp tệp toàn dòng trống hoặc rỗng
  if (blocks.length === 0 && text.trim()) {
    blocks.push({
      id: createBlockId(),
      kind: "TEXT",
      type: "TEXT",
      content: text,
      rawText: text,
      normalizedText: text,
      order: 0,
      sourceName: file.name,
      source: {
        fileName: file.name,
        paragraphIndex: 0,
        blockIndex: 0,
      },
    });
  }

  options?.onProgress?.({
    stage: "extracting",
    current: 2,
    total: 2,
    percent: 85,
    message: "Đã trích xuất xong nội dung tệp văn bản...",
  });

  return blocks;
}
