import {
  cleanQuestionText,
  cleanAnswerText,
  detectSectionHeader,
  isIgnorableMetaLine,
  splitMultiOptionsInLine,
} from "../../../utils/parsers/textNormalizer";
import {
  type ContentSegment,
  type ConverterResult,
  type ConverterWarning,
  type DocumentBlock,
  type DuplicateSectionCandidate,
  type ExtractedImage,
  type ImageDocumentBlock,
  type NormalizedMedia,
  type NormalizedOption,
  type NormalizedQuestion,
  type NormalizedQuiz,
  type NormalizedSection,
  type TextDocumentBlock,
  type DocumentParseAudit,
  type SourceOptionMarker,
  type OptionMode,
  PARSER_VERSION,
} from "../types/converter.types";
import {
  sanitizeControlCharacters,
  normalizeSectionTitle,
  normalizeTextFragment,
  decodeLegacyEncodedLineBreaks,
} from "../normalizers/text.normalizer";
import {
  looksLikeCodeStart,
  isCodeLine,
  calculateBraceDelta,
  detectLanguage,
  isOptionLine,
  ANCHORED_OPTION_LINE,
} from "../parsers/code-block.detector";

export { PARSER_VERSION };

interface SourcePosition {
  page?: number;
  blockIndex?: number;
}

interface RawCandidateLine {
  rawText: string;
  sanitized: string;
  source?: SourcePosition;
  blockId?: string;
  page?: number;
}

interface RawQuestionCandidate {
  tempId: string;
  sourceNumber?: number;
  source?: SourcePosition;
  sectionTitle: string;
  sectionOrder: number;
  lines: RawCandidateLine[];
  media: NormalizedMedia[];
  pendingMetadata?: {
    sourceNumber?: number;
    answerMode?: string;
  };
}

interface RawSectionCandidate {
  title: string;
  order: number;
  candidates: RawQuestionCandidate[];
}

// Regex patterns
const QUESTION_META_REGEX = /^\s*câu\s*(\d+)?\s*[:\s]*[\(\[]?\s*(một|nhiều)\s+đáp\s+án\s*[\)\]]?/i;
const EDU_H_REGEX = /^\s*(?:câu\s*(\d+)\s*[:\s]*)?H([A-Z])\s*\(?\s*(\d+)\s*\)?\s*[:=“"']?\s*(.*)$/i;
const EDU_T_REGEX = /^\s*(\*)?\s*T([A-Z])\s*\(?\s*(?:[A-Z],)?\s*(\d+)\s*[,.\s]+\s*(\d+)\s*\)?\s*[:=“"']?\s*(.*)$/i;
const QUESTION_START_REGEX = /^(?:câu\s*(?:hỏi\s*)?|question\s*|q\s*\.?\s*|bài\s*)0*(\d+)\s*[:.)-]?\s*(.*)$/i;
const NUMERIC_START_REGEX = /^(0*\d+)\s*([.):])\s+(.+)$/;
const ANSWER_KEY_REGEX = /^(?:đáp\s*án(?:\s*đúng)?|answer(?:\s*key)?|correct\s*answer|key|chọn)\s*[:.-]?\s*([A-Ha-h]|\d+)\b/i;
const INLINE_OPTION_REGEX = /(?:^|[\t ]{2,}|\s+)(?:(\\\*|\*|★|✔)\s*)?(?:\[([A-Ha-h])\]|\(([A-Ha-h])\)|([A-Ha-h])[.):-])(?:\s*(\\\*|\*|★|✔))?\s+(?=\S)/gi;

function createMedia(block: ImageDocumentBlock, order: number): NormalizedMedia {
  return {
    tempId: `media-${block.image.assetId}-${order}`,
    type: "IMAGE",
    assetId: block.image.assetId,
    order,
    originalName: block.image.originalName,
    mimeType: block.image.mimeType,
    dataUrl: block.image.dataUrl,
    url: block.image.url,
    width: block.image.width,
    height: block.image.height,
    confidence: block.image.confidence,
    source: {
      page: block.page ?? block.image.page,
      blockIndex: block.order,
    },
  };
}

/**
 * Detect inline options on a single line (e.g. "A. Option 1   B. Option 2   C. Option 3   D. Option 4").
 */
function extractInlineOptions(line: string): Array<{ label: string; content: string; starred: boolean }> | null {
  const rawMatches = [...line.matchAll(INLINE_OPTION_REGEX)];
  const matches = rawMatches.filter((m) => {
    const rawSep = m[0].trim().slice(-1);
    if (rawSep === ":") {
      const startIndex = (m.index ?? 0) + m[0].length;
      const afterText = line.slice(startIndex).trim();
      if (afterText.startsWith("/") || afterText.startsWith("\\")) {
        return false;
      }
    }
    return true;
  });
  if (matches.length < 2) return null;

  const labels: string[] = [];
  for (const m of matches) {
    const rawLabel = (m[2] || m[3] || m[4]).toUpperCase();
    labels.push(rawLabel);
  }

  const firstCharCode = labels[0].charCodeAt(0);
  if (firstCharCode < 65 || firstCharCode > 72) return null;

  for (let i = 1; i < labels.length; i++) {
    if (labels[i].charCodeAt(0) !== labels[i - 1].charCodeAt(0) + 1) {
      return null;
    }
  }

  const results: Array<{ label: string; content: string; starred: boolean }> = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const startIndex = (match.index ?? 0) + match[0].length;
    const endIndex = i + 1 < matches.length ? (matches[i + 1].index ?? line.length) : line.length;
    const content = cleanAnswerText(line.slice(startIndex, endIndex));
    const starred = Boolean(match[1] || match[5]);
    const label = labels[i];
    results.push({ label, content, starred });
  }

  return results;
}

/**
 * Nối các dòng văn xuôi thành một chuỗi duy nhất, không tạo khoảng trắng kép (Soft wrap).
 */
function joinProseLines(parts: string[]): string {
  let result = "";
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (!result) {
      result = trimmed;
    } else {
      result += " " + trimmed;
    }
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

/**
 * Phát hiện các phần thi bị trùng lặp trong tài liệu.
 */
export function detectDuplicateSections(sections: NormalizedSection[]): DuplicateSectionCandidate[] {
  const candidates: DuplicateSectionCandidate[] = [];
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, "");

  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const s1 = sections[i];
      const s2 = sections[j];
      if (s1.questions.length === 0 || s2.questions.length === 0) continue;

      const set1 = new Set(s1.questions.map((q) => normalize(q.content)).filter(Boolean));
      const set2 = new Set(s2.questions.map((q) => normalize(q.content)).filter(Boolean));
      if (set1.size === 0 || set2.size === 0) continue;

      let matchCount = 0;
      for (const fp of set1) {
        if (set2.has(fp)) matchCount++;
      }

      const similarity = matchCount / Math.min(set1.size, set2.size);
      if (similarity >= 0.7) {
        const s1HasKeys = s1.questions.some((q) => q.correctOptionIds.length > 0);
        const s2HasKeys = s2.questions.some((q) => q.correctOptionIds.length > 0);

        candidates.push({
          firstSectionId: s1.tempId,
          secondSectionId: s2.tempId,
          firstTitle: s1.title,
          secondTitle: s2.title,
          firstOrder: s1.order,
          secondOrder: s2.order,
          similarity,
          canMergeAnswers: (s1HasKeys && !s2HasKeys) || (!s1HasKeys && s2HasKeys),
          message: `Phát hiện "${s1.title}" và "${s2.title}" xuất hiện nhiều lần với nội dung giống nhau (${Math.round(similarity * 100)}%). ${s1HasKeys || s2HasKeys ? "Một bản có đánh dấu đáp án." : ""} Bạn có muốn gộp không?`,
        });
      }
    }
  }
  return candidates;
}

/**
 * ============================================================================
 * LƯỢT 1: THU THẬP KHỐI & PHÂN VÙNG CÂU HỎI (BLOCK & LINE PARTITIONING)
 * ============================================================================
 */
function partitionDocumentCandidates(
  orderedBlocks: DocumentBlock[],
  initialTitle?: string,
): {
  sections: RawSectionCandidate[];
  detectedTitle: string;
  unassignedImages: NormalizedMedia[];
  warnings: ConverterWarning[];
} {
  const sections: RawSectionCandidate[] = [];
  const warnings: ConverterWarning[] = [];
  let detectedTitle = initialTitle || "";

  let currentSectionTitle = "Phần 1";
  let currentSectionOrder = 1;
  let currentCandidate: RawQuestionCandidate | null = null;
  let pendingImages: NormalizedMedia[] = [];
  const unassignedImages: NormalizedMedia[] = [];
  let isPreamble = false;
  let pendingMetadata: { sourceNumber?: number; answerMode?: string } | null = null;

  const ensureSection = (title = currentSectionTitle): RawSectionCandidate => {
    let sec = sections.find((s) => s.title === title && s.order === currentSectionOrder);
    if (!sec) {
      sec = {
        title,
        order: sections.length + 1,
        candidates: [],
      };
      sections.push(sec);
    }
    return sec;
  };

  const flushCandidate = () => {
    if (!currentCandidate) return;
    const cand = currentCandidate;
    currentCandidate = null;

    if (cand.lines.length === 0 && cand.media.length === 0) {
      return;
    }
    const sec = ensureSection(cand.sectionTitle);
    sec.candidates.push(cand);
  };

  for (const block of orderedBlocks) {
    if (block.type === "IMAGE" && block.image) {
      const media = createMedia(block as ImageDocumentBlock, pendingImages.length);
      if (block.image.confidence !== undefined && block.image.confidence < 0.5) {
        unassignedImages.push(media);
      } else if (currentCandidate) {
        currentCandidate.media.push(media);
      } else {
        pendingImages.push(media);
      }
      continue;
    }

    if (block.type !== "TEXT" || !block.content) {
      continue;
    }

    const decoded = decodeLegacyEncodedLineBreaks(block.content);
    const sanitizedBlock = sanitizeControlCharacters(decoded);
    const lines = sanitizedBlock.split("\n");

    for (const rawLine of lines) {
      const sanitized = rawLine.trim();
      if (!sanitized) continue;

      // Preamble box (Hộp lưu ý)
      if (/^hộp\s*lưu\s*ý/i.test(sanitized)) {
        isPreamble = true;
        continue;
      }

      if (isPreamble) {
        const secCheck = detectSectionHeader(sanitized);
        if (secCheck.isSection) {
          isPreamble = false;
        } else {
          continue;
        }
      }

      // Ignore headers, footers, URLs, page numbers, EduQuiz header lines
      if (isIgnorableMetaLine(sanitized)) continue;
      if (/^https?:\/\/\S+/i.test(sanitized)) continue;
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}.*EduQuiz/i.test(sanitized)) continue;
      if (/^\d+\s*\/\s*\d+$/.test(sanitized)) continue;

      // Section Header (Phần 1, Phần MMT 1, Chương 2...)
      const secCheck = detectSectionHeader(sanitized);
      if (secCheck.isSection) {
        flushCandidate();
        currentSectionTitle = normalizeSectionTitle(secCheck.title);
        currentSectionOrder = sections.length + 1;
        ensureSection(currentSectionTitle);
        continue;
      }

      // EduQuiz Metadata line: Câu 1 (Một đáp án)
      const metaMatch = sanitized.match(QUESTION_META_REGEX);
      if (metaMatch) {
        flushCandidate();
        pendingMetadata = {
          sourceNumber: metaMatch[1] ? Number(metaMatch[1]) : undefined,
          answerMode: metaMatch[2],
        };
        continue;
      }

      // EduQuiz Question: HA(1)=... or Câu 1: HA(1)=...
      const eduHMatch = sanitized.match(EDU_H_REGEX);
      if (eduHMatch) {
        flushCandidate();
        const sourceNum = eduHMatch[1]
          ? Number(eduHMatch[1])
          : eduHMatch[3]
            ? Number(eduHMatch[3])
            : pendingMetadata?.sourceNumber;
        currentCandidate = {
          tempId: `cand-${currentSectionOrder}-${sections.length + 1}`,
          sourceNumber: sourceNum,
          source: { page: block.page, blockIndex: block.order },
          sectionTitle: currentSectionTitle,
          sectionOrder: currentSectionOrder,
          lines: [
            {
              rawText: eduHMatch[4],
              sanitized: eduHMatch[4],
              source: { page: block.page, blockIndex: block.order },
              blockId: block.id,
              page: block.page,
            },
          ],
          media: pendingImages,
          pendingMetadata: pendingMetadata || undefined,
        };
        pendingMetadata = null;
        pendingImages = [];
        continue;
      }

      // Explicit Question Start: Câu 1. ... or Câu 2: ...
      const qStartMatch = sanitized.match(QUESTION_START_REGEX);
      if (qStartMatch) {
        flushCandidate();
        const sourceNum = Number(qStartMatch[1]);
        currentCandidate = {
          tempId: `cand-${currentSectionOrder}-${sections.length + 1}`,
          sourceNumber: sourceNum,
          source: { page: block.page, blockIndex: block.order },
          sectionTitle: currentSectionTitle,
          sectionOrder: currentSectionOrder,
          lines: [
            {
              rawText: qStartMatch[2],
              sanitized: qStartMatch[2],
              source: { page: block.page, blockIndex: block.order },
              blockId: block.id,
              page: block.page,
            },
          ],
          media: pendingImages,
          pendingMetadata: pendingMetadata || undefined,
        };
        pendingMetadata = null;
        pendingImages = [];
        continue;
      }

      // Numeric Question Start: 1) ... or 94) ...
      const numStartMatch = sanitized.match(NUMERIC_START_REGEX);
      if (numStartMatch && !/^[A-Ha-h]\s*[.):-]/.test(sanitized) && !isOptionLine(sanitized)) {
        flushCandidate();
        const sourceNum = Number(numStartMatch[1]);
        currentCandidate = {
          tempId: `cand-${currentSectionOrder}-${sections.length + 1}`,
          sourceNumber: sourceNum,
          source: { page: block.page, blockIndex: block.order },
          sectionTitle: currentSectionTitle,
          sectionOrder: currentSectionOrder,
          lines: [
            {
              rawText: numStartMatch[3],
              sanitized: numStartMatch[3],
              source: { page: block.page, blockIndex: block.order },
              blockId: block.id,
              page: block.page,
            },
          ],
          media: pendingImages,
          pendingMetadata: pendingMetadata || undefined,
        };
        pendingMetadata = null;
        pendingImages = [];
        continue;
      }

      // Unnumbered question at section start: line ends with ? or :
      const currentSec = ensureSection(currentSectionTitle);
      if (currentSec.candidates.length === 0 && !currentCandidate) {
        if ((sanitized.includes("?") || sanitized.endsWith(":")) && !isOptionLine(sanitized)) {
          flushCandidate();
          currentCandidate = {
            tempId: `cand-${currentSectionOrder}-1`,
            sourceNumber: undefined,
            source: { page: block.page, blockIndex: block.order },
            sectionTitle: currentSectionTitle,
            sectionOrder: currentSectionOrder,
            lines: [
              {
                rawText: rawLine,
                sanitized,
                source: { page: block.page, blockIndex: block.order },
                blockId: block.id,
                page: block.page,
              },
            ],
            media: pendingImages,
            pendingMetadata: pendingMetadata || undefined,
          };
          pendingMetadata = null;
          pendingImages = [];
          continue;
        }
      }

      // If inside an active candidate, collect line
      if (currentCandidate) {
        currentCandidate.lines.push({
          rawText: rawLine,
          sanitized,
          source: { page: block.page, blockIndex: block.order },
          blockId: block.id,
          page: block.page,
        });
      } else {
        // Document title before question 1
        if (!detectedTitle || detectedTitle === initialTitle) {
          detectedTitle = sanitized;
        }
      }
    }
  }

  flushCandidate();

  return {
    sections,
    detectedTitle,
    unassignedImages,
    warnings,
  };
}

/**
 * ============================================================================
 * LƯỢT 2: PHÂN TÍCH CẤU TRÚC TỪNG CÂU HỎI (STRUCTURAL ANALYSIS & AUDIT)
 * ============================================================================
 */
function parseQuestionCandidate(
  candidate: RawQuestionCandidate,
  secOrder: number,
  qOrder: number,
): NormalizedQuestion {
  const lines = candidate.lines;

  // 1. Quét tìm tất cả explicit option markers trong toàn bộ dòng của candidate
  const sourceOptionMarkers: SourceOptionMarker[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lObj = lines[lineIdx];
    const text = lObj.sanitized;

    // a. EduQuiz option: *TA(1,1)=“A”
    const eduTMatch = text.match(EDU_T_REGEX);
    if (eduTMatch) {
      const optNum = Number(eduTMatch[4]);
      const label = String.fromCharCode(64 + optNum);
      sourceOptionMarkers.push({
        label,
        hasCorrectMarker: Boolean(eduTMatch[1]),
        lineIndex: lineIdx,
        rawMarker: eduTMatch[0],
        contentStart: eduTMatch[5],
        blockId: lObj.blockId,
      });
      continue;
    }

    // b. Inline multiple options: A. ... B. ... C. ... D. ...
    const inline = splitMultiOptionsInLine(text) || extractInlineOptions(text);
    if (inline && inline.length >= 2) {
      for (let inIdx = 0; inIdx < inline.length; inIdx++) {
        const item = inline[inIdx];
        const label = ("keyLetter" in item ? item.keyLetter : item.label).toUpperCase();
        const hasCorrect = "isCorrect" in item ? Boolean(item.isCorrect) : Boolean(item.starred);
        sourceOptionMarkers.push({
          label,
          hasCorrectMarker: hasCorrect,
          lineIndex: lineIdx,
          inlineIndex: inIdx,
          rawMarker: `${label}.`,
          contentStart: item.content,
          blockId: lObj.blockId,
        });
      }
      continue;
    }

    // c. Anchored option line: "A. Nội dung", "* A. ...", "B) ..."
    const lineOptMatch = text.match(ANCHORED_OPTION_LINE);
    if (lineOptMatch && !/^[A-Za-z]:\s*[/\\-]/.test(text)) {
      const label = (lineOptMatch[2] || lineOptMatch[3] || lineOptMatch[4]).toUpperCase();
      const hasStar = Boolean(lineOptMatch[1] || lineOptMatch[5]);
      const contentStart = text.slice(lineOptMatch[0].length);
      sourceOptionMarkers.push({
        label,
        hasCorrectMarker: hasStar,
        lineIndex: lineIdx,
        rawMarker: lineOptMatch[0],
        contentStart,
        blockId: lObj.blockId,
      });
      continue;
    }
  }

  // 2. Xác định OptionMode (LABELED, UNLABELED, hoặc NONE)
  let optionMode: OptionMode = "NONE";
  if (sourceOptionMarkers.length > 0) {
    optionMode = "LABELED";
  } else {
    // Kiểm tra unlabeled options: tìm dấu hỏi hoặc 2 chấm
    // Sau vị trí hỏi, bỏ qua code block và đếm các dòng non-code còn lại
    const qMarkIdx = lines.findIndex((l) => l.sanitized.includes("?") || l.sanitized.endsWith(":"));
    if (qMarkIdx >= 0 && qMarkIdx < lines.length - 1) {
      // Xác định vùng sau question mark: bỏ qua code block, đếm dòng non-code
      let codeBlockEnd = qMarkIdx + 1;
      let inCodeBlock = false;
      let braceCount = 0;

      for (let ci = qMarkIdx + 1; ci < lines.length; ci++) {
        const cLine = lines[ci].sanitized;
        if (!inCodeBlock && looksLikeCodeStart(cLine).isCode) {
          inCodeBlock = true;
          braceCount = calculateBraceDelta(cLine);
          codeBlockEnd = ci + 1;
          continue;
        }
        if (inCodeBlock) {
          braceCount += calculateBraceDelta(cLine);
          codeBlockEnd = ci + 1;
          if (braceCount <= 0) {
            inCodeBlock = false;
          }
          continue;
        }
        if (isCodeLine(cLine)) {
          codeBlockEnd = ci + 1;
          continue;
        }
        // Dòng này là non-code, dừng codeBlockEnd
        break;
      }

      // Đếm các dòng non-code sau code block
      const nonCodeLines: number[] = [];
      for (let ci = codeBlockEnd; ci < lines.length; ci++) {
        const cLine = lines[ci].sanitized;
        if (!isCodeLine(cLine) && !looksLikeCodeStart(cLine).isCode) {
          nonCodeLines.push(ci);
        }
      }

      // Cũng đếm nếu không có code block (trường hợp đơn giản)
      if (codeBlockEnd === qMarkIdx + 1) {
        // Không tìm thấy code block, đếm tất cả dòng remaining
        const remainingCount = lines.length - (qMarkIdx + 1);
        if (remainingCount >= 2 && remainingCount <= 6) {
          optionMode = "UNLABELED";
        }
      } else if (nonCodeLines.length >= 2 && nonCodeLines.length <= 6) {
        // Sau code block, có 2-6 dòng non-code: đây là unlabeled options
        optionMode = "UNLABELED";
      }
    }
  }

  let finalContent = "";
  const contentSegments: ContentSegment[] = [];
  let normalizedOptions: NormalizedOption[] = [];
  const explicitAnswerKeys: string[] = [];

  // ============================================================================
  // PARSE THEO CHẾ ĐỘ LABELED
  // ============================================================================
  if (optionMode === "LABELED") {
    const firstOptionLineIndex = sourceOptionMarkers[0].lineIndex;

    // Phân tích Question Stem & Code block trước option đầu tiên
    const textLines: string[] = [];
    const codeLines: string[] = [];
    let inCode = false;
    let braceDepth = 0;
    let codeLanguage: string | undefined;

    for (let i = 0; i < firstOptionLineIndex; i++) {
      const lObj = lines[i];
      const line = lObj.sanitized;
      const raw = lObj.rawText;

      const codeStart = looksLikeCodeStart(line);
      if (!inCode && (codeStart.isCode || (line === "{" && textLines.length > 0))) {
        inCode = true;
        codeLanguage = codeStart.language;
        braceDepth = calculateBraceDelta(line);
        codeLines.push(raw);
        continue;
      }

      if (inCode) {
        braceDepth += calculateBraceDelta(line);
        codeLines.push(raw);
        if (braceDepth <= 0 && codeLines.length > 0) {
          inCode = false;
        }
        continue;
      }

      if (isCodeLine(line)) {
        codeLines.push(raw);
        continue;
      }

      textLines.push(line);
    }

    const stemText = cleanQuestionText(normalizeTextFragment(joinProseLines(textLines)));
    const codeRaw = codeLines.join("\n").trim();
    if (codeRaw && !codeLanguage) {
      codeLanguage = detectLanguage(codeRaw);
    }

    if (stemText) {
      contentSegments.push({
        id: `seg-text-${secOrder}-${qOrder}`,
        type: "TEXT",
        rawContent: textLines.join(" "),
        normalizedContent: stemText,
      });
    }

    if (codeRaw) {
      contentSegments.push({
        id: `seg-code-${secOrder}-${qOrder}`,
        type: "CODE",
        rawContent: codeRaw,
        normalizedContent: codeRaw,
        language: codeLanguage,
        preserveWhitespace: true,
      });
    }

    finalContent = stemText && codeRaw ? `${stemText}\n\n${codeRaw}` : stemText || codeRaw;

    // Bóc tách Options và ghép các dòng continuation (Soft wrap)
    interface MutableOptAcc {
      label: string;
      hasStar: boolean;
      contentParts: string[];
      isCode: boolean;
      blockIds: string[];
    }
    const parsedOptions: MutableOptAcc[] = [];
    let currentOpt: MutableOptAcc | null = null;

    for (let i = firstOptionLineIndex; i < lines.length; i++) {
      const lObj = lines[i];
      const line = lObj.sanitized;
      const raw = lObj.rawText;

      // 1. Explicit Answer Key
      const keyMatch = line.match(ANSWER_KEY_REGEX);
      if (keyMatch) {
        if (currentOpt) {
          parsedOptions.push(currentOpt);
          currentOpt = null;
        }
        explicitAnswerKeys.push(keyMatch[1]);
        continue;
      }

      // 2. EduQuiz Option
      const eduT = line.match(EDU_T_REGEX);
      if (eduT) {
        if (currentOpt) parsedOptions.push(currentOpt);
        const optNum = Number(eduT[4]);
        const label = String.fromCharCode(64 + optNum);
        currentOpt = {
          label,
          hasStar: Boolean(eduT[1]),
          contentParts: [eduT[5]],
          isCode: false,
          blockIds: [lObj.blockId].filter((b): b is string => Boolean(b)),
        };
        continue;
      }

      // 3. Inline Options
      const inlineOpts = splitMultiOptionsInLine(line) || extractInlineOptions(line);
      if (inlineOpts && inlineOpts.length >= 2) {
        if (currentOpt) {
          parsedOptions.push(currentOpt);
          currentOpt = null;
        }
        for (const inOpt of inlineOpts) {
          const label = ("keyLetter" in inOpt ? inOpt.keyLetter : inOpt.label).toUpperCase();
          const hasStar = "isCorrect" in inOpt ? Boolean(inOpt.isCorrect) : Boolean(inOpt.starred);
          parsedOptions.push({
            label,
            hasStar,
            contentParts: [inOpt.content],
            isCode: false,
            blockIds: [lObj.blockId].filter((b): b is string => Boolean(b)),
          });
        }
        continue;
      }

      // 4. Anchored Option Line
      const lineOptMatch = line.match(ANCHORED_OPTION_LINE);
      if (lineOptMatch && !/^[A-Za-z]:\s*[/\\-]/.test(line)) {
        if (currentOpt) parsedOptions.push(currentOpt);
        const label = (lineOptMatch[2] || lineOptMatch[3] || lineOptMatch[4]).toUpperCase();
        const hasStar = Boolean(lineOptMatch[1] || lineOptMatch[5]);
        const contentStart = line.slice(lineOptMatch[0].length);
        currentOpt = {
          label,
          hasStar,
          contentParts: [contentStart],
          isCode: false,
          blockIds: [lObj.blockId].filter((b): b is string => Boolean(b)),
        };
        continue;
      }

      // 5. Dòng kế tiếp (Continuation Line) - Nối vào option hiện tại, tuyệt đối KHÔNG tạo option mới
      if (currentOpt) {
        if (isCodeLine(line) || looksLikeCodeStart(line).isCode) {
          currentOpt.isCode = true;
          currentOpt.contentParts.push(raw);
        } else {
          currentOpt.contentParts.push(line);
        }
      }
    }

    if (currentOpt) {
      parsedOptions.push(currentOpt);
    }

    normalizedOptions = parsedOptions.map((opt, idx) => {
      const content = opt.isCode
        ? opt.contentParts.join("\n").trim()
        : cleanAnswerText(normalizeTextFragment(joinProseLines(opt.contentParts)));

      return {
        id: `opt-${secOrder}-${qOrder}-${idx + 1}`,
        label: opt.label,
        content,
        isCorrect: opt.hasStar ? true : null,
        evidence: opt.hasStar
          ? [
              {
                type: "STAR_PREFIX",
                sourceBlockId: opt.blockIds[0] || `q-${secOrder}-${qOrder}`,
                confidence: 0.95,
              },
            ]
          : [],
        media: [],
      };
    });
  }

  // ============================================================================
  // PARSE THEO CHẾ ĐỘ UNLABELED
  // ============================================================================
  else if (optionMode === "UNLABELED") {
    const qMarkIdx = lines.findIndex((l) => l.sanitized.includes("?") || l.sanitized.endsWith(":"));
    const splitIndex = qMarkIdx >= 0 ? qMarkIdx : 0;

    // Tách stem (text + code block nếu có) khỏi option lines (non-code sau code block)
    const textStemLines: string[] = [];
    const codeStemLines: string[] = [];
    let inCode = false;
    let braceDepth = 0;
    let codeLanguage: string | undefined;
    let codeBlockFinished = false;
    const rawOptionLines: string[] = [];

    // Dòng 0..splitIndex: question stem text
    for (let i = 0; i <= splitIndex; i++) {
      textStemLines.push(lines[i].sanitized);
    }

    // Dòng splitIndex+1..end: code block + unlabeled options
    for (let i = splitIndex + 1; i < lines.length; i++) {
      const line = lines[i].sanitized;
      const raw = lines[i].rawText;

      if (codeBlockFinished) {
        // Sau khi code block kết thúc, tất cả dòng non-code là option
        rawOptionLines.push(line);
        continue;
      }

      const codeStart = looksLikeCodeStart(line);
      if (!inCode && (codeStart.isCode || (line === "{" && codeStemLines.length > 0))) {
        inCode = true;
        codeLanguage = codeStart.language;
        braceDepth = calculateBraceDelta(line);
        codeStemLines.push(raw);
        continue;
      }

      if (inCode) {
        braceDepth += calculateBraceDelta(line);
        codeStemLines.push(raw);
        if (braceDepth <= 0 && codeStemLines.length > 0) {
          inCode = false;
          codeBlockFinished = true;
        }
        continue;
      }

      if (isCodeLine(line)) {
        codeStemLines.push(raw);
        continue;
      }

      // Dòng non-code và không trong code block: option
      rawOptionLines.push(line);
    }

    // Build question content
    const stemText = cleanQuestionText(normalizeTextFragment(joinProseLines(textStemLines)));
    const codeRaw = codeStemLines.join("\n").trim();
    if (codeRaw && !codeLanguage) {
      codeLanguage = detectLanguage(codeRaw);
    }

    if (stemText) {
      contentSegments.push({
        id: `seg-text-${secOrder}-${qOrder}`,
        type: "TEXT",
        rawContent: textStemLines.join(" "),
        normalizedContent: stemText,
      });
    }

    if (codeRaw) {
      contentSegments.push({
        id: `seg-code-${secOrder}-${qOrder}`,
        type: "CODE",
        rawContent: codeRaw,
        normalizedContent: codeRaw,
        language: codeLanguage,
        preserveWhitespace: true,
      });
    }

    finalContent = stemText && codeRaw ? `${stemText}\n\n${codeRaw}` : stemText || codeRaw;

    normalizedOptions = rawOptionLines.map((lineText, idx) => {
      const isStarred = /^(?:\\?\*|★|✔)\s*/.test(lineText);
      const cleanContent = cleanAnswerText(normalizeTextFragment(lineText.replace(/^(?:\\?\*|★|✔)\s*/, "")));
      const label = String.fromCharCode(65 + idx);
      return {
        id: `opt-${secOrder}-${qOrder}-${idx + 1}`,
        label,
        content: cleanContent,
        isCorrect: isStarred ? true : null,
        evidence: isStarred
          ? [
              {
                type: "STAR_PREFIX",
                sourceBlockId: `seg-text-${secOrder}-${qOrder}`,
                confidence: 0.95,
              },
            ]
          : [],
        media: [],
      };
    });
  }

  // ============================================================================
  // PARSE THEO CHẾ ĐỘ NONE
  // ============================================================================
  else {
    const allText = lines.map((l) => l.sanitized);
    finalContent = cleanQuestionText(normalizeTextFragment(joinProseLines(allText)));
    if (finalContent) {
      contentSegments.push({
        id: `seg-text-${secOrder}-${qOrder}`,
        type: "TEXT",
        rawContent: allText.join(" "),
        normalizedContent: finalContent,
      });
    }
  }

  // ============================================================================
  // QUY TẮC MAPPING ĐÁP ÁN ĐÚNG & XÁC THỰC TOÀN CỤC
  // ============================================================================
  if (explicitAnswerKeys.length > 0) {
    for (const key of explicitAnswerKeys) {
      const trimmed = key.trim().toUpperCase();
      const target = normalizedOptions.find((o) => o.label === trimmed);
      if (target) {
        target.isCorrect = true;
      }
    }
  }

  const correctCount = normalizedOptions.filter((o) => o.isCorrect === true).length;
  const isSingleChoice = candidate.pendingMetadata?.answerMode !== "Nhiều đáp án";

  let parseStatus: NormalizedQuestion["parseStatus"] = "VALID";
  let answerStatus: NormalizedQuestion["answerStatus"] = "DETECTED";
  const warnings: string[] = [];

  // Đối chiếu marker nguồn với kết quả (Rule 4)
  if (optionMode === "LABELED") {
    if (sourceOptionMarkers.length !== normalizedOptions.length) {
      parseStatus = "NEEDS_REVIEW";
      warnings.push(
        `Số lượng đáp án (${normalizedOptions.length}) không khớp với số lượng marker nguồn (${sourceOptionMarkers.length}).`,
      );
    }

    // Kiểm tra option thừa (ngoài A-D)
    if (
      normalizedOptions.length > 4 ||
      normalizedOptions.some((o) => !["A", "B", "C", "D"].includes(o.label))
    ) {
      parseStatus = "NEEDS_REVIEW";
      warnings.push("Phát hiện lựa chọn thừa (ngoài A-D).");
    }

    // Kiểm tra trùng nhãn
    const labelSet = new Set(normalizedOptions.map((o) => o.label));
    if (labelSet.size < normalizedOptions.length) {
      parseStatus = "NEEDS_REVIEW";
      warnings.push("Phát hiện nhãn lựa chọn bị trùng lặp.");
    }

    // Kiểm tra nhảy nhãn
    for (let i = 0; i < normalizedOptions.length; i++) {
      if (normalizedOptions[i].label !== String.fromCharCode(65 + i)) {
        parseStatus = "NEEDS_REVIEW";
        warnings.push("Phát hiện nhãn lựa chọn không liên tục.");
        break;
      }
    }

    // Kiểm tra mảnh câu ngắn bất thường
    // Cho phép các đáp án ngắn hợp lệ: số, phần trăm, phương trình, nhãn đường đi, đáp án đơn ký tự
    const hasSuspiciousShort = normalizedOptions.some((o) => {
      const text = o.content.trim();
      if (text.length >= 20) return false;
      // Đáp án số, phần trăm, phương trình ngắn là hợp lệ
      if (/^(đúng|sai|true|false|yes|no)$/i.test(text)) return false;
      if (/^-?[\d.,]+%?$/.test(text)) return false; // Số hoặc phần trăm: "80%", "0", "92,5%", "-1.0"
      if (/^[A-Za-z_]+=.+$/.test(text)) return false; // Phương trình: "h=119", "s=6", "S=6000"
      if (/^[A-Z](-[A-Z])+(-[A-Z])?$/.test(text)) return false; // Nhãn đường đi: "K-E-F", "C-F", "C-D-F"
      if (/^[A-Z]$/.test(text) && normalizedOptions.every((opt) => /^[A-Z]$/.test(opt.content.trim()))) return false; // Tất cả đáp án đều là 1 chữ cái
      return (
        /^(địa chỉ|này sẽ|định thì|thông qua|lý yêu cầu|trong một|cho mình|cấp phát)/i.test(text) ||
        text.length < 3
      );
    });
    if (hasSuspiciousShort) {
      parseStatus = "NEEDS_REVIEW";
      warnings.push("Phát hiện lựa chọn có độ dài ngắn bất thường (nghi ngờ là mảnh câu).");
    }
  }

  // Xung đột nhiều đáp án đúng trên câu hỏi 1 đáp án (Rule 7)
  if (isSingleChoice && correctCount > 1) {
    answerStatus = "AMBIGUOUS";
    parseStatus = "NEEDS_REVIEW";
    warnings.push("Phát hiện nhiều đáp án đúng trên câu hỏi đơn lựa chọn.");
    normalizedOptions.forEach((o) => {
      o.isCorrect = null;
    });
  } else if (correctCount === 1) {
    answerStatus = "DETECTED";
    normalizedOptions.forEach((o) => {
      if (o.isCorrect !== true) o.isCorrect = false;
    });
  } else {
    answerStatus = "MISSING";
  }

  if (normalizedOptions.length < 2 && optionMode !== "NONE") {
    parseStatus = "NEEDS_REVIEW";
    warnings.push("Câu hỏi có ít hơn 2 lựa chọn.");
  }

  if (!finalContent && candidate.media.length === 0) {
    parseStatus = "INVALID";
    warnings.push("Câu hỏi không có nội dung hoặc hình ảnh.");
  }

  const correctOptionIds = normalizedOptions.filter((o) => o.isCorrect === true).map((o) => o.id);

  return {
    tempId: `q-${secOrder}-${qOrder}`,
    sourceNumber: candidate.sourceNumber,
    order: qOrder,
    content: finalContent,
    contentSegments,
    type:
      normalizedOptions.length === 2 &&
      normalizedOptions.every((o) => /^(đúng|sai|true|false)$/i.test(o.content))
        ? "TRUE_FALSE"
        : "MULTIPLE_CHOICE",
    points: 1,
    options: normalizedOptions,
    media: candidate.media.map((m, mIdx) => ({ ...m, order: mIdx })),
    correctOptionIds,
    answerDetected: answerStatus === "DETECTED",
    status: parseStatus === "VALID" ? "VALID" : parseStatus,
    parseStatus,
    answerStatus,
    confidence: parseStatus === "VALID" ? 1.0 : 0.7,
    warnings,
    source: candidate.source,
    optionMode,
    sourceOptionMarkers,
  };
}

/**
 * ============================================================================
 * CONVERT DOCUMENT BLOCKS (CHÍNH - 2 LƯỢT TOÀN DIỆN)
 * ============================================================================
 */
export function convertDocumentBlocks(
  blocks: DocumentBlock[],
  initialTitle?: string,
): ConverterResult {
  const orderedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  // Lượt 1: Phân vùng khối thành Raw Candidates
  const partition = partitionDocumentCandidates(orderedBlocks, initialTitle);

  // Lượt 2: Phân tích cấu trúc từng câu hỏi
  const sections: NormalizedSection[] = [];
  const allParsedQuestions: NormalizedQuestion[] = [];

  for (const rawSec of partition.sections) {
    const parsedQuestions: NormalizedQuestion[] = [];
    for (let i = 0; i < rawSec.candidates.length; i++) {
      const q = parseQuestionCandidate(rawSec.candidates[i], rawSec.order, i + 1);
      parsedQuestions.push(q);
      allParsedQuestions.push(q);
    }

    if (parsedQuestions.length > 0) {
      sections.push({
        tempId: `sec-${rawSec.order}`,
        title: rawSec.title,
        order: rawSec.order,
        questions: parsedQuestions,
      });
    }
  }

  // Tính toán Audit tự động toàn tài liệu (Rule 8)
  const audit: DocumentParseAudit = {
    totalQuestions: allParsedQuestions.length,
    questionsWithExtraOptions: 0,
    questionsWithMissingOptions: 0,
    questionsWithDuplicateLabels: 0,
    questionsWithLabelGaps: 0,
    singleChoiceWithMultipleCorrectAnswers: 0,
    orphanContinuationBlocks: 0,
    sourceMarkerMismatchCount: 0,
  };

  for (const q of allParsedQuestions) {
    if (q.options.length > 4 || q.options.some((o) => !["A", "B", "C", "D"].includes(o.label))) {
      audit.questionsWithExtraOptions++;
    }
    if (q.options.length < 2) {
      audit.questionsWithMissingOptions++;
    }
    const labels = q.options.map((o) => o.label);
    if (new Set(labels).size < labels.length) {
      audit.questionsWithDuplicateLabels++;
    }
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] !== String.fromCharCode(65 + i)) {
        audit.questionsWithLabelGaps++;
        break;
      }
    }
    const correctCount = q.options.filter((o) => o.isCorrect === true).length;
    if (correctCount > 1) {
      audit.singleChoiceWithMultipleCorrectAnswers++;
    }
    if (q.sourceOptionMarkers && q.sourceOptionMarkers.length !== q.options.length) {
      audit.sourceMarkerMismatchCount++;
    }
  }

  // Development Logging
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== "test") {
    console.log(`[Universal Quiz Converter v${PARSER_VERSION} Audit]`);
    console.log(`- Tổng câu hỏi: ${audit.totalQuestions}`);
    console.log(`- Số câu có option thừa: ${audit.questionsWithExtraOptions}`);
    console.log(`- Số câu thiếu option: ${audit.questionsWithMissingOptions}`);
    console.log(`- Số câu trùng nhãn: ${audit.questionsWithDuplicateLabels}`);
    console.log(`- Số câu nhảy nhãn: ${audit.questionsWithLabelGaps}`);
    console.log(`- Số câu một đáp án nhưng có nhiều key: ${audit.singleChoiceWithMultipleCorrectAnswers}`);
    console.log(`- Số câu không khớp source marker: ${audit.sourceMarkerMismatchCount}`);
  }

  const duplicateSections = detectDuplicateSections(sections);
  const validCount = allParsedQuestions.filter((q) => q.parseStatus === "VALID").length;
  const waitingCount = allParsedQuestions.filter(
    (q) => q.parseStatus === "VALID" && q.answerStatus === "MISSING",
  ).length;
  const reviewCount = allParsedQuestions.filter((q) => q.parseStatus === "NEEDS_REVIEW").length;
  const invalidCount = allParsedQuestions.filter((q) => q.parseStatus === "INVALID").length;

  const normalized: NormalizedQuiz = {
    parserVersion: PARSER_VERSION,
    title: partition.detectedTitle,
    sections,
    unassignedMedia: partition.unassignedImages,
    warnings: partition.warnings,
    duplicateSections,
    audit,
    statistics: {
      totalSections: sections.length,
      totalQuestions: allParsedQuestions.length,
      totalImages:
        allParsedQuestions.reduce(
          (acc, q) =>
            acc +
            q.media.length +
            q.options.reduce((oAcc, o) => oAcc + o.media.length, 0),
          0,
        ),
      validQuestions: validCount,
      waitingAnswerQuestions: waitingCount,
      needsReviewQuestions: reviewCount,
      invalidQuestions: invalidCount,
    },
  };

  return {
    parserVersion: PARSER_VERSION,
    normalized,
    blocks: orderedBlocks,
    sourceText: orderedBlocks
      .filter((b): b is TextDocumentBlock => b.type === "TEXT")
      .map((b) => b.content)
      .join("\n"),
    audit,
  };
}

export function textToDocumentBlocks(
  text: string,
  availableImages: (ExtractedImage | DocumentBlock)[] = [],
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  const placeholderRegex = /(\{\s*(?:ảnh|anh|hình\s*ảnh|hinh\s*anh|image)\s*\}|\[\s*(?:ảnh|anh|hình\s*ảnh|hinh\s*anh|image)\s*\])/gi;

  const images: ExtractedImage[] = [];
  for (const item of availableImages) {
    if ("type" in item) {
      if (item.type === "IMAGE" && item.image) {
        images.push(item.image);
      }
    } else {
      images.push(item);
    }
  }

  let imageIdx = 0;
  let order = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = placeholderRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      blocks.push({
        id: `blk-${order}`,
        kind: "TEXT",
        type: "TEXT",
        content: textBefore,
        order: order++,
      });
    }

    const imgData = images[imageIdx];
    imageIdx++;

    if (imgData) {
      blocks.push({
        id: `blk-${order}`,
        kind: "IMAGE",
        type: "IMAGE",
        image: imgData,
        order: order++,
      });
    } else {
      blocks.push({
        id: `blk-${order}`,
        kind: "TEXT",
        type: "TEXT",
        content: match[0],
        order: order++,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  const remainingText = text.slice(lastIndex);
  if (remainingText.trim() || blocks.length === 0) {
    blocks.push({
      id: `blk-${order}`,
      kind: "TEXT",
      type: "TEXT",
      content: remainingText,
      order: order++,
    });
  }

  return blocks;
}

export function convertText(
  text: string,
  title?: string,
  availableImages: (ExtractedImage | DocumentBlock)[] = [],
): ConverterResult {
  const blocks = textToDocumentBlocks(text, availableImages);
  return convertDocumentBlocks(blocks, title);
}
