import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFPageProxy, TextItem } from "pdfjs-dist/types/src/display/api";
import type { DocumentBlock, ExtractedImage } from "../types/converter.types";
import type { ReadDocumentProgress } from "../../../utils/fileDocumentReader";
import { decodeLegacyEncodedLineBreaks } from "../normalizers/legacy-linebreak.normalizer";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface RawPdfImageItem {
  width?: number;
  height?: number;
  data?: Uint8Array | Uint8ClampedArray;
  bitmap?: ImageBitmap;
}

interface PdfPageWithObjs extends Omit<PDFPageProxy, "commonObjs" | "objs"> {
  objs?: {
    has?: (id: string) => boolean;
    get?: {
      (id: string): unknown;
      (id: string, callback: (data: unknown) => void): void;
    };
  };
  commonObjs?: {
    has?: (id: string) => boolean;
    get?: (id: string) => unknown;
  };
}

function createAssetId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isTextItem(item: unknown): item is TextItem {
  return typeof item === "object" && item !== null && "str" in item && "transform" in item;
}

async function renderPageSnapshot(
  page: PDFPageProxy,
): Promise<{ url?: string; dataUrl?: string; width: number; height: number } | null> {
  if (typeof document === "undefined") return null;
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) return null;
  await page.render({ canvasContext: context, viewport }).promise;

  let url: string | undefined;
  if ("toBlob" in canvas) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) {
      url = URL.createObjectURL(blob);
    }
  }

  const dataUrl = canvas.toDataURL("image/png");

  const result = {
    url,
    dataUrl,
    width: viewport.width,
    height: viewport.height,
  };

  // Free canvas memory
  canvas.width = 0;
  canvas.height = 0;

  return result;
}

function multiplyMatrix(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

/**
 * Non-blocking conversion of PDF image objects into blob object URLs.
 */
async function convertPdfImg(imgData: unknown): Promise<{ url?: string; dataUrl?: string; width: number; height: number } | null> {
  if (typeof document === "undefined" || !imgData || typeof imgData !== "object") return null;
  const raw = imgData as RawPdfImageItem;
  const width = raw.width;
  const height = raw.height;
  if (!width || !height || width < 25 || height < 25) return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    if (typeof ImageBitmap !== "undefined" && raw.bitmap instanceof ImageBitmap) {
      ctx.drawImage(raw.bitmap, 0, 0);
    } else if (raw.data) {
      const src = raw.data;
      // 1. RGBA (4 channels)
      if (src.length === width * height * 4) {
        const imgObj = ctx.createImageData(width, height);
        imgObj.data.set(new Uint8ClampedArray(src.buffer, src.byteOffset, src.byteLength));
        ctx.putImageData(imgObj, 0, 0);
      } else if (src.length === width * height * 3) {
        // 2. RGB (3 channels)
        const imgObj = ctx.createImageData(width, height);
        const dest = imgObj.data;
        const total = width * height;
        for (let i = 0, s = 0, d = 0; i < total; i++, s += 3, d += 4) {
          dest[d] = src[s];
          dest[d + 1] = src[s + 1];
          dest[d + 2] = src[s + 2];
          dest[d + 3] = 255;
        }
        ctx.putImageData(imgObj, 0, 0);
      } else if (src.length === width * height) {
        // 3. Grayscale (1 channel)
        const imgObj = ctx.createImageData(width, height);
        const dest = imgObj.data;
        const total = width * height;
        for (let i = 0, d = 0; i < total; i++, d += 4) {
          const val = src[i];
          dest[d] = val;
          dest[d + 1] = val;
          dest[d + 2] = val;
          dest[d + 3] = 255;
        }
        ctx.putImageData(imgObj, 0, 0);
      } else {
        canvas.width = 0;
        canvas.height = 0;
        return null;
      }
    } else {
      canvas.width = 0;
      canvas.height = 0;
      return null;
    }

    let url: string | undefined;
    if ("toBlob" in canvas) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) {
        url = URL.createObjectURL(blob);
      }
    }

    const dataUrl = canvas.toDataURL("image/png");

    canvas.width = 0;
    canvas.height = 0;

    return { url, dataUrl, width, height };
  } catch (err) {
    console.warn("Lỗi chuyển đổi ảnh từ PDF sang canvas:", err);
    return null;
  }
}

/**
 * Fast lookup for image objects with tight 100ms timeout to avoid stalls.
 */
function getPdfImageObject(pageProxy: PDFPageProxy, objId: string): Promise<unknown> {
  if (!objId) return Promise.resolve(null);
  const page = pageProxy as PdfPageWithObjs;

  try {
    if (page.objs?.has?.(objId)) {
      const obj = page.objs.get?.(objId);
      if (obj) return Promise.resolve(obj);
    }
  } catch {}

  try {
    if (objId.startsWith("g_") && page.commonObjs?.has?.(objId)) {
      const obj = page.commonObjs.get?.(objId);
      if (obj) return Promise.resolve(obj);
    }
  } catch {}

  if (page.objs?.get) {
    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 100);

      try {
        if (page.objs?.get) {
          page.objs.get(objId, (data: unknown) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              resolve(data);
            }
          });
        } else {
          resolved = true;
          clearTimeout(timer);
          resolve(null);
        }
      } catch {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(null);
        }
      }
    });
  }

  return Promise.resolve(null);
}

/** Extract PDF text and embedded images interleaved in reading order. */
export async function extractPdfBlocks(
  file: File,
  options?: { signal?: AbortSignal; onProgress?: (progress: ReadDocumentProgress) => void },
): Promise<DocumentBlock[]> {
  options?.signal?.throwIfAborted?.();
  const data = await file.arrayBuffer();
  options?.signal?.throwIfAborted?.();

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  const blocks: DocumentBlock[] = [];
  let order = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    options?.signal?.throwIfAborted?.();

    options?.onProgress?.({
      stage: "extracting",
      current: pageNumber,
      total: pdf.numPages,
      percent: Math.min(85, Math.round(((pageNumber - 1) / pdf.numPages) * 85) + 5),
      message: `Đang xử lý trang ${pageNumber} / ${pdf.numPages}...`,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });

    const textContent = await page.getTextContent();
    const ops = await page.getOperatorList();

    // 1. Phân tích các lệnh vẽ ảnh trong OperatorList và tính tọa độ Y của ảnh
    const rawImages: { objId: string; topY: number; inlineData?: unknown }[] = [];
    let stack: number[][] = [];
    let ctm = [1, 0, 0, 1, 0, 0];
    const seenObjIds = new Set<string>();

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i];

      if (fn === pdfjsLib.OPS.save) {
        stack.push([...ctm]);
      } else if (fn === pdfjsLib.OPS.restore) {
        if (stack.length > 0) ctm = stack.pop()!;
      } else if (fn === pdfjsLib.OPS.transform) {
        ctm = multiplyMatrix(ctm, args);
      } else if (fn === pdfjsLib.OPS.paintImageXObject) {
        const objId = String(args[0]);
        const widthPt = Math.hypot(ctm[0], ctm[1]);
        const heightPt = Math.hypot(ctm[2], ctm[3]);
        if (widthPt >= 20 && heightPt >= 20 && !seenObjIds.has(objId)) {
          seenObjIds.add(objId);
          const topY = Math.max(0, viewport.height - (ctm[5] + Math.abs(ctm[3])));
          rawImages.push({ objId, topY });
        }
      } else if (fn === pdfjsLib.OPS.paintInlineImageXObject) {
        const inlineData = args[0];
        const widthPt = Math.hypot(ctm[0], ctm[1]);
        const heightPt = Math.hypot(ctm[2], ctm[3]);
        if (widthPt >= 20 && heightPt >= 20) {
          const topY = Math.max(0, viewport.height - (ctm[5] + Math.abs(ctm[3])));
          rawImages.push({ objId: `inline_${i}`, topY, inlineData });
        }
      }
    }

    // 2. Trích xuất dữ liệu ảnh song song
    const imagePromises = rawImages.map(async (rawImg) => {
      try {
        options?.signal?.throwIfAborted?.();
        const imgObj = rawImg.inlineData || (await getPdfImageObject(page, rawImg.objId));
        if (!imgObj) return null;

        const converted = await convertPdfImg(imgObj);
        if (!converted || (!converted.url && !converted.dataUrl)) return null;

        const extImg: ExtractedImage = {
          assetId: createAssetId(),
          originalName: `${file.name} - Trang ${pageNumber} (Ảnh ${rawImg.objId})`,
          mimeType: "image/png",
          url: converted.url,
          dataUrl: converted.dataUrl,
          width: converted.width,
          height: converted.height,
          page: pageNumber,
          blockIndex: 0,
          confidence: 0.95,
        };

        return {
          y: rawImg.topY,
          image: extImg,
          dedupeKey: `${rawImg.objId}-${converted.width}x${converted.height}-${Math.round(rawImg.topY)}`,
        };
      } catch {
        return null;
      }
    });

    const resolvedImages = await Promise.all(imagePromises);
    const seenAssetKeys = new Set<string>();
    const pageExtractedImages: { y: number; image: ExtractedImage }[] = [];

    for (const item of resolvedImages) {
      if (!item) continue;
      if (seenAssetKeys.has(item.dedupeKey)) continue;
      seenAssetKeys.add(item.dedupeKey);
      pageExtractedImages.push({ y: item.y, image: item.image });
    }

    // 3. Gom các mục văn bản theo từng dòng kèm tọa độ Y
    const textLines: { y: number; text: string; x: number }[] = [];
    let currentLineY: number | null = null;
    let currentLineText = "";
    let currentLineMinX = 0;
    let lastX: number | null = null;
    let lastWidth = 0;

    for (const item of textContent.items) {
      if (!isTextItem(item)) continue;
      if (!item.str && !item.hasEOL) continue;

      const itemY = Math.max(0, viewport.height - item.transform[5]);
      const currentX = item.transform[4] || 0;

      if (currentLineY === null || Math.abs(itemY - currentLineY) > 5) {
        if (currentLineText.trim()) {
          textLines.push({
            y: currentLineY ?? itemY,
            text: decodeLegacyEncodedLineBreaks(currentLineText.trim()),
            x: currentLineMinX,
          });
        }
        currentLineY = itemY;
        currentLineMinX = currentX;
        currentLineText = item.str;
      } else {
        const gap = currentX - (lastX !== null ? lastX + lastWidth : 0);
        if (gap > 2.5 && !currentLineText.endsWith(" ") && !item.str.startsWith(" ")) {
          currentLineText += " ";
        }
        currentLineText += item.str;
      }

      lastX = currentX;
      lastWidth = item.width || 0;

      if (item.hasEOL) {
        if (currentLineText.trim()) {
          textLines.push({
            y: currentLineY,
            text: decodeLegacyEncodedLineBreaks(currentLineText.trim()),
            x: currentLineMinX,
          });
        }
        currentLineY = null;
        currentLineText = "";
      }
    }
    if (currentLineText.trim() && currentLineY !== null) {
      textLines.push({
        y: currentLineY,
        text: decodeLegacyEncodedLineBreaks(currentLineText.trim()),
        x: currentLineMinX,
      });
    }

    // 4. Kết hợp văn bản và hình ảnh theo thứ tự Y từ trên xuống dưới
    if (pageExtractedImages.length > 0) {
      type MixedItem =
        | { type: "TEXT"; y: number; text: string; x: number }
        | { type: "IMAGE"; y: number; image: ExtractedImage };

      const mixedItems: MixedItem[] = [
        ...textLines.map((l): MixedItem => ({ type: "TEXT", y: l.y, text: l.text, x: l.x })),
        ...pageExtractedImages.map((img): MixedItem => ({ type: "IMAGE", y: img.y, image: img.image })),
      ].sort((a, b) => a.y - b.y);

      let textBuffer: string[] = [];

      const flushTextBuffer = () => {
        if (textBuffer.length > 0) {
          const content = textBuffer.join("\n").trim();
          if (content) {
            blocks.push({
              id: createAssetId(),
              kind: "TEXT",
              type: "TEXT",
              content,
              rawText: content,
              normalizedText: content,
              order,
              page: pageNumber,
              sourceName: file.name,
              source: {
                fileName: file.name,
                pageNumber,
                blockIndex: order,
              },
            });
            order += 1;
          }
          textBuffer = [];
        }
      };

      for (const item of mixedItems) {
        if (item.type === "TEXT") {
          textBuffer.push(item.text);
        } else {
          flushTextBuffer();
          blocks.push({
            id: createAssetId(),
            kind: "IMAGE",
            type: "IMAGE",
            image: { ...item.image, blockIndex: order },
            order,
            page: pageNumber,
            sourceName: file.name,
            source: {
              fileName: file.name,
              pageNumber,
              blockIndex: order,
            },
          });
          order += 1;
        }
      }
      flushTextBuffer();
    } else {
      const plainText = textLines.map((l) => l.text).join("\n").trim();
      if (plainText) {
        blocks.push({
          id: createAssetId(),
          kind: "TEXT",
          type: "TEXT",
          content: plainText,
          rawText: plainText,
          normalizedText: plainText,
          order,
          page: pageNumber,
          sourceName: file.name,
          source: {
            fileName: file.name,
            pageNumber,
            blockIndex: order,
          },
        });
        order += 1;
      } else {
        const snapshot = await renderPageSnapshot(page);
        if (snapshot) {
          const image: ExtractedImage = {
            assetId: createAssetId(),
            originalName: `${file.name} - Trang ${pageNumber}`,
            mimeType: "image/png",
            url: snapshot.url,
            dataUrl: snapshot.dataUrl,
            width: snapshot.width,
            height: snapshot.height,
            page: pageNumber,
            blockIndex: order,
            confidence: 0.3,
          };
          blocks.push({
            id: createAssetId(),
            kind: "IMAGE",
            type: "IMAGE",
            image,
            order,
            page: pageNumber,
            sourceName: file.name,
            source: {
              fileName: file.name,
              pageNumber,
              blockIndex: order,
            },
          });
          order += 1;
        }
      }
    }

    try {
      page.cleanup();
    } catch {}
  }

  options?.onProgress?.({
    stage: "extracting",
    current: pdf.numPages,
    total: pdf.numPages,
    percent: 85,
    message: `Đã đọc xong toàn bộ ${pdf.numPages} trang, đang phân tích cấu trúc...`,
  });

  return blocks;
}
