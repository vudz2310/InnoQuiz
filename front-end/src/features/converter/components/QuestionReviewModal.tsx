import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ArrowRight,
  FileText,
  Check,
  Search,
  Plus,
  Edit3,
  Merge,
  Copy,
  Code2,
} from "lucide-react";
import type { ImportedSection } from "../../../types/quiz-section.types";
import type { QuestionDraft } from "../../../types/quiz.types";
import type {
  NormalizedResult,
  NormalizedSection,
  NormalizedQuestion,
} from "../types/converter.types";
import { getMediaUrl } from "../../../utils/media";

interface QuestionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: ImportedSection[];
  normalizedResult?: NormalizedResult;
  rawText: string;
  initialSearchQuery?: string;
  onToggleCorrectAnswer: (questionTempId: string, answerIndex: number) => void;
  onUpdateQuestionContent: (questionTempId: string, content: string) => void;
  onUpdateOptionContent: (
    questionTempId: string,
    answerIndex: number,
    content: string,
  ) => void;
  onDeleteOption?: (questionTempId: string, answerIndex: number) => void;
  onMergeOptionWithPrevious?: (
    questionTempId: string,
    answerIndex: number,
  ) => void;
  onAddOption?: (questionTempId: string) => void;
  onDeleteQuestion: (questionTempId: string) => void;
  onConfirmSend: (onlyValid?: boolean) => void;
}

type ReviewFilterType =
  | "ALL"
  | "WAITING"
  | "NEEDS_REVIEW"
  | "FIVE_OPTIONS"
  | "INVALID"
  | "EDITED";

interface IssueQuestionItem {
  sectionId: string;
  sectionTitle: string;
  question: QuestionDraft;
  questionIndex: number;
  status: "WAITING" | "NEEDS_REVIEW" | "INVALID" | "RESOLVED";
  warningText: string;
  rawSnippet: string;
  has5Options: boolean;
}

function findQuestionRawSnippet(
  rawLines: string[],
  questionContent: string,
  questionOrder?: number,
): string {
  if (!rawLines || rawLines.length === 0) return "";

  // Strategy 1: Find by "Câu {order}"
  if (questionOrder) {
    const qRegex = new RegExp(
      `^(?:câu|cau|question|q\\.)\\s*${questionOrder}\\b`,
      "i",
    );
    const foundIdx = rawLines.findIndex((l) => qRegex.test(l.trim()));
    if (foundIdx !== -1) {
      return rawLines
        .slice(foundIdx, Math.min(rawLines.length, foundIdx + 8))
        .join("\n");
    }
  }

  // Strategy 2: Find by content substring
  const searchPart = questionContent.trim().slice(0, 30).toLowerCase();
  if (searchPart.length > 5) {
    const foundIdx = rawLines.findIndex((l) =>
      l.toLowerCase().includes(searchPart),
    );
    if (foundIdx !== -1) {
      const start = Math.max(0, foundIdx);
      return rawLines
        .slice(start, Math.min(rawLines.length, start + 8))
        .join("\n");
    }
  }

  return "";
}

export const QuestionReviewModal: React.FC<QuestionReviewModalProps> = ({
  isOpen,
  onClose,
  sections,
  normalizedResult,
  rawText,
  initialSearchQuery = "",
  onToggleCorrectAnswer,
  onUpdateQuestionContent,
  onUpdateOptionContent,
  onDeleteOption,
  onMergeOptionWithPrevious,
  onAddOption,
  onDeleteQuestion,
  onConfirmSend,
}) => {
  const [filterType, setFilterType] = useState<ReviewFilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [dismissed5OptionIds, setDismissed5OptionIds] = useState<Set<string>>(
    new Set(),
  );
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [editedQuestionIds, setEditedQuestionIds] = useState<Set<string>>(
    new Set(),
  );

  const markAsEdited = (qTempId: string) => {
    setEditedQuestionIds((prev) => {
      if (prev.has(qTempId)) return prev;
      const next = new Set(prev);
      next.add(qTempId);
      return next;
    });
  };

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Phân tách dòng văn bản gốc 1 lần duy nhất để tối ưu hiệu năng (tránh đơ lag khi gõ phím)
  const rawLines = useMemo(() => {
    if (!rawText) return [];
    return rawText.split(/\r?\n/);
  }, [rawText]);

  // Cache đoạn trích đối chiếu theo mã câu hỏi để không phải quét lại toàn bộ file trên mỗi phím bấm
  const rawSnippetMap = useMemo(() => {
    if (!rawLines.length) return new Map<string, string>();
    const map = new Map<string, string>();
    sections.forEach((sec) => {
      sec.questions.forEach((q, qIdx) => {
        const qTempId = q.tempId || `q-${qIdx}`;
        map.set(
          qTempId,
          findQuestionRawSnippet(rawLines, q.content, q.order || qIdx + 1),
        );
      });
    });
    return map;
    // Chỉ tính lại khi tệp gốc thay đổi hoặc số câu hỏi trong section thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawLines, sections.length]);

  // Thu thập danh sách câu hỏi cần kiểm tra
  const allIssues: IssueQuestionItem[] = useMemo(() => {
    const items: IssueQuestionItem[] = [];

    sections.forEach((sec) => {
      const normSec = normalizedResult?.sections?.find(
        (s: NormalizedSection) => s.tempId === sec.tempId,
      );

      sec.questions.forEach((q, qIdx) => {
        const qTempId = q.tempId || `q-${qIdx}`;
        const nq = normSec?.questions?.find(
          (item: NormalizedQuestion) => item.tempId === q.tempId,
        );
        const hasCorrect = q.answers.some((a) => a.isCorrect);
        const hasContent = Boolean(
          q.content?.trim() ||
            (q.media && q.media.length > 0) ||
            (nq?.media && nq.media.length > 0),
        );
        const has5Options = q.answers.length >= 5;
        const isDismissed5Options = dismissed5OptionIds.has(qTempId);

        let status: IssueQuestionItem["status"] = "RESOLVED";
        let warningText = "";

        if (!hasContent) {
          status = "INVALID";
          warningText = "Nội dung câu hỏi rỗng hoặc thiếu.";
        } else if (q.answers.length < 2) {
          status = "NEEDS_REVIEW";
          warningText = `Câu hỏi chỉ có ${q.answers.length} lựa chọn (cần ít nhất 2).`;
        } else if (has5Options && !isDismissed5Options) {
          // Câu hỏi có 5 đáp án (A, B, C, D, E): cần kiểm tra và sửa/xóa đáp án thừa nếu có
          status = "NEEDS_REVIEW";
          warningText = `Câu hỏi có ${q.answers.length} đáp án (A, B, C, D, E...). Hãy kiểm tra và sửa hoặc xóa đáp án thừa nếu cần.`;
        } else if (!hasCorrect) {
          status = "WAITING";
          warningText = "Chưa chọn đáp án đúng cho câu hỏi này.";
        } else if (nq?.parseStatus === "NEEDS_REVIEW" && !hasCorrect) {
          status = "NEEDS_REVIEW";
          warningText = nq.warnings?.[0] || "Câu hỏi cần xem lại cấu trúc đáp án.";
        }

        const rawSnippet =
          rawSnippetMap.get(qTempId) ||
          findQuestionRawSnippet(rawLines, q.content, q.order || qIdx + 1);

        items.push({
          sectionId: sec.tempId,
          sectionTitle: sec.title,
          question: q,
          questionIndex: qIdx + 1,
          status,
          warningText,
          rawSnippet,
          has5Options,
        });
      });
    });

    return items;
  }, [sections, normalizedResult, dismissed5OptionIds, rawSnippetMap, rawLines]);

  // Thống kê số lượng
  const waitingCount = allIssues.filter((i) => i.status === "WAITING").length;
  const needsReviewCount = allIssues.filter(
    (i) => i.status === "NEEDS_REVIEW",
  ).length;
  const fiveOptionsCount = allIssues.filter((i) => i.has5Options).length;
  const invalidCount = allIssues.filter((i) => i.status === "INVALID").length;
  const unresolvedIssues = allIssues.filter((i) => i.status !== "RESOLVED");
  const totalUnresolved = unresolvedIssues.length;
  const editedCount = allIssues.filter((i) => {
    const qId = i.question.tempId || `q-${i.questionIndex}`;
    return editedQuestionIds.has(qId);
  }).length;

  // Lọc theo tab và tìm kiếm
  const filteredIssues = useMemo(() => {
    return allIssues.filter((item) => {
      const hasSearch = searchQuery.trim().length > 0;
      const qId = item.question.tempId || `q-${item.questionIndex}`;

      if (!hasSearch) {
        if (filterType === "ALL") {
          if (item.status === "RESOLVED") return false;
        } else if (filterType === "FIVE_OPTIONS") {
          if (!item.has5Options) return false;
        } else if (filterType === "EDITED") {
          if (!editedQuestionIds.has(qId)) return false;
        } else if (item.status !== filterType) {
          return false;
        }
      } else {
        // Khi người dùng đang tìm kiếm cụ thể (ví dụ "Câu 17")
        if (filterType === "FIVE_OPTIONS" && !item.has5Options) return false;
        if (filterType === "EDITED") {
          if (!editedQuestionIds.has(qId)) return false;
        } else if (
          filterType !== "ALL" &&
          filterType !== "FIVE_OPTIONS" &&
          item.status !== filterType
        ) {
          return false;
        }
      }

      if (hasSearch) {
        const q = searchQuery.toLowerCase().trim();
        const orderNum = String(item.question.order || item.questionIndex);
        const inOrder =
          orderNum.includes(q) ||
          `câu ${orderNum}`.includes(q) ||
          `cau ${orderNum}`.includes(q);
        const inContent = item.question.content.toLowerCase().includes(q);
        const inSection = item.sectionTitle.toLowerCase().includes(q);
        const inAnswers = item.question.answers.some((a) =>
          a.content.toLowerCase().includes(q),
        );
        if (!inContent && !inOrder && !inSection && !inAnswers) return false;
      }

      return true;
    });
  }, [allIssues, filterType, searchQuery]);

  const handleCopySnippet = (qTempId: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(qTempId);
    setTimeout(() => setCopiedSnippetId(null), 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-amber-500/10 via-indigo-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Kiểm tra & Hoàn thiện câu hỏi trước khi tạo đề thi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {totalUnresolved > 0
                  ? `Phát hiện ${totalUnresolved} câu hỏi chưa có đáp án đúng, có 5 đáp án hoặc cần đối chiếu.`
                  : "Tất cả các câu hỏi đã được chọn đáp án đúng và hợp lệ!"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === "ALL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>Tất cả cần sửa</span>
              <span className="px-1.5 py-0.2 bg-black/15 dark:bg-white/20 rounded-full text-[10px]">
                {totalUnresolved}
              </span>
            </button>

            {/* Tab Câu 5 đáp án */}
            {fiveOptionsCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterType("FIVE_OPTIONS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterType === "FIVE_OPTIONS"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                }`}
                title="Các câu hỏi có 5 đáp án A, B, C, D, E"
              >
                <span>⭐ Câu 5 đáp án</span>
                <span className="px-1.5 py-0.2 bg-purple-200 dark:bg-purple-900 rounded-full text-[10px] font-bold">
                  {fiveOptionsCount}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFilterType("WAITING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === "WAITING"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ chọn đáp án</span>
              <span className="px-1.5 py-0.2 bg-sky-200 dark:bg-sky-900 rounded-full text-[10px]">
                {waitingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("NEEDS_REVIEW")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === "NEEDS_REVIEW"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cần kiểm tra</span>
              <span className="px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900 rounded-full text-[10px]">
                {needsReviewCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("INVALID")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === "INVALID"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Không hợp lệ</span>
              <span className="px-1.5 py-0.2 bg-rose-200 dark:bg-rose-900 rounded-full text-[10px]">
                {invalidCount}
              </span>
            </button>

            {/* Tab Câu vừa sửa xong */}
            <button
              type="button"
              onClick={() => setFilterType("EDITED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filterType === "EDITED"
                  ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
              }`}
              title="Xem lại toàn bộ những câu hỏi bạn vừa chỉnh sửa hoặc hoàn thiện"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Câu vừa sửa xong</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterType === "EDITED"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                }`}
              >
                {editedCount}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm câu số (vd: Câu 17), từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredIssues.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {filterType === "EDITED"
                  ? "Chưa có câu nào được chỉnh sửa trong phiên này"
                  : totalUnresolved === 0
                    ? "Tất cả câu hỏi đã sẵn sàng để tạo đề thi!"
                    : "Không có câu hỏi nào trong bộ lọc này"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {filterType === "EDITED"
                  ? "Khi bạn chọn đáp án hoặc sửa nội dung ở các tab bên cạnh, câu hỏi sẽ xuất hiện tại đây để bạn kiểm tra lại."
                  : totalUnresolved === 0
                    ? "Bạn có thể nhấn nút 'Đưa vào Tạo đề thi' bên dưới để chuyển tiếp tục."
                    : "Vui lòng chọn bộ lọc khác hoặc kiểm tra lại từ khóa tìm kiếm."}
              </p>
            </div>
          ) : (
            filteredIssues.map((item) => {
              const q = item.question;
              const qTempId = q.tempId || `q-${item.questionIndex}`;
              const hasMedia = q.media && q.media.length > 0;
              const optionLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];

              return (
                <div
                  key={qTempId}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all"
                >
                  {/* Item Header */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-black text-xs shadow-2xs">
                        Câu {q.order || item.questionIndex}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {item.sectionTitle}
                      </span>
                      {item.has5Options && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {q.answers.length} đáp án (A-E)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          item.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : item.status === "WAITING"
                              ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
                              : item.status === "NEEDS_REVIEW"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                        }`}
                      >
                        {item.status === "RESOLVED"
                          ? "✓ Đã xử lý (Sẵn sàng)"
                          : item.status === "WAITING"
                            ? "⏳ Chờ chọn đáp án"
                            : item.status === "NEEDS_REVIEW"
                              ? "⚠ Cần kiểm tra"
                              : "! Không hợp lệ"}
                      </span>

                      <button
                        type="button"
                        onClick={() => onDeleteQuestion(qTempId)}
                        title="Xóa câu hỏi này khỏi đề thi"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Warning message banner if unresolved */}
                  {item.warningText && item.status !== "RESOLVED" && (
                    <div className="px-4 py-2.5 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex flex-wrap items-center justify-between gap-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>{item.warningText}</span>
                      </div>
                      {item.has5Options && (
                        <button
                          type="button"
                          onClick={() => {
                            markAsEdited(qTempId);
                            setDismissed5OptionIds(
                              (prev) => new Set(prev).add(qTempId),
                            );
                          }}
                          className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] shrink-0 transition-colors cursor-pointer shadow-2xs"
                        >
                          Xác nhận giữ {q.answers.length} đáp án
                        </button>
                      )}
                    </div>
                  )}

                  {/* Banner nếu câu hỏi đã được sửa xong */}
                  {item.status === "RESOLVED" && editedQuestionIds.has(qTempId) && (
                    <div className="px-4 py-2 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-semibold">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Câu hỏi đã được bạn chỉnh sửa và kiểm tra hoàn tất.</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                        ✓ Vừa sửa xong
                      </span>
                    </div>
                  )}

                  {/* Two-column layout: Left = Raw Snippet for Reference, Right = Editable Question & Options */}
                  <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                    {/* Raw Snippet Box */}
                    <div className="md:col-span-4 p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Đối chiếu văn bản gốc</span>
                        </div>
                        {item.rawSnippet && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopySnippet(qTempId, item.rawSnippet)
                            }
                            className="text-[10px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Sao chép văn bản gốc"
                          >
                            {copiedSnippetId === qTempId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  Đã chép
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {item.rawSnippet ? (
                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                          {item.rawSnippet}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-slate-400 p-2">
                          (Không tìm thấy đoạn gốc khớp chính xác trong văn bản)
                        </p>
                      )}

                      {/* Display image if present */}
                      {hasMedia && (
                        <div className="mt-2 space-y-1.5">
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                            Hình ảnh đính kèm:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {q.media!.map((m) => (
                              <img
                                key={m.tempId || m.assetId}
                                src={getMediaUrl(m.dataUrl || m.url || "")}
                                alt="Hình ảnh câu hỏi"
                                className="max-h-32 rounded-lg border border-slate-200 dark:border-slate-700 object-contain bg-white"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Editable Question & Choices */}
                    <div className="md:col-span-8 p-4 space-y-4">
                      {/* CHỈNH SỬA NỘI DUNG CÂU HỎI TRỰC TIẾP */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Nội dung câu hỏi:</span>
                            <span className="text-[10px] font-normal text-slate-400">
                              (Chỉnh sửa trực tiếp tại ô bên dưới)
                            </span>
                          </label>
                        </div>

                        <textarea
                          rows={2}
                          value={q.content}
                          onChange={(e) => {
                            markAsEdited(qTempId);
                            onUpdateQuestionContent(qTempId, e.target.value);
                          }}
                          placeholder="Nhập nội dung câu hỏi..."
                          className="w-full p-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y leading-relaxed"
                        />

                        {/* Khối mã nguồn đính kèm (Code Block) */}
                        {q.contentSegments && q.contentSegments.some((s) => s.type === "CODE") && (
                          <div className="mt-2.5 space-y-1.5">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5" />
                              <span>Mã nguồn đính kèm ({q.contentSegments.filter((s) => s.type === "CODE")[0]?.language || "Code"}):</span>
                            </span>
                            {q.contentSegments
                              .filter((s) => s.type === "CODE")
                              .map((seg, sIdx) => (
                                <pre
                                  key={seg.id || sIdx}
                                  className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 shadow-inner max-h-60"
                                >
                                  <code className="block whitespace-pre">
                                    {seg.normalizedContent || seg.rawContent}
                                  </code>
                                </pre>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* CHỈNH SỬA CÁC ĐÁP ÁN (A, B, C, D, E...) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                              Các đáp án ({q.answers.length} lựa chọn):
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Bấm chữ cái để chọn đáp án đúng • Nhấp vào ô để sửa
                              nội dung
                            </p>
                          </div>
                          {onAddOption && q.answers.length < 8 && (
                            <button
                              type="button"
                              onClick={() => {
                                markAsEdited(qTempId);
                                onAddOption(qTempId);
                              }}
                              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Thêm đáp án</span>
                            </button>
                          )}
                        </div>

                        <div className="space-y-2.5">
                          {q.answers.map((ans, aIdx) => {
                            const letter =
                              optionLetters[aIdx] ||
                              String.fromCharCode(65 + aIdx);
                            const prevLetter =
                              aIdx > 0 ? optionLetters[aIdx - 1] : "";
                            const isCorrect = Boolean(ans.isCorrect);

                            return (
                              <div
                                key={ans.id || `ans-${qTempId}-${aIdx}`}
                                className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                                  isCorrect
                                    ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 shadow-2xs ring-1 ring-emerald-500/20"
                                    : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600"
                                }`}
                              >
                                {/* Nút tròn chọn đáp án đúng - LUÔN GIỮ CHỮ CÁI RÕ RÀNG */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    markAsEdited(qTempId);
                                    onToggleCorrectAnswer(qTempId, aIdx);
                                  }}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 transition-all active:scale-90 cursor-pointer ${
                                    isCorrect
                                      ? "bg-emerald-600 text-white ring-2 ring-emerald-300 dark:ring-emerald-700 shadow-2xs"
                                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700"
                                  }`}
                                  title={
                                    isCorrect
                                      ? "Đang là đáp án đúng (Nhấp để bỏ chọn)"
                                      : `Nhấp để chọn ${letter} làm đáp án đúng`
                                  }
                                >
                                  {letter}
                                </button>

                                {/* Ô nhập/sửa nội dung đáp án - HỖ TRỢ XUỐNG DÒNG / CÂU DÀI */}
                                <textarea
                                  rows={Math.max(
                                    1,
                                    Math.min(
                                      4,
                                      Math.ceil((ans.content || "").length / 65),
                                    ),
                                  )}
                                  value={ans.content}
                                  onChange={(e) => {
                                    markAsEdited(qTempId);
                                    onUpdateOptionContent(
                                      qTempId,
                                      aIdx,
                                      e.target.value,
                                    );
                                  }}
                                  placeholder={`Nội dung lựa chọn ${letter}...`}
                                  className={`flex-1 min-w-0 p-2 text-xs rounded-lg border leading-relaxed resize-y focus:outline-hidden transition-all ${
                                    isCorrect
                                      ? "bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                      : "bg-slate-50/80 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                  }`}
                                />

                                {/* Các nút hành động phụ bên phải: Chọn đúng, Gộp dòng, Xóa */}
                                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                  {isCorrect ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-1 rounded-md">
                                      <Check className="w-3 h-3" />
                                      Đúng
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        markAsEdited(qTempId);
                                        onToggleCorrectAnswer(qTempId, aIdx);
                                      }}
                                      className="text-[11px] font-medium text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2 py-1 rounded-md transition-colors cursor-pointer"
                                      title={`Chọn ${letter} làm đáp án đúng`}
                                    >
                                      Chọn đúng
                                    </button>
                                  )}

                                  {/* Nút gộp vào đáp án liền trước (Dành cho câu bị ngắt dòng thành đáp án mới) */}
                                  {aIdx > 0 && onMergeOptionWithPrevious && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        markAsEdited(qTempId);
                                        onMergeOptionWithPrevious(
                                          qTempId,
                                          aIdx,
                                        );
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                                      title={`Gộp nội dung này vào phương án ${prevLetter} phía trên`}
                                    >
                                      <Merge className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Nút Xóa phương án (áp dụng khi có > 2 lựa chọn) */}
                                  {onDeleteOption && q.answers.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        markAsEdited(qTempId);
                                        onDeleteOption(qTempId, aIdx);
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title={`Xóa phương án ${letter}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs">
            {totalUnresolved > 0 ? (
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                ⚠ Còn {totalUnresolved} câu hỏi chưa hoàn thiện
                {fiveOptionsCount > 0 &&
                  ` (${fiveOptionsCount} câu có 5 đáp án)`}
              </span>
            ) : (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Tất cả câu hỏi đã hoàn tất! Sẵn sàng đưa vào đề thi.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={() => onConfirmSend(false)}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Đưa vào Tạo đề thi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
