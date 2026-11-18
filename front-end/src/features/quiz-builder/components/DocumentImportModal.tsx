import React, { useState } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Code,
  Copy,
  Layers,
  ArrowRight,
  Info,
  Loader2,
  FileCheck,
} from "lucide-react";
import {
  parseQuestionsFromText,
  parseQuestionsFromJson,
  type ParseResult,
} from "../../../utils/questionParser";
import { readDocumentFile } from "../../../utils/fileDocumentReader";
import type { QuestionDraft } from "../../../types/quiz.types";
import { convertDocumentBlocks, converterResultToParseResult } from "../../converter";

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: QuestionDraft[], replace: boolean) => void;
  existingCount: number;
}

const SAMPLE_TEXT = `Câu 1: React Hook nào dùng để quản lý state trong Functional Component?
*A. useState
B. useEffect
C. useReducer
D. useCallback
Đáp án: A

Câu 2: HTML là một ngôn ngữ lập trình.
A. Đúng
*B. Sai
Đáp án: B

Câu 3: Đâu là cổng mặc định của HTTP?
A. 21
B. 22
*C. 80
D. 443
`;

const SAMPLE_JSON = `[
  {
    "content": "Cơ sở dữ liệu quan hệ tổ chức dữ liệu dưới dạng gì?",
    "type": "MULTIPLE_CHOICE",
    "points": 1,
    "answers": [
      { "content": "Bảng (Tables) gồm các hàng và cột", "isCorrect": true },
      { "content": "Cây thư mục (Trees)", "isCorrect": false },
      { "content": "Đồ thị (Graphs)", "isCorrect": false },
      { "content": "Tài liệu JSON (Documents)", "isCorrect": false }
    ]
  }
]`;

export const DocumentImportModal: React.FC<DocumentImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingCount,
}) => {
  const [activeTab, setActiveTab] = useState<"text" | "json">("text");
  const [inputText, setInputText] = useState<string>("");
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileTypeBadge, setFileTypeBadge] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!inputText.trim()) {
      setParseResult({
        success: false,
        sections: [],
        questions: [],
        errors: ["Vui lòng dán nội dung hoặc chọn tệp đề thi trước khi phân tích."],
        totalParsed: 0,
        validCount: 0,
        warningCount: 1,
      });
      return;
    }

    if (activeTab === "text") {
      setParseResult(parseQuestionsFromText(inputText));
    } else {
      setParseResult(parseQuestionsFromJson(inputText));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    setUploadedFileName(file.name);
    try {
      const { text, type, blocks } = await readDocumentFile(file);
      setInputText(text);
      setFileTypeBadge(type.toUpperCase());
      if (type === "json") {
        setActiveTab("json");
        setParseResult(parseQuestionsFromJson(text));
      } else {
        setActiveTab("text");
        setParseResult(converterResultToParseResult(convertDocumentBlocks(blocks, file.name.replace(/\.[^/.]+$/, ""))));
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      console.error("Lỗi khi đọc file tài liệu:", err);
      setParseResult({
        success: false,
        sections: [],
        questions: [],
        errors: [`Không thể đọc tệp ${file.name}: ${apiError.message || "Lỗi cấu trúc tệp"}`],
        totalParsed: 0,
        validCount: 0,
        warningCount: 1,
      });
    } finally {
      setIsReadingFile(false);
      e.target.value = "";
    }
  };

  const handleApply = () => {
    if (!parseResult || parseResult.questions.length === 0) return;
    onImport(parseResult.questions, replaceExisting);
    onClose();
  };

  const loadSample = () => {
    setUploadedFileName(null);
    setFileTypeBadge(null);
    if (activeTab === "text") {
      setInputText(SAMPLE_TEXT);
      setParseResult(parseQuestionsFromText(SAMPLE_TEXT));
    } else {
      setInputText(SAMPLE_JSON);
      setParseResult(parseQuestionsFromJson(SAMPLE_JSON));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Nhập câu hỏi tự động (Document & PDF Import)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hỗ trợ trích xuất từ PDF (.pdf), Word (.docx), Notepad (.txt) hoặc JSON (.json)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Navigation Tabs & File Uploader */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("text");
                  setParseResult(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "text"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Văn bản (PDF / Word / TXT)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("json");
                  setParseResult(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "json"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Cấu trúc JSON
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                {isReadingFile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                )}
                <span>{isReadingFile ? "Đang đọc tệp..." : "Tải tệp (.pdf, .docx, .txt, .json)"}</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.json"
                  onChange={handleFileUpload}
                  disabled={isReadingFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={loadSample}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Mẫu thử
              </button>
            </div>
          </div>

          {/* Uploaded File Banner */}
          {uploadedFileName && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Đã tải tệp: <strong>{uploadedFileName}</strong>
                </span>
                {fileTypeBadge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-200/60 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                    {fileTypeBadge}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedFileName(null);
                  setFileTypeBadge(null);
                }}
                className="text-emerald-700 hover:text-emerald-900 dark:hover:text-emerald-100 font-semibold cursor-pointer"
              >
                Đổi tệp khác
              </button>
            </div>
          )}

          {/* Guide banner */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Định dạng hỗ trợ trích xuất tự động:</p>
              <p className="text-slate-600 dark:text-slate-300">
                Hệ thống tự động đọc nội dung trực tiếp từ file <strong>PDF</strong>, tài liệu <strong>Word (.docx)</strong> hoặc văn bản Notepad (bao gồm mã <code className="font-mono bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded">TA(1,1)=...</code> từ EduQuiz). Đặt dấu <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold text-indigo-600 dark:text-indigo-300">*</code> trước đáp án đúng hoặc thêm dòng <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold text-indigo-600 dark:text-indigo-300">Đáp án: B</code> ở mỗi câu.
              </p>
              <p className="pt-1 text-[11px] text-indigo-700 dark:text-indigo-300">
                👉 Cần xuất đề EduQuiz/PDF ra file Word (.docx) hoặc JSON riêng?{" "}
                <a
                  href="/converter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline hover:text-indigo-900 dark:hover:text-white"
                >
                  Mở trang Công cụ Chuyển đổi đề EduQuiz ↗
                </a>
              </p>
            </div>
          </div>

          {/* Text input area */}
          <div>
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeTab === "text"
                  ? "Dán nội dung câu hỏi hoặc tải lên tệp PDF/Word tại đây...\n\nVí dụ:\nCâu 1: React Hook nào dùng để quản lý state?\n*A. useState\nB. useEffect\nC. useReducer\nD. useCallback\nĐáp án: A"
                  : "Dán mảng JSON các câu hỏi tại đây..."
              }
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 font-mono text-xs leading-relaxed focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y"
            />
          </div>

          {/* Parse Trigger Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleParse}
              disabled={isReadingFile}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Phân tích cú pháp câu hỏi</span>
            </button>

            {parseResult && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã nhận diện: {parseResult.totalParsed} câu
                </span>
                {parseResult.warningCount > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    {parseResult.warningCount} lưu ý
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Parse Result Preview */}
          {parseResult && parseResult.questions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Kết quả xem trước ({parseResult.questions.length} câu)
              </h3>
              <div className="space-y-2.5 max-h-60 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                {parseResult.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">
                        <span className="text-indigo-600 dark:text-indigo-400">Câu {idx + 1}:</span> {q.content}
                      </p>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                        {q.type === "TRUE_FALSE" ? "Đúng / Sai" : "Trắc nghiệm"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {q.answers.map((a, aIdx) => (
                        <div
                          key={aIdx}
                          className={`px-2.5 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium border ${
                            a.isCorrect
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                              : "bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/40"
                          }`}
                        >
                          <span className="font-bold uppercase">
                            {String.fromCharCode(65 + aIdx)}.
                          </span>
                          <span className="truncate">{a.content}</span>
                          {a.isCorrect && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Mode Selection */}
          {parseResult && parseResult.questions.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Đề thi hiện tại đang có <strong className="text-indigo-600 dark:text-indigo-400">{existingCount}</strong> câu hỏi
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="importMode"
                    checked={!replaceExisting}
                    onChange={() => setReplaceExisting(false)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  Nối tiếp ({existingCount + parseResult.questions.length} câu)
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-rose-600 dark:text-rose-400">
                  <input
                    type="radio"
                    name="importMode"
                    checked={replaceExisting}
                    onChange={() => setReplaceExisting(true)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  Ghi đè ({parseResult.questions.length} câu)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!parseResult || parseResult.questions.length === 0}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>Nhập {parseResult?.questions.length || 0} câu hỏi vào đề</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
