// Polyfill Promise.withResolvers nếu môi trường cũ chưa hỗ trợ
type PromiseResolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

type PromiseConstructorWithResolvers = PromiseConstructor & {
  withResolvers?: <T>() => PromiseResolvers<T>;
};

interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  hasEOL: boolean;
}

const isPdfTextItem = (item: unknown): item is PdfTextItem => {
  if (typeof item !== "object" || item === null) return false;
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.str === "string" &&
    Array.isArray(candidate.transform) &&
    candidate.transform.every((value) => typeof value === "number") &&
    typeof candidate.width === "number" &&
    typeof candidate.hasEOL === "boolean"
  );
};

const promiseConstructor = Promise as PromiseConstructorWithResolvers;
if (typeof promiseConstructor.withResolvers === "undefined") {
  promiseConstructor.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Cấu hình worker cho pdfjs-dist offline/local
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Trích xuất toàn bộ văn bản từ tệp PDF trong trình duyệt
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    let lastY: number | null = null;
    let lastX: number | null = null;
    let lastWidth: number = 0;
    let pageText = "";

    for (const item of textContent.items) {
      if (isPdfTextItem(item)) {
        const str = item.str;
        if (!str && !item.hasEOL) continue;

        const currentX = item.transform[4];
        const currentY = item.transform[5];

        // 1. Kiểm tra xuống dòng dựa trên tọa độ Y
        const isNewLine = lastY !== null && Math.abs(currentY - lastY) > 5;

        if (isNewLine) {
          if (!pageText.endsWith("\n")) {
            pageText += "\n";
          }
        } else if (lastX !== null) {
          // 2. Cùng dòng: tính khoảng cách ngang (gap)
          const gap = currentX - (lastX + lastWidth);
          // Chỉ chèn khoảng trắng khi khoảng cách thực sự lớn hơn độ rộng khoảng trắng (> 2.5pt)
          if (gap > 2.5 && !pageText.endsWith(" ") && !pageText.endsWith("\n") && !str.startsWith(" ")) {
            pageText += " ";
          }
        }

        pageText += str;
        lastX = currentX;
        lastY = currentY;
        lastWidth = item.width || 0;

        if (item.hasEOL && !pageText.endsWith("\n")) {
          pageText += "\n";
        }
      }
    }

    fullText += pageText + "\n\n";
  }

  return fullText.trim();
}
