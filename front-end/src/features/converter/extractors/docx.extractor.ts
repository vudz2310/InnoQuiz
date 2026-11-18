import mammoth from "mammoth";
import type { DocumentBlock, ExtractedImage, TextStyle } from "../types/converter.types";
import type { ReadDocumentProgress } from "../../../utils/fileDocumentReader";
import { decodeLegacyEncodedLineBreaks } from "../normalizers/legacy-linebreak.normalizer";

function createAssetId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function imageDimensions(dataUrl: string): Promise<{ width?: number; height?: number }> {
  if (typeof Image === "undefined") return Promise.resolve({});

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({});
    image.src = dataUrl;
  });
}

function extractNodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }
  if (node instanceof Element) {
    if (node.tagName.toLowerCase() === "img") {
      return "";
    }
    let res = "";
    for (const child of Array.from(node.childNodes)) {
      res += extractNodeText(child);
    }
    return res;
  }
  return "";
}

function extractElementStyle(el: Element): TextStyle {
  const tagName = el.tagName.toLowerCase();
  const hasBold = tagName === "strong" || tagName === "b" || el.querySelector("strong, b") !== null;
  const hasItalic = tagName === "em" || tagName === "i" || el.querySelector("em, i") !== null;
  const hasUnderline = tagName === "u" || el.querySelector("u") !== null;
  const hasMark = tagName === "mark" || el.querySelector("mark") !== null;

  return {
    bold: hasBold,
    italic: hasItalic,
    underline: hasUnderline,
    highlighted: hasMark,
  };
}

function parseHtmlFallback(html: string, fileName?: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  let order = 0;
  const tagRegex = /<(p|h[1-6]|li|table)[^>]*>(.*?)<\/\1>|<img[^>]+src=["']([^"']+)["'][^>]*>/gis;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    if (match[3]) {
      const src = match[3];
      blocks.push({
        id: createAssetId(),
        kind: "IMAGE",
        type: "IMAGE",
        image: {
          assetId: createAssetId(),
          originalName: fileName || "image",
          mimeType: src.match(/^data:([^;]+)/)?.[1] || "image/png",
          dataUrl: src,
          blockIndex: order,
          confidence: 0.95,
        },
        order,
        source: { fileName: fileName || "document.docx", blockIndex: order },
      });
      order += 1;
    } else {
      const tag = match[1]?.toLowerCase();
      const rawInner = match[2] || "";
      const text = rawInner.replace(/<[^>]+>/g, "").trim();
      const decoded = decodeLegacyEncodedLineBreaks(text);

      if (tag === "table") {
        if (decoded) {
          blocks.push({
            id: createAssetId(),
            kind: "TABLE",
            type: "TABLE",
            content: decoded,
            rawText: text,
            normalizedText: decoded,
            order,
            sourceName: fileName,
            source: { fileName: fileName || "document.docx", blockIndex: order },
          });
          order += 1;
        }
      } else if (decoded) {
        blocks.push({
          id: createAssetId(),
          kind: "TEXT",
          type: "TEXT",
          content: decoded,
          rawText: text,
          normalizedText: decoded,
          order,
          source: { fileName: fileName || "document.docx", blockIndex: order },
        });
        order += 1;
      }
    }
  }

  return blocks.length > 0
    ? blocks
    : [
        {
          id: createAssetId(),
          kind: "TEXT",
          type: "TEXT",
          content: decodeLegacyEncodedLineBreaks(html.replace(/<[^>]+>/g, "").trim()),
          order: 0,
          source: { fileName: fileName || "document.docx", blockIndex: 0 },
        },
      ];
}

export async function extractDocxBlocks(
  file: File,
  options?: { signal?: AbortSignal; onProgress?: (progress: ReadDocumentProgress) => void },
): Promise<DocumentBlock[]> {
  options?.signal?.throwIfAborted?.();

  options?.onProgress?.({
    stage: "extracting",
    current: 1,
    total: 3,
    percent: 15,
    message: "Đang đọc nội dung tệp Word...",
  });

  const arrayBuffer = await file.arrayBuffer();
  options?.signal?.throwIfAborted?.();

  options?.onProgress?.({
    stage: "extracting",
    current: 2,
    total: 3,
    percent: 40,
    message: "Đang phân tích cấu trúc văn bản...",
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  const buffer = typeof Buffer !== "undefined" ? Buffer.from(arrayBuffer) : undefined;
  const mammothOptions = {
    arrayBuffer,
    ...(buffer ? { buffer } : {}),
  } as unknown as { arrayBuffer: ArrayBuffer };

  const result = await mammoth.convertToHtml(mammothOptions, {
    ignoreEmptyParagraphs: false,
    convertImage: mammoth.images.imgElement(async (image) => {
      const base64 = await image.readAsBase64String();
      return {
        src: `data:${image.contentType};base64,${base64}`,
        "data-asset-id": createAssetId(),
      } as { src: string };
    }),
  });

  options?.signal?.throwIfAborted?.();

  if (typeof DOMParser === "undefined") {
    return parseHtmlFallback(result.value, file.name);
  }

  const document = new DOMParser().parseFromString(result.value, "text/html");
  const blocks: DocumentBlock[] = [];
  let order = 0;

  const children = Array.from(document.body.children);
  const totalChildren = children.length;

  // Thu thập và lấy kích thước hình ảnh song song thay vì tuần tự
  const allImgElements: HTMLImageElement[] = [];
  children.forEach((el) => {
    allImgElements.push(...Array.from(el.querySelectorAll("img")));
  });

  const dimensionsMap = new Map<string, { width?: number; height?: number }>();
  if (allImgElements.length > 0) {
    await Promise.all(
      allImgElements.map(async (imgEl) => {
        const src = imgEl.getAttribute("src");
        if (src && !dimensionsMap.has(src)) {
          const dims = await imageDimensions(src);
          dimensionsMap.set(src, dims);
        }
      }),
    );
  }

  for (let idx = 0; idx < totalChildren; idx++) {
    const el = children[idx];
    options?.signal?.throwIfAborted?.();

    if (idx % 100 === 0 && idx > 0) {
      options?.onProgress?.({
        stage: "extracting",
        current: idx,
        total: totalChildren,
        percent: Math.min(85, 40 + Math.round((idx / totalChildren) * 45)),
        message: `Đang xử lý đoạn văn bản ${idx} / ${totalChildren}...`,
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const tag = el.tagName.toLowerCase();
    const style = extractElementStyle(el);

    if (tag === "table") {
      const rawText = el.textContent || "";
      const decoded = decodeLegacyEncodedLineBreaks(rawText.trim());
      if (decoded) {
        // Thu thập dữ liệu bảng tableData
        const rows = Array.from(el.querySelectorAll("tr"));
        const tableData = rows.map((r) =>
          Array.from(r.querySelectorAll("td, th")).map((cell) => cell.textContent?.trim() || ""),
        );

        blocks.push({
          id: createAssetId(),
          kind: "TABLE",
          type: "TABLE",
          content: decoded,
          rawText,
          normalizedText: decoded,
          tableData,
          order,
          sourceName: file.name,
          source: {
            fileName: file.name,
            paragraphIndex: idx,
            tableIndex: order,
            blockIndex: order,
          },
        });
        order += 1;
      }
      continue;
    }

    // Nối các runs trong paragraph bằng '' (không chèn khoảng trắng sai vị trí)
    const rawText = extractNodeText(el);
    const decoded = decodeLegacyEncodedLineBreaks(rawText).trim();

    if (decoded) {
      blocks.push({
        id: createAssetId(),
        kind: "TEXT",
        type: "TEXT",
        content: decoded,
        rawText,
        normalizedText: decoded,
        style,
        order,
        source: {
          fileName: file.name,
          paragraphIndex: idx,
          blockIndex: order,
        },
      });
      order += 1;
    }

    // Trích xuất hình ảnh trong khối
    const imgElements = el.querySelectorAll("img");
    for (const imgEl of Array.from(imgElements)) {
      const dataUrl = imgEl.getAttribute("src") || undefined;
      if (!dataUrl) continue;
      const dimensions = dimensionsMap.get(dataUrl) || {};
      const image: ExtractedImage = {
        assetId: imgEl.getAttribute("data-asset-id") || createAssetId(),
        originalName: imgEl.getAttribute("alt") || file.name,
        mimeType: dataUrl.match(/^data:([^;]+)/)?.[1] || "image/png",
        dataUrl,
        ...dimensions,
        blockIndex: order,
        confidence: 0.95,
      };
      blocks.push({
        id: createAssetId(),
        kind: "IMAGE",
        type: "IMAGE",
        image,
        order,
        source: {
          fileName: file.name,
          paragraphIndex: idx,
          blockIndex: order,
        },
      });
      order += 1;
    }
  }

  options?.onProgress?.({
    stage: "extracting",
    current: totalChildren,
    total: totalChildren,
    percent: 85,
    message: "Đã trích xuất xong nội dung tệp Word, đang phân tích...",
  });

  return blocks.length > 0
    ? blocks
    : [
        {
          id: createAssetId(),
          kind: "TEXT",
          type: "TEXT",
          content: decodeLegacyEncodedLineBreaks(result.value.replace(/<[^>]+>/g, "").trim()),
          order: 0,
          source: { fileName: file.name, blockIndex: 0 },
        },
      ];
}
