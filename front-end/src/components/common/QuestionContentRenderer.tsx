import React from "react";
import { Image as ImageIcon, Code2 } from "lucide-react";
import { getMediaUrl } from "../../utils/media";
import type { ContentSegment } from "../../features/converter/types/converter.types";

interface QuestionContentRendererProps {
  content: string;
  contentSegments?: ContentSegment[];
  className?: string;
  imageClassName?: string;
}

function renderTextWithImages(
  text: string,
  imageClassName: string,
): React.ReactNode[] {
  if (!text) return [];

  const regex =
    /(<img\s+[^>]*src="([^"]+)"[^>]*\/?>|<(?:Ảnh|Hình|Image)\s*(\d+)?>|\[(?:Ảnh|Hình|Image|ảnh|hình|image)\s*(\d+)?\]|\{(?:ảnh|anh|hình\s*ảnh|hinh\s*anh|image|Ảnh|Hình|Image)\s*(\d+)?\})/gi;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-line">
          {text.substring(lastIndex, match.index)}
        </span>,
      );
    }

    if (match[2]) {
      parts.push(
        <div
          key={`img-${match.index}`}
          className="my-3 flex justify-center sm:justify-start"
        >
          <img
            src={getMediaUrl(match[2])}
            alt="Hình minh họa câu hỏi"
            className={`max-h-72 max-w-full rounded-2xl object-contain border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-1.5 ${imageClassName}`}
            loading="lazy"
          />
        </div>,
      );
    } else {
      const imgNumber = match[3] || match[4] || match[5];
      parts.push(
        <div
          key={`ph-${match.index}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold my-1"
        >
          <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>[Hình minh họa: {imgNumber ? `Ảnh ${imgNumber}` : "Hình ảnh"}]</span>
        </div>,
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`} className="whitespace-pre-line">
        {text.substring(lastIndex)}
      </span>,
    );
  }

  return parts;
}

export const QuestionContentRenderer: React.FC<QuestionContentRendererProps> = ({
  content,
  contentSegments,
  className = "",
  imageClassName = "",
}) => {
  if (!content && (!contentSegments || contentSegments.length === 0)) {
    return null;
  }

  // 1. If explicit contentSegments are provided, render them structurally
  if (contentSegments && contentSegments.length > 0) {
    return (
      <div className={`space-y-2.5 leading-relaxed break-words ${className}`}>
        {contentSegments.map((seg, idx) => {
          if (seg.type === "CODE") {
            return (
              <div key={seg.id || idx} className="my-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 text-[11px] font-mono rounded-t-lg border-t border-x border-slate-700 w-fit">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{seg.language || "Code"}</span>
                </div>
                <pre className="p-3.5 rounded-b-xl rounded-tr-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
                  <code className="block whitespace-pre">
                    {seg.normalizedContent || seg.rawContent}
                  </code>
                </pre>
              </div>
            );
          }

          if (seg.type === "IMAGE") {
            const src = seg.normalizedContent || seg.rawContent;
            return (
              <div key={seg.id || idx} className="my-3 flex justify-center sm:justify-start">
                <img
                  src={getMediaUrl(src)}
                  alt="Hình minh họa"
                  className={`max-h-72 max-w-full rounded-2xl object-contain border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-1.5 ${imageClassName}`}
                  loading="lazy"
                />
              </div>
            );
          }

          return (
            <div key={seg.id || idx}>
              {renderTextWithImages(seg.normalizedContent || seg.rawContent, imageClassName)}
            </div>
          );
        })}
      </div>
    );
  }

  // 2. Fallback: Parse markdown code blocks in raw content if any
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  if (codeBlockRegex.test(content)) {
    codeBlockRegex.lastIndex = 0;
    const pieces: React.ReactNode[] = [];
    let curIdx = 0;
    let cbMatch: RegExpExecArray | null;

    while ((cbMatch = codeBlockRegex.exec(content)) !== null) {
      if (cbMatch.index > curIdx) {
        pieces.push(
          <div key={`txt-${curIdx}`}>
            {renderTextWithImages(content.substring(curIdx, cbMatch.index), imageClassName)}
          </div>,
        );
      }

      const lang = cbMatch[1] || "Code";
      const code = cbMatch[2];
      pieces.push(
        <div key={`code-${cbMatch.index}`} className="my-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 text-[11px] font-mono rounded-t-lg border-t border-x border-slate-700 w-fit">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang}</span>
          </div>
          <pre className="p-3.5 rounded-b-xl rounded-tr-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-inner">
            <code className="block whitespace-pre">{code}</code>
          </pre>
        </div>,
      );
      curIdx = codeBlockRegex.lastIndex;
    }

    if (curIdx < content.length) {
      pieces.push(
        <div key={`txt-${curIdx}`}>
          {renderTextWithImages(content.substring(curIdx), imageClassName)}
        </div>,
      );
    }

    return (
      <div className={`space-y-2.5 leading-relaxed break-words ${className}`}>
        {pieces}
      </div>
    );
  }

  // 3. Standard text rendering
  return (
    <div className={`space-y-2.5 leading-relaxed break-words ${className}`}>
      {renderTextWithImages(content, imageClassName)}
    </div>
  );
};

export default QuestionContentRenderer;
