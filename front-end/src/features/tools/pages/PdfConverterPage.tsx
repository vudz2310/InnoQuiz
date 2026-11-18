import React, { useState, useEffect, useReducer, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/Dashboard";
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  Copy,
  Check,
  FileCode2,
  FileSpreadsheet,
  ArrowRight,
  FileCheck,
  Loader2,
  Layers,
  HelpCircle,
  FolderTree,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Edit3,
  Maximize2,
  Minimize2,
  CheckCircle2,
} from "lucide-react";
import {
  parseQuestionsFromText,
  type ParseResult,
} from "../../../utils/questionParser";
import { QuestionContentRenderer } from "../../../components/common/QuestionContentRenderer";
import { readDocumentFile } from "../../../utils/fileDocumentReader";
import {
  exportQuestionsToDocx,
  exportQuestionsToJson,
  formatQuestionsToStandardText,
} from "../../../utils/docxExporter";
import {
  convertDocumentBlocks,
  convertText,
  converterResultToParseResult,
  type DocumentBlock,
  type NormalizedResult,
  type NormalizedSection,
  type NormalizedQuestion,
} from "../../converter";
import { TemplateGuideModal } from "../../converter/components/TemplateGuideModal";
import { QuestionReviewModal } from "../../converter/components/QuestionReviewModal";
import { useNotification } from "../../../components/Notification";
import { getMediaUrl } from "../../../utils/media";

export type ConverterSourceMode = "FILE" | "MANUAL_TEXT";
export type ConverterStatus =
  | "IDLE"
  | "EXTRACTING"
  | "PARSING"
  | "READY"
  | "ERROR";

export interface ConverterState {
  status: ConverterStatus;
  jobId: number;
  fileName: string | null;
  examTitle: string;
  result: ParseResult | null;
  rawTextPreview: string;
  sourceMode: ConverterSourceMode | null;
  errorMessage: string | null;
}

export type ConverterAction =
  | {
      type: "PARSE_STARTED";
      jobId: number;
      fileName: string;
      examTitle: string;
    }
  | { type: "EXTRACTED_BLOCKS"; jobId: number }
  | {
      type: "FILE_PARSED";
      jobId: number;
      result: ParseResult;
      rawTextPreview: string;
      fileName: string;
      examTitle: string;
    }
  | {
      type: "MANUAL_PARSED";
      jobId: number;
      result: ParseResult;
      rawTextPreview: string;
      examTitle: string;
    }
  | { type: "PARSE_FAILED"; jobId: number; errorMessage: string }
  | { type: "SET_TITLE"; examTitle: string }
  | { type: "RESET" };

const initialState: ConverterState = {
  status: "IDLE",
  jobId: 0,
  fileName: null,
  examTitle: "Đề thi trắc nghiệm - Chuyển đổi chuẩn",
  result: null,
  rawTextPreview: "",
  sourceMode: null,
  errorMessage: null,
};

function converterReducer(
  state: ConverterState,
  action: ConverterAction,
): ConverterState {
  switch (action.type) {
    case "PARSE_STARTED":
      return {
        ...state,
        status: "EXTRACTING",
        jobId: action.jobId,
        fileName: action.fileName,
        examTitle: action.examTitle,
        errorMessage: null,
      };
    case "EXTRACTED_BLOCKS":
      if (action.jobId !== state.jobId) return state;
      return {
        ...state,
        status: "PARSING",
      };
    case "FILE_PARSED":
      if (action.jobId !== state.jobId) return state;
      return {
        ...state,
        status: "READY",
        result: action.result,
        rawTextPreview: action.rawTextPreview,
        fileName: action.fileName,
        examTitle: action.examTitle,
        sourceMode: "FILE",
        errorMessage: null,
      };
    case "MANUAL_PARSED":
      if (action.jobId !== state.jobId) return state;
      return {
        ...state,
        status: "READY",
        result: action.result,
        rawTextPreview: action.rawTextPreview,
        examTitle: action.examTitle,
        sourceMode: "MANUAL_TEXT",
        errorMessage: null,
      };
    case "PARSE_FAILED":
      if (action.jobId !== state.jobId) return state;
      return {
        ...state,
        status: "ERROR",
        errorMessage: action.errorMessage,
      };
    case "SET_TITLE":
      return {
        ...state,
        examTitle: action.examTitle,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export const PdfConverterPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotification();

  const [state, dispatch] = useReducer(converterReducer, initialState);
  const currentJobRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const cachedBlocksRef = useRef<DocumentBlock[]>([]);

  const [rawTextInput, setRawTextInput] = useState<string>("");
  const [activeView, setActiveView] = useState<"cards" | "text" | "json">(
    "cards",
  );
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "READY" | "WAITING" | "NEEDS_REVIEW" | "INVALID"
  >("ALL");
  const [copied, setCopied] = useState<boolean>(false);
  const [exportingDocx, setExportingDocx] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [showTemplateGuide, setShowTemplateGuide] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewInitialQuery, setReviewInitialQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<{
    percent: number;
    message: string;
  } | null>(null);
  const [isUploadPanelCollapsed, setIsUploadPanelCollapsed] = useState(false);

  // Huỷ tác vụ khi unmount (Không revoke blob URL vì CreateQuizPage cần dùng URL/Blob này)
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Đồng bộ rawTextInput khi tệp được đọc xong ở chế độ FILE
  useEffect(() => {
    if (state.sourceMode === "FILE") {
      setRawTextInput(state.rawTextPreview);
    }
  }, [state.rawTextPreview, state.sourceMode]);

  // Tự động mở rộng section khi có kết quả mới (ưu tiên mở phần 1 để UI phản hồi ngay tức thì, tránh đơ DOM)
  useEffect(() => {
    if (state.result?.sections) {
      const expanded: Record<string, boolean> = {};
      const totalSections = state.result.sections.length;
      state.result.sections.forEach((s, idx) => {
        expanded[s.tempId] = idx === 0 || totalSections <= 2;
      });
      setExpandedSections(expanded);
    }
  }, [state.result]);

  const handleExpandAll = () => {
    if (!state.result?.sections) return;
    const expanded: Record<string, boolean> = {};
    state.result.sections.forEach((s) => {
      expanded[s.tempId] = true;
    });
    setExpandedSections(expanded);
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
  };

  const isReading = state.status === "EXTRACTING" || state.status === "PARSING";
  const parseResult = state.result;
  const fileName = state.fileName;
  const examTitle = state.examTitle;

  // Xử lý đọc tệp dùng chung cho cả input click và drag & drop
  const processFile = async (file: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const jobId = ++currentJobRef.current;
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

    setConversionProgress({
      percent: 5,
      message: "Đang mở tệp...",
    });

    dispatch({
      type: "PARSE_STARTED",
      jobId,
      fileName: file.name,
      examTitle: cleanTitle,
    });

    try {
      const document = await readDocumentFile(file, {
        signal: controller.signal,
        onProgress: (p) => {
          if (jobId === currentJobRef.current) {
            setConversionProgress({
              percent: p.percent,
              message: p.message,
            });
          }
        },
      });
      if (jobId !== currentJobRef.current || controller.signal.aborted) return;

      setConversionProgress({
        percent: 88,
        message: "Đang phân tích cấu trúc các phần & câu hỏi...",
      });
      await new Promise((r) => setTimeout(r, 10));

      dispatch({ type: "EXTRACTED_BLOCKS", jobId });

      const parsed =
        document.type === "json"
          ? parseQuestionsFromText(document.text, "json")
          : converterResultToParseResult(
              convertDocumentBlocks(document.blocks, cleanTitle),
            );

      if (jobId !== currentJobRef.current || controller.signal.aborted) return;

      cachedBlocksRef.current = document.blocks;

      setConversionProgress({
        percent: 100,
        message: "Hoàn tất nhận diện!",
      });
      await new Promise((r) => setTimeout(r, 180));
      setConversionProgress(null);

      dispatch({
        type: "FILE_PARSED",
        jobId,
        result: parsed,
        rawTextPreview: document.text,
        fileName: file.name,
        examTitle: cleanTitle,
      });

      showSuccess(
        "Tải tệp thành công",
        `Đã bóc tách thành công ${parsed.sections.length} phần (${parsed.totalParsed} câu hỏi)!`,
      );
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const apiError = err as { message?: string };
      console.error("Lỗi đọc tệp:", err);
      setConversionProgress(null);
      dispatch({
        type: "PARSE_FAILED",
        jobId,
        errorMessage: apiError.message || "Lỗi đọc tệp",
      });
      showError(
        "Lỗi đọc tệp",
        `Không thể đọc tệp ${file.name}: ${apiError.message || "Lỗi tệp"}`,
      );
    }
  };

  // Xử lý tải tệp lên qua input file (.pdf, .docx, .txt, .json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isReading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isReading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Nút phân tích cú pháp thủ công (chế độ MANUAL_TEXT)
  const handleConvert = () => {
    if (!rawTextInput.trim()) {
      showWarning(
        "Chưa có nội dung",
        "Vui lòng dán nội dung hoặc tải lên tệp PDF trước khi chuyển đổi.",
      );
      return;
    }
    abortRef.current?.abort();
    const jobId = ++currentJobRef.current;
    dispatch({
      type: "PARSE_STARTED",
      jobId,
      fileName: state.fileName || "Văn bản thô",
      examTitle: state.examTitle,
    });
    const availableBlocks =
      cachedBlocksRef.current.length > 0
        ? cachedBlocksRef.current
        : state.result?.blocks || [];
    const parsed = converterResultToParseResult(
      convertText(rawTextInput, state.examTitle, availableBlocks),
    );
    if (parsed.blocks && parsed.blocks.length > 0) {
      cachedBlocksRef.current = parsed.blocks;
    }
    dispatch({
      type: "MANUAL_PARSED",
      jobId,
      result: parsed,
      rawTextPreview: rawTextInput,
      examTitle: state.examTitle,
    });
  };

  // Sao chép văn bản chuẩn A B C D
  const handleCopyText = () => {
    if (!parseResult || parseResult.sections.length === 0) return;
    const formatted = formatQuestionsToStandardText(parseResult.sections);
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    showSuccess(
      "Đã sao chép",
      "Đã sao chép nội dung chuẩn A B C D vào bộ nhớ tạm.",
    );
    setTimeout(() => setCopied(false), 2000);
  };

  // Xuất file Word (.docx)
  const handleExportDocx = async () => {
    if (!parseResult || parseResult.sections.length === 0) return;
    try {
      setExportingDocx(true);
      await exportQuestionsToDocx(parseResult.sections, examTitle);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      console.error("Lỗi xuất file Word:", err);
      showError(
        "Lỗi xuất file Word",
        apiError.message || "Không thể tạo file Word.",
      );
    } finally {
      setExportingDocx(false);
    }
  };

  // Xuất file JSON
  const handleExportJson = () => {
    if (!parseResult || parseResult.sections.length === 0) return;
    exportQuestionsToJson(parseResult.sections, examTitle);
  };

  // Đồng bộ NormalizedResult khi các câu hỏi hoặc đáp án được chỉnh sửa thủ công
  const syncNormalizedResult = (
    sections: typeof parseResult extends null
      ? never
      : NonNullable<typeof parseResult>["sections"],
    oldNormalized?: NormalizedResult,
  ): NormalizedResult | undefined => {
    if (!oldNormalized) return undefined;

    const updatedSections = oldNormalized.sections.map(
      (sec: NormalizedSection) => {
        const matchingSec = sections.find((s) => s.tempId === sec.tempId);
        if (!matchingSec) return sec;

        const updatedQuestions = sec.questions.map((nq: NormalizedQuestion) => {
          const matchingQ = matchingSec.questions.find(
            (q) => q.tempId === nq.tempId,
          );
          if (!matchingQ) return nq;

          const hasCorrect = matchingQ.answers.some((a) => a.isCorrect);
          const hasContent =
            matchingQ.content.trim().length > 0 ||
            (nq.media && nq.media.length > 0) ||
            (matchingQ.media && matchingQ.media.length > 0);
          const hasSufficient = matchingQ.answers.length >= 2;

          let parseStatus = nq.parseStatus;
          let status = nq.status;
          let answerStatus = nq.answerStatus;

          if (!hasContent) {
            parseStatus = "INVALID";
            status = "INVALID";
          } else if (!hasSufficient) {
            parseStatus = "NEEDS_REVIEW";
            status = "NEEDS_REVIEW";
          } else {
            parseStatus = "VALID";
            status = "VALID";
          }

          if (hasCorrect) {
            answerStatus = "DETECTED";
          } else {
            answerStatus = "MISSING";
          }

          return {
            ...nq,
            content: matchingQ.content,
            options: matchingQ.answers.map((ans, idx) => {
              const oldOpt = nq.options[idx];
              return {
                id: ans.id || oldOpt?.id || `opt-${idx + 1}`,
                label: String.fromCharCode(65 + idx),
                content: ans.content,
                isCorrect: Boolean(ans.isCorrect),
                media: oldOpt?.media || [],
              };
            }),
            status,
            parseStatus,
            answerStatus,
            answerDetected: hasCorrect,
          };
        });

        return {
          ...sec,
          questions: updatedQuestions,
        };
      },
    );

    const allQuestions = updatedSections.flatMap(
      (s: NormalizedSection) => s.questions,
    );
    const validQuestions = allQuestions.filter(
      (q: NormalizedQuestion) =>
        (q.status === "VALID" || q.parseStatus === "VALID") &&
        q.answerStatus === "DETECTED",
    ).length;
    const waitingAnswerQuestions = allQuestions.filter(
      (q: NormalizedQuestion) =>
        (q.status === "VALID" || q.parseStatus === "VALID") &&
        q.answerStatus === "MISSING",
    ).length;
    const needsReviewQuestions = allQuestions.filter(
      (q: NormalizedQuestion) =>
        q.status === "NEEDS_REVIEW" || q.parseStatus === "NEEDS_REVIEW",
    ).length;
    const invalidQuestions = allQuestions.filter(
      (q: NormalizedQuestion) =>
        q.status === "INVALID" || q.parseStatus === "INVALID",
    ).length;

    return {
      ...oldNormalized,
      sections: updatedSections,
      statistics: {
        ...oldNormalized.statistics,
        totalQuestions: allQuestions.length,
        validQuestions,
        waitingAnswerQuestions,
        needsReviewQuestions,
        invalidQuestions,
      },
    };
  };

  const updateParsedSections = (
    newSections: NonNullable<typeof parseResult>["sections"],
  ) => {
    if (!parseResult) return;
    const syncedNormalized = syncNormalizedResult(
      newSections,
      parseResult.normalized,
    );

    dispatch({
      type: "MANUAL_PARSED",
      jobId: currentJobRef.current,
      result: {
        ...parseResult,
        sections: newSections,
        questions: newSections.flatMap((s) => s.questions),
        normalized: syncedNormalized,
      },
      rawTextPreview: state.rawTextPreview,
      examTitle: state.examTitle,
    });
  };

  // Tính số lượng câu hỏi chưa hoàn thiện (chờ chọn đáp án, cần kiểm tra, không hợp lệ)
  const unresolvedQuestionsCount = parseResult?.sections
    ? parseResult.sections.reduce((sum, sec) => {
        const normSec = parseResult.normalized?.sections.find(
          (s) => s.tempId === sec.tempId,
        );
        return (
          sum +
          sec.questions.filter((q) => {
            const nq = normSec?.questions.find(
              (item) => item.tempId === q.tempId,
            );
            const hasCorrect = q.answers.some((a) => a.isCorrect);
            const hasContent = Boolean(
              q.content?.trim() ||
              (q.media && q.media.length > 0) ||
              (nq?.media && nq.media.length > 0),
            );
            const hasSufficient = q.answers.length >= 2;
            const has5Options = q.answers.length >= 5;
            return !hasCorrect || !hasContent || !hasSufficient || has5Options;
          }).length
        );
      }, 0)
    : 0;

  // Thực hiện điều hướng sang trang Tạo đề thi (hỗ trợ lọc chỉ các câu hợp lệ)
  const proceedToCreateQuiz = (onlyValid = false) => {
    if (!parseResult || parseResult.sections.length === 0) return;

    let targetSections = parseResult.sections;
    if (onlyValid) {
      targetSections = parseResult.sections
        .map((sec) => ({
          ...sec,
          questions: sec.questions.filter((q) => {
            const hasCorrect = q.answers.some((a) => a.isCorrect);
            const hasContent = Boolean(
              q.content?.trim() || (q.media && q.media.length > 0),
            );
            return hasCorrect && hasContent && q.answers.length >= 2;
          }),
        }))
        .filter((sec) => sec.questions.length > 0);

      if (targetSections.length === 0) {
        showWarning(
          "Không có câu hỏi hợp lệ",
          "Không còn câu hỏi nào hợp lệ để đưa vào đề thi. Vui lòng chọn ít nhất một đáp án đúng.",
        );
        return;
      }
    }

    // Truyền dữ liệu trực tiếp qua bộ nhớ window và state để không bị giới hạn 5MB của sessionStorage khi có ảnh base64
    const windowStorage = window as unknown as {
      __importedSections?: unknown;
      __importedTitle?: unknown;
    };
    windowStorage.__importedSections = targetSections;
    windowStorage.__importedTitle = examTitle;

    // Lưu dự phòng vào sessionStorage (lược bỏ dataUrl ảnh dung lượng lớn để tránh lỗi QuotaExceededError)
    try {
      const lightweightSections = targetSections.map((sec) => ({
        ...sec,
        questions: sec.questions.map((q) => ({
          ...q,
          media: q.media?.map((m) => ({ ...m, dataUrl: undefined })),
          answers: q.answers?.map((a) => ({
            ...a,
            media: a.media?.map((m) => ({ ...m, dataUrl: undefined })),
          })),
        })),
      }));
      sessionStorage.setItem(
        "imported_sections",
        JSON.stringify(lightweightSections),
      );
      sessionStorage.setItem("imported_title", examTitle);
      sessionStorage.removeItem("imported_questions");
    } catch {
      // Bỏ qua lỗi sessionStorage quota nếu vượt dung lượng, vì dữ liệu gốc đầy đủ đã có trong memory
    }

    setIsReviewModalOpen(false);
    navigate("/create-quiz?imported=true", {
      state: { sections: targetSections, title: examTitle },
    });
  };

  // Đưa toàn bộ câu hỏi vào trang Tạo đề thi để người dùng sửa và chọn đáp án trực tiếp
  const handleSendToCreateQuiz = () => {
    if (!parseResult || parseResult.sections.length === 0) return;
    proceedToCreateQuiz(false);
  };

  const toggleSectionExpand = (tempId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [tempId]: !prev[tempId],
    }));
  };

  const handleToggleCorrectAnswer = (
    questionTempId: string,
    answerIndex: number,
  ) => {
    if (!parseResult) return;
    const updatedSections = parseResult.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        if (q.tempId !== questionTempId) return q;
        const isTurningOff = q.answers[answerIndex]?.isCorrect === true;
        const newAnswers = q.answers.map((a, idx) => {
          if (idx === answerIndex) return { ...a, isCorrect: !a.isCorrect };
          // Nếu đang BỎ chọn đáp án đúng → giữ nguyên các đáp án khác
          // Nếu đang CHỌN thêm đáp án đúng → không ảnh hưởng đáp án khác (multi-correct)
          if (isTurningOff) return a;
          return a;
        });
        return {
          ...q,
          answers: newAnswers,
        };
      }),
    }));
    updateParsedSections(updatedSections);
  };

  const handleUpdateQuestionContent = (
    questionTempId: string,
    content: string,
  ) => {
    if (!parseResult) return;
    const updatedSections = parseResult.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        if (q.tempId !== questionTempId) return q;
        return { ...q, content };
      }),
    }));
    updateParsedSections(updatedSections);
  };

  const handleUpdateOptionContent = (
    questionTempId: string,
    answerIndex: number,
    content: string,
  ) => {
    if (!parseResult) return;
    const updatedSections = parseResult.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        if (q.tempId !== questionTempId) return q;
        const newAnswers = q.answers.map((a, idx) =>
          idx === answerIndex ? { ...a, content } : a,
        );
        return { ...q, answers: newAnswers };
      }),
    }));
    updateParsedSections(updatedSections);
  };

  const handleDeleteOption = (questionTempId: string, answerIndex: number) => {
    if (!parseResult) return;
    const updatedSections = parseResult.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        if (q.tempId !== questionTempId) return q;
        if (q.answers.length <= 2) return q;
        const newAnswers = q.answers
          .filter((_, idx) => idx !== answerIndex)
          .map((a, idx) => ({ ...a, order: idx + 1 }));
        return { ...q, answers: newAnswers };
      }),
    }));
    updateParsedSections(updatedSections);
  };

  const handleMergeOptionWithPrevious = (
    questionTempId: string,
    answerIndex: number,
  ) => {
    if (!parseResult || answerIndex <= 0) return;
    const updatedSections = parseResult.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        if (q.tempId !== questionTempId) return q;
        if (answerIndex <= 0 || answerIndex >= q.answers.length) return q;
        const prevAns = q.answers[answerIndex - 1];
        const curAns = q.answers[answerIndex];
        const mergedContent =
          `${prevAns.content.trim()} ${curAns.content.trim()}`.trim();

        const newAnswers = q.answers
          .filter((_, idx) => idx !== answerIndex)
          .map((a, idx) => {
            if (idx === answerIndex - 1) {
              return {
                ...a,
                content: mergedContent,
                isCorrect: a.isCorrect || curAns.isCorrect,
                order: idx + 1,
              };
            }
            return { ...a, order: idx + 1 };
          });

        return { ...q, answers: newAnswers };
      }),
    }));
    updateParsedSections(updatedSections);
    showSuccess(
      "Đã gộp đáp án",
      "Đã gộp nội dung vào phương án liền trước và xóa đáp án thừa.",
    );
  };

  const handleOpenReviewForQuestion = (order: number) => {
    setReviewInitialQuery(`Câu ${order}`);
    setIsReviewModalOpen(true);
  };

  const handleAddOption = (questionTempId: string) => {
    if (!parseResult) return;
    const updatedSections = parseResult.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        if (q.tempId !== questionTempId) return q;
        if (q.answers.length >= 8) return q;
        const nextOrder = q.answers.length + 1;
        const newOption = {
          id: `opt-${Date.now()}-${nextOrder}`,
          content: "",
          isCorrect: false,
          order: nextOrder,
        };
        return { ...q, answers: [...q.answers, newOption] };
      }),
    }));
    updateParsedSections(updatedSections);
  };

  const handleDeleteQuestion = (questionTempId: string) => {
    if (!parseResult) return;
    const updatedSections = parseResult.sections
      .map((sec) => ({
        ...sec,
        questions: sec.questions
          .filter((q) => q.tempId !== questionTempId)
          .map((q, idx) => ({ ...q, order: idx + 1 })),
      }))
      .filter((sec) => sec.questions.length > 0);
    updateParsedSections(updatedSections);
  };

  const handleMergeDuplicateAnswers = (
    firstSectionId: string,
    secondSectionId: string,
  ) => {
    if (!parseResult) return;
    const sec1 = parseResult.sections.find((s) => s.tempId === firstSectionId);
    const sec2 = parseResult.sections.find((s) => s.tempId === secondSectionId);
    if (!sec1 || !sec2) return;

    const sec1Answers = sec1.questions.reduce(
      (sum, q) => sum + q.answers.filter((a) => a.isCorrect).length,
      0,
    );
    const sec2Answers = sec2.questions.reduce(
      (sum, q) => sum + q.answers.filter((a) => a.isCorrect).length,
      0,
    );

    const sourceSec = sec1Answers >= sec2Answers ? sec1 : sec2;
    const targetSec = sec1Answers >= sec2Answers ? sec2 : sec1;

    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, "");
    let mergedCount = 0;

    targetSec.questions.forEach((tQ) => {
      const targetFingerprint = normalize(tQ.content);
      const match = sourceSec.questions.find(
        (sQ) => normalize(sQ.content) === targetFingerprint,
      );
      if (match) {
        const correctAnswers = match.answers
          .filter((a) => a.isCorrect)
          .map((a) => a.order);
        if (correctAnswers.length > 0) {
          tQ.answers.forEach((ans) => {
            ans.isCorrect = correctAnswers.includes(ans.order);
          });
          mergedCount++;
        }
      }
    });

    dispatch({
      type: "MANUAL_PARSED",
      jobId: currentJobRef.current,
      result: {
        ...parseResult,
        sections: [...parseResult.sections],
        questions: parseResult.sections.flatMap((s) => s.questions),
      },
      rawTextPreview: state.rawTextPreview,
      examTitle: state.examTitle,
    });
    showSuccess(
      "Gộp đáp án thành công",
      `Đã gộp đáp án thành công cho ${mergedCount} câu hỏi!`,
    );
  };

  const optionLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <DashboardLayout>
      <div className="min-h-screen pb-20 max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-2">
        {/* Page Header: Tinh gọn, chuyên nghiệp, Content-First theo chuẩn HUBT EdTech */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span>Công cụ học tập</span>
              <span>/</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                Chuyển đổi đề thi
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Chuyển đổi đề thi PDF & Word sang trắc nghiệm
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Tự động nhận diện cấu trúc phân chia Phần (
              <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                PHẦN 1
              </code>
              ,{" "}
              <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                PHẦN 2
              </code>
              ), đánh số câu hỏi độc lập và xuất sang InnoQuiz.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowTemplateGuide(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tải file mẫu Word</span>
            </button>
          </div>
        </div>

        {/* Banner khi đang ở chế độ xem toàn màn hình (thu gọn bảng tải lên) */}
        {isUploadPanelCollapsed && (
          <div className="px-4 py-2.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 flex items-center justify-between text-xs transition-all">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold">
              <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Đang mở rộng toàn khung hình để xem và chỉnh sửa cấu trúc đề thi thoải mái nhất.</span>
              {fileName && <span className="text-slate-500 dark:text-slate-400 font-normal">({fileName})</span>}
            </div>
            <button
              type="button"
              onClick={() => setIsUploadPanelCollapsed(false)}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1 shrink-0 ml-2"
            >
              <span>Hiện lại bảng tải lên</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2 Cột: Khu vực nhập liệu & Bảng điều khiển */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: Nhập tệp / Dán văn bản */}
          {!isUploadPanelCollapsed && (
            <div className="lg:col-span-4 xl:col-span-3 space-y-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    1. Nhập nguồn đề thi
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplateGuide(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  Tải file mẫu
                </button>
              </div>

              {/* Upload Zone with Drag & Drop & Real-time Progress */}
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center select-none ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-100/70 dark:bg-indigo-900/40 ring-4 ring-indigo-200 dark:ring-indigo-900/50 scale-[1.01]"
                    : isReading
                      ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 cursor-wait"
                      : "border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                }`}
              >
                {isReading ? (
                  <div className="w-full max-w-xs space-y-2.5 py-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 truncate">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-indigo-600" />
                        <span className="truncate">
                          {conversionProgress?.message || "Đang xử lý tệp..."}
                        </span>
                      </span>
                      <span className="text-indigo-700 dark:text-indigo-300 font-mono text-xs font-black shrink-0 ml-2">
                        {conversionProgress?.percent ?? 10}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-indigo-100 dark:border-indigo-900/60">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 rounded-full transition-all duration-300 ease-out shadow-xs"
                        style={{
                          width: `${Math.max(6, conversionProgress?.percent ?? 10)}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
                      Đang xử lý trơn tru trên trình duyệt...
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-indigo-600 dark:text-indigo-400 transition-transform hover:scale-110" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isDragging
                          ? "Thả tệp vào đây ngay..."
                          : "Tải lên tệp PDF hoặc Word (.docx)"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Kéo thả hoặc bấm để chọn tệp .pdf, .docx, .txt
                      </p>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={isReading}
                  className="hidden"
                />
              </label>

              {fileName && (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate text-slate-800 dark:text-slate-200 font-semibold">
                    <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">{fileName}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                    Đã tải
                  </span>
                </div>
              )}

              {/* Tên đề thi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề đề thi
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) =>
                    dispatch({ type: "SET_TITLE", examTitle: e.target.value })
                  }
                  placeholder="Nhập tiêu đề bài thi..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Textarea nhập thô */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Hoặc dán văn bản thô
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {rawTextInput.length > 0
                      ? `${rawTextInput.length} ký tự`
                      : "Trống"}
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={rawTextInput}
                  onChange={(e) => setRawTextInput(e.target.value)}
                  placeholder="Dán nội dung với PHẦN 1, PHẦN 2 hoặc câu hỏi A B C D tại đây..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-[11px] leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y"
                />
              </div>

              {/* Convert Button */}
              <button
                type="button"
                onClick={handleConvert}
                disabled={isReading || !rawTextInput.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Chuyển đổi & Nhận diện</span>
              </button>
            </div>

            {/* Hướng dẫn ngắn */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Quy tắc chia phần thông minh:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li>
                  Nhận diện tự động <code className="font-mono">PHẦN 1</code>,{" "}
                  <code className="font-mono">PHẦN 2</code>,{" "}
                  <code className="font-mono">Phần I</code>,{" "}
                  <code className="font-mono">PART 1</code>.
                </li>
                <li>
                  Mỗi phần tự động đánh số lại từ <strong>Câu 1</strong> (không
                  nối số 51, 52 từ phần trước).
                </li>
                <li>
                  Hỗ trợ đáp án dấu sao{" "}
                  <code className="font-mono text-rose-500 font-bold">*</code>{" "}
                  và chuẩn <code className="font-mono">TA(1,1)</code>.
                </li>
              </ul>
            </div>
            </div>
          )}

          {/* CỘT PHẢI: Kết quả bóc tách cấu trúc đề thi */}
          <div className={`${isUploadPanelCollapsed ? "lg:col-span-12" : "lg:col-span-8 xl:col-span-9"} space-y-6 transition-all`}>
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
              {/* Header Kết quả: Rõ ràng, to đẹp, hiện đại và thoáng đãng */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 shadow-sm border border-indigo-100/80 dark:border-indigo-900/50">
                    <FolderTree className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        2. Kết quả bóc tách cấu trúc
                      </h2>
                      {parseResult && (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-[#4F46E5] dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 flex items-center gap-1.5 shadow-2xs">
                            <Layers className="w-3.5 h-3.5" />
                            {parseResult.sections.length} phần thi
                          </span>
                          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {parseResult.totalParsed} câu hỏi
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Kiểm tra cấu trúc phân chia từng phần, xem trước nội dung và chuyển thẳng vào phòng thi InnoQuiz.
                    </p>
                  </div>
                </div>

                {/* Các nút tiện ích góc phải header: Mở rộng / Thu nhỏ & Mở tất cả / Thu gọn */}
                <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                  {parseResult && parseResult.sections.length > 1 && (
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <button
                        type="button"
                        onClick={handleExpandAll}
                        className="px-2.5 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-all cursor-pointer"
                      >
                        Mở tất cả
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={handleCollapseAll}
                        className="px-2.5 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-all cursor-pointer"
                      >
                        Thu gọn
                      </button>
                    </div>
                  )}

                  {/* Nút Phóng to / Thu nhỏ layout */}
                  <button
                    type="button"
                    onClick={() => setIsUploadPanelCollapsed(!isUploadPanelCollapsed)}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                    title={isUploadPanelCollapsed ? "Hiện lại bảng tải lên" : "Mở rộng toàn màn hình"}
                  >
                    {isUploadPanelCollapsed ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Thu nhỏ</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Mở rộng</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Chế độ xem: Segmented Control to đẹp & nổi bật */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setActiveView("cards")}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeView === "cards"
                        ? "bg-white dark:bg-[#111827] text-[#4F46E5] dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Xem theo Phần</span>
                    {parseResult && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-[#4F46E5] dark:text-indigo-300 font-black">
                        {parseResult.sections.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView("text")}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeView === "text"
                        ? "bg-white dark:bg-[#111827] text-[#4F46E5] dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Văn bản A B C D</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView("json")}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeView === "json"
                        ? "bg-white dark:bg-[#111827] text-[#4F46E5] dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <FileCode2 className="w-4 h-4" />
                    <span>JSON Sections</span>
                  </button>
                </div>
              </div>

              {/* Action Toolbar: Cấu trúc 2 nhóm rõ ràng, nút bấm to rõ, không bị rớt dòng đơn độc */}
              {parseResult && parseResult.sections.length > 0 && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 shadow-2xs">
                  {/* Nhóm Xuất & Sao chép (Trái) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleExportDocx}
                      disabled={exportingDocx}
                      className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                    >
                      {exportingDocx ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      ) : (
                        <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      )}
                      <span>Tải Word (.docx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                    >
                      <FileCode2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Tải JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">
                            Đã sao chép
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span>Sao chép text</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Nhóm Hành động chính (Phải): Kiểm tra & Sửa + Đưa vào Tạo đề thi */}
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-200/70 dark:border-slate-800">
                    {unresolvedQuestionsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsReviewModalOpen(true)}
                        className="h-10 sm:h-11 px-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs shrink-0"
                        title="Xem và sửa các câu chờ chọn đáp án hoặc cần kiểm tra"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Kiểm tra & Sửa ({unresolvedQuestionsCount})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSendToCreateQuiz}
                      className="h-10 sm:h-11 px-5 sm:px-6 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <span>Đưa vào Tạo đề thi</span>
                      {unresolvedQuestionsCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-400 text-slate-900 text-xs font-black rounded-full">
                          {unresolvedQuestionsCount}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 4 Hộp Thống kê Trạng thái: Lớn hơn, rõ ràng và thẩm mỹ */}
              {parseResult?.normalized && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Thẻ 1: Sẵn sàng */}
                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        statusFilter === "READY" ? "ALL" : "READY",
                      )
                    }
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      statusFilter === "READY"
                        ? "ring-2 ring-indigo-500 border-indigo-500 bg-white dark:bg-slate-800 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Sẵn sàng
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {parseResult.normalized.statistics.validQuestions}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Đủ câu hỏi và đáp án đúng
                    </div>
                  </button>

                  {/* Thẻ 2: Chờ chọn đáp án */}
                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        statusFilter === "WAITING" ? "ALL" : "WAITING",
                      )
                    }
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      statusFilter === "WAITING"
                        ? "ring-2 ring-indigo-500 border-indigo-500 bg-white dark:bg-slate-800 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Chờ chọn đáp án
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {parseResult.normalized.statistics
                        .waitingAnswerQuestions ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Chưa đánh dấu đáp án đúng
                    </div>
                  </button>

                  {/* Thẻ 3: Cần kiểm tra */}
                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        statusFilter === "NEEDS_REVIEW"
                          ? "ALL"
                          : "NEEDS_REVIEW",
                      )
                    }
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      statusFilter === "NEEDS_REVIEW"
                        ? "ring-2 ring-indigo-500 border-indigo-500 bg-white dark:bg-slate-800 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Cần kiểm tra
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {parseResult.normalized.statistics.needsReviewQuestions}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Cần xem xét cấu trúc câu
                    </div>
                  </button>

                  {/* Thẻ 4: Không hợp lệ */}
                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        statusFilter === "INVALID" ? "ALL" : "INVALID",
                      )
                    }
                    className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                      statusFilter === "INVALID"
                        ? "ring-2 ring-indigo-500 border-indigo-500 bg-white dark:bg-slate-800 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Không hợp lệ
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {parseResult.normalized.statistics.invalidQuestions}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Thiếu nội dung câu hỏi
                    </div>
                  </button>
                </div>
              )}

              {/* Duplicate Section Detection Banner */}
              {parseResult?.normalized?.duplicateSections &&
                parseResult.normalized.duplicateSections.length > 0 && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-900 dark:border-indigo-900/70 dark:bg-indigo-950/30 dark:text-indigo-100 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                      <span>🔁 Phát hiện phần thi trùng lặp trong tệp</span>
                    </div>
                    {parseResult.normalized.duplicateSections.map(
                      (candidate, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-900/40"
                        >
                          <p className="text-[11px] leading-relaxed">
                            {candidate.message}
                          </p>
                          {candidate.canMergeAnswers && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMergeDuplicateAnswers(
                                  candidate.firstSectionId,
                                  candidate.secondSectionId,
                                )
                              }
                              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                            >
                              Gộp đáp án
                            </button>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}

              {parseResult?.normalized &&
                parseResult.normalized.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
                    <div className="mb-1 font-bold">Lưu ý cần kiểm tra</div>
                    <ul className="list-disc space-y-1 pl-4">
                      {parseResult.normalized.warnings
                        .slice(0, 5)
                        .map((warning, index) => (
                          <li key={`${warning.code}-${index}`}>
                            {warning.message}
                          </li>
                        ))}
                    </ul>
                    {parseResult.normalized.warnings.length > 5 && (
                      <div className="mt-1 text-[11px]">
                        Còn {parseResult.normalized.warnings.length - 5} lưu ý
                        khác trong JSON.
                      </div>
                    )}
                  </div>
                )}

              {parseResult?.normalized &&
                parseResult.normalized.unassignedMedia.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100">
                    <div className="font-bold">Hình ảnh chưa được gán</div>
                    <p className="mt-1">
                      Converter giữ nguyên các hình ảnh này nhưng chưa tự gán
                      vào câu hỏi vì không đủ chắc chắn về vị trí.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {parseResult.normalized.unassignedMedia.map((media) =>
                        media.dataUrl || media.url ? (
                          <img
                            key={media.tempId}
                            src={media.dataUrl || media.url}
                            alt="Hình ảnh chưa gán"
                            className="max-h-24 max-w-[180px] rounded-lg border border-rose-200 object-contain"
                          />
                        ) : (
                          <span
                            key={media.tempId}
                            className="rounded-lg bg-white/70 px-2 py-1 text-[11px]"
                          >
                            {media.assetId}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* View 1: CARDS VIEW BY SECTION */}
              {activeView === "cards" && (
                <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1 sm:pr-2">
                  {!parseResult || parseResult.sections.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                      <Layers className="w-12 h-12 mx-auto opacity-40 text-indigo-400" />
                      <p className="text-sm font-semibold">
                        Chưa có kết quả chuyển đổi.
                      </p>
                      <p className="text-xs">
                        Hãy tải lên tệp PDF/Word hoặc nhấn "Tải file mẫu" ở cột bên
                        trái.
                      </p>
                    </div>
                  ) : (
                    parseResult.sections.map((section, sIdx) => {
                      const isExpanded =
                        expandedSections[section.tempId] !== false;
                      const normalizedSection =
                        parseResult.normalized?.sections.find(
                          (item) => item.tempId === section.tempId,
                        );

                      const filteredQuestions = section.questions.filter(
                        (q) => {
                          if (statusFilter === "ALL") return true;
                          const nq = normalizedSection?.questions.find(
                            (item) => item.tempId === q.tempId,
                          );
                          const hasCorrect = q.answers.some((a) => a.isCorrect);
                          const isReady =
                            (nq?.parseStatus === "VALID" ||
                              nq?.status === "VALID" ||
                              !nq) &&
                            hasCorrect;
                          const isWaiting =
                            (nq?.parseStatus === "VALID" ||
                              nq?.status === "VALID" ||
                              !nq) &&
                            !hasCorrect;
                          if (statusFilter === "READY") return isReady;
                          if (statusFilter === "WAITING") return isWaiting;
                          if (statusFilter === "NEEDS_REVIEW")
                            return (
                              nq?.parseStatus === "NEEDS_REVIEW" ||
                              nq?.status === "NEEDS_REVIEW"
                            );
                          if (statusFilter === "INVALID")
                            return (
                              nq?.parseStatus === "INVALID" ||
                              nq?.status === "INVALID"
                            );
                          return true;
                        },
                      );

                      if (
                        statusFilter !== "ALL" &&
                        filteredQuestions.length === 0
                      )
                        return null;

                      return (
                        <div
                          key={section.tempId || sIdx}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
                        >
                          {/* Section Header Accordion: To rõ, thoáng đãng */}
                          <div
                            onClick={() => toggleSectionExpand(section.tempId)}
                            className="p-4 sm:p-5 bg-slate-50/95 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-[#4F46E5] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {sIdx + 1}
                              </span>
                              <div>
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                  {section.title}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  {filteredQuestions.length} câu hỏi{" "}
                                  {statusFilter !== "ALL"
                                    ? `(đang lọc theo trạng thái)`
                                    : `(Đánh số từ Câu 1 → Câu ${section.questions.length})`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                Phần {sIdx + 1}
                              </span>
                              <div className="w-7 h-7 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Questions inside Section */}
                          {isExpanded && (
                            <div className="p-4 sm:p-5 space-y-3.5 bg-slate-50/30 dark:bg-slate-900/30">
                              {filteredQuestions.map((q, idx) => {
                                const normalizedQuestion =
                                  normalizedSection?.questions.find(
                                    (item) => item.tempId === q.tempId,
                                  );
                                const hasCorrect = q.answers.some(
                                  (a) => a.isCorrect,
                                );
                                const isReady =
                                  (normalizedQuestion?.parseStatus ===
                                    "VALID" ||
                                    normalizedQuestion?.status === "VALID") &&
                                  hasCorrect;
                                const isWaiting =
                                  (normalizedQuestion?.parseStatus ===
                                    "VALID" ||
                                    normalizedQuestion?.status === "VALID") &&
                                  !hasCorrect;
                                const isInvalid =
                                  normalizedQuestion?.parseStatus ===
                                    "INVALID" ||
                                  normalizedQuestion?.status === "INVALID";

                                return (
                                  <div
                                    key={q.tempId || idx}
                                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 text-xs sm:text-sm"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="font-bold text-slate-900 dark:text-white leading-relaxed flex-1 text-sm">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-[#4F46E5] dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 font-extrabold text-xs mr-2 shadow-2xs">
                                          Câu {q.order || idx + 1}
                                        </span>
                                        <QuestionContentRenderer
                                          content={q.content}
                                          className="inline"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleOpenReviewForQuestion(
                                              q.order || idx + 1,
                                            )
                                          }
                                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                          title="Chỉnh sửa nội dung câu hỏi và các đáp án"
                                        >
                                          <Edit3 className="w-3 h-3 text-slate-400" />
                                          <span>Sửa</span>
                                        </button>
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                            isReady
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                                              : isWaiting
                                                ? "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
                                                : isInvalid
                                                  ? "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60"
                                                  : "bg-orange-50 text-orange-700 border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60"
                                          }`}
                                        >
                                          {isReady
                                            ? "Sẵn sàng"
                                            : isWaiting
                                              ? "Chờ chọn đáp án"
                                              : isInvalid
                                                ? "Không hợp lệ"
                                                : "Cần kiểm tra"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Ảnh của câu hỏi: ưu tiên q.media (draft), fallback normalizedQuestion.media */}
                                    {(() => {
                                      const mediaList =
                                        q.media && q.media.length > 0
                                          ? q.media
                                          : normalizedQuestion?.media &&
                                              normalizedQuestion.media.length >
                                                0
                                            ? normalizedQuestion.media
                                            : [];
                                      if (mediaList.length === 0) return null;
                                      return (
                                        <div className="flex flex-wrap gap-2 rounded-xl border border-sky-100 bg-sky-50/50 p-2 dark:border-sky-900/50 dark:bg-sky-950/20">
                                          {mediaList.map((media, mIdx) =>
                                            media.dataUrl || media.url ? (
                                              <img
                                                key={media.tempId || mIdx}
                                                src={getMediaUrl(
                                                  media.dataUrl || media.url,
                                                )}
                                                alt="Hình minh họa của câu hỏi"
                                                className="max-h-40 max-w-full rounded-lg object-contain"
                                              />
                                            ) : (
                                              <div
                                                key={media.tempId || mIdx}
                                                className="rounded-lg bg-slate-100 px-3 py-2 text-[11px] text-slate-500"
                                              >
                                                Hình ảnh chưa có bản xem trước
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {/* Danh sách các đáp án A B C D */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                      {q.answers.map((ans, aIdx) => {
                                        const letter =
                                          optionLabels[aIdx] ||
                                          String.fromCharCode(65 + aIdx);
                                        const isCorrect = ans.isCorrect;

                                        const normalizedOption =
                                          normalizedQuestion?.options[aIdx];
                                        return (
                                          <div
                                            key={aIdx}
                                            onClick={() =>
                                              q.tempId &&
                                              handleToggleCorrectAnswer(
                                                q.tempId,
                                                aIdx,
                                              )
                                            }
                                            title="Bấm để chọn/bỏ chọn làm đáp án đúng"
                                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all cursor-pointer select-none hover:border-indigo-300 dark:hover:border-indigo-700 ${
                                              isCorrect
                                                ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs"
                                                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                                            }`}
                                          >
                                            <span
                                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                                                isCorrect
                                                  ? "bg-emerald-600 text-white"
                                                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                              }`}
                                            >
                                              {letter}
                                            </span>

                                            <div className="flex-1 min-w-0 text-xs leading-relaxed break-words font-normal">
                                              <QuestionContentRenderer
                                                content={ans.content}
                                              />
                                              {normalizedOption?.media.map(
                                                (media) =>
                                                  media.dataUrl || media.url ? (
                                                    <img
                                                      key={media.tempId}
                                                      src={getMediaUrl(
                                                        media.dataUrl ||
                                                          media.url,
                                                      )}
                                                      alt={`Hình ảnh đáp án ${letter}`}
                                                      className="mt-2 max-h-28 max-w-full rounded-lg object-contain"
                                                    />
                                                  ) : null,
                                              )}
                                            </div>

                                            {isCorrect && (
                                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0 flex items-center gap-1 mt-0.5">
                                                <Check className="w-3.5 h-3.5" />{" "}
                                                Đúng
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* View 2: STANDARD TEXT A B C D */}
              {activeView === "text" && (
                <div>
                  <textarea
                    rows={18}
                    readOnly
                    value={
                      parseResult && parseResult.sections.length > 0
                        ? formatQuestionsToStandardText(parseResult.sections)
                        : "Chưa có dữ liệu."
                    }
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-xs leading-relaxed focus:outline-none"
                  />
                </div>
              )}

              {/* View 3: JSON VIEW */}
              {activeView === "json" && (
                <div>
                  <textarea
                    rows={18}
                    readOnly
                    value={
                      parseResult && parseResult.sections.length > 0
                        ? JSON.stringify(
                            { sections: parseResult.sections },
                            null,
                            2,
                          )
                        : "{}"
                    }
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-xs leading-relaxed focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <TemplateGuideModal
        open={showTemplateGuide}
        onClose={() => setShowTemplateGuide(false)}
      />
      {parseResult && (
        <QuestionReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          sections={parseResult.sections}
          normalizedResult={parseResult.normalized}
          rawText={state.rawTextPreview || rawTextInput}
          initialSearchQuery={reviewInitialQuery}
          onToggleCorrectAnswer={handleToggleCorrectAnswer}
          onUpdateQuestionContent={handleUpdateQuestionContent}
          onUpdateOptionContent={handleUpdateOptionContent}
          onDeleteOption={handleDeleteOption}
          onMergeOptionWithPrevious={handleMergeOptionWithPrevious}
          onAddOption={handleAddOption}
          onDeleteQuestion={handleDeleteQuestion}
          onConfirmSend={proceedToCreateQuiz}
        />
      )}
    </DashboardLayout>
  );
};

export default PdfConverterPage;
