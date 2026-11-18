import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Download,
  ArrowRight,
  FileCheck,
  RefreshCw,
  Sparkles,
  Layers,
  Info,
} from "lucide-react";
import type { Major } from "../../../types/academic.interface";
import {
  parseMajorExcelFile,
  exportMajorSampleExcel,
  type MajorExcelParseResult,
  type ParsedMajorRow,
} from "../services/majorExcelParser.service";
import { majorApi } from "../../../services/api/Major.api";
import { useNotification } from "../../../components/Notification";

interface ImportMajorsExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingMajors: Major[];
}

export const ImportMajorsExcelModal: React.FC<ImportMajorsExcelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingMajors,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<MajorExcelParseResult | null>(null);
  const [rows, setRows] = useState<ParsedMajorRow[]>([]);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Column mapping override
  const [customCodeCol, setCustomCodeCol] = useState<number>(-1);
  const [customNameCol, setCustomNameCol] = useState<number>(-1);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      showError("Tệp không hợp lệ", "Vui lòng chọn tệp định dạng Excel (.xlsx, .xls) hoặc CSV!");
      return;
    }

    try {
      setSelectedFile(file);
      setParsing(true);
      const res = await parseMajorExcelFile(file, existingMajors);
      setParseResult(res);
      setRows(res.rows);
      setCustomCodeCol(res.detectedColumns.codeColIndex);
      setCustomNameCol(res.detectedColumns.nameColIndex);

      if (res.rows.length === 0) {
        showWarning("Không có dữ liệu", "Không tìm thấy dòng dữ liệu ngành hợp lệ nào trong tệp.");
      } else {
        showSuccess(
          "Nhận diện thành công",
          `Đã phân tích ${res.rows.length} dòng dữ liệu (${res.summary.validNewCount} ngành mới)`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể đọc tệp Excel!";
      showError("Lỗi đọc tệp", msg);
      setSelectedFile(null);
      setParseResult(null);
      setRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isSelected: !r.isSelected } : r))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setRows((prev) =>
      prev.map((r) =>
        r.status !== "INVALID" ? { ...r, isSelected: select } : r
      )
    );
  };

  const handleApplyColumnMapping = async (codeIdx: number, nameIdx: number) => {
    if (!selectedFile) return;
    try {
      setParsing(true);
      setCustomCodeCol(codeIdx);
      setCustomNameCol(nameIdx);
      // Re-run with custom columns
      const res = await parseMajorExcelFile(
        selectedFile,
        existingMajors,
        parseResult?.selectedSheet
      );
      // Áp dụng chỉ số cột mới
      res.detectedColumns.codeColIndex = codeIdx;
      res.detectedColumns.nameColIndex = nameIdx;
      setParseResult(res);
      setRows(res.rows);
    } catch {
      showError("Lỗi", "Không thể áp dụng cấu hình cột.");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmitImport = async () => {
    const selectedRows = rows.filter((r) => r.isSelected && r.status !== "INVALID");
    if (selectedRows.length === 0) {
      showWarning("Chưa chọn dữ liệu", "Vui lòng chọn ít nhất 1 ngành hợp lệ để nhập vào hệ thống.");
      return;
    }

    try {
      setSubmitting(true);
      const items = selectedRows.map((r, idx) => ({
        code: r.code,
        name: r.name,
        description: r.description,
        status: "ACTIVE" as const,
        allowRegistration: true,
        displayOrder: existingMajors.length + idx + 1,
      }));

      const res = await majorApi.bulkImportMajors({
        items,
        updateExisting,
      });

      showSuccess(
        "Nhập dữ liệu thành công!",
        `Đã tạo mới: ${res.created} ngành, Cập nhật: ${res.updated} ngành, Bỏ qua: ${res.skipped}`
      );
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      showError(
        "Lỗi nhập dữ liệu",
        apiErr.response?.data?.message || "Đã xảy ra lỗi khi lưu vào cơ sở dữ liệu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParseResult(null);
    setRows([]);
    setCustomCodeCol(-1);
    setCustomNameCol(-1);
    onClose();
  };

  const validSelectedCount = rows.filter((r) => r.isSelected && r.status !== "INVALID").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Nhập danh sách Ngành học từ Excel
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Tự động nhận diện
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chỉ cần 2 cột <strong>Mã ngành</strong> và <strong>Tên ngành</strong> (thuật toán tự động tìm và khớp cột thông minh)
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Upload Zone if no file yet */}
          {!parseResult && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/20"
                    : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-sm">
                  {parsing ? (
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8" />
                  )}
                </div>

                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  {parsing ? "Đang nhận diện dữ liệu Excel..." : "Kéo thả tệp Excel vào đây hoặc Nhấp để chọn tệp"}
                </h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  Hỗ trợ định dạng <strong>.xlsx, .xls, .csv</strong>. Thuật toán sẽ tự động quét hàng tiêu đề và nhận diện cột Mã & Tên ngành.
                </p>

                <div className="mt-5 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Nhận diện Header tự động
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Đối chiếu trùng mã
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Bỏ qua dòng rác/footer
                  </span>
                </div>
              </div>

              {/* Download sample action */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Chưa có file mẫu?
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tải file Excel mẫu chuẩn HUBT gồm 2 cột Mã ngành & Tên ngành
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={exportMajorSampleExcel}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors"
                >
                  <Download className="h-4 w-4" /> Tải file mẫu (.xlsx)
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Recognition Results & Preview */}
          {parseResult && (
            <div className="space-y-5">
              {/* File Info & Confidence Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {parseResult.fileName}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          parseResult.confidence === "HIGH"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        }`}
                      >
                        {parseResult.confidence === "HIGH" ? "Nhận diện độ chính xác cao" : "Nhận diện cơ bản"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {parseResult.detectedHeaderRow >= 0
                        ? `Dòng tiêu đề: Dòng ${parseResult.detectedHeaderRow + 1}`
                        : "Không có dòng tiêu đề (nhận diện theo đặc trưng dữ liệu)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setParseResult(null);
                      setRows([]);
                    }}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Chọn file khác
                  </button>
                </div>
              </div>

              {/* Column Mapping Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-indigo-50/50 p-4 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cột Mã ngành (Bắt buộc):
                  </label>
                  <select
                    value={customCodeCol}
                    onChange={(e) => {
                      const newCode = Number(e.target.value);
                      handleApplyColumnMapping(newCode, customNameCol);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {parseResult.detectedColumns.columnHeaders.map((col, idx) => (
                      <option key={idx} value={idx}>
                        Cột {String.fromCharCode(65 + idx)}: {col || `(Trống)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cột Tên ngành (Bắt buộc):
                  </label>
                  <select
                    value={customNameCol}
                    onChange={(e) => {
                      const newName = Number(e.target.value);
                      handleApplyColumnMapping(customCodeCol, newName);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {parseResult.detectedColumns.columnHeaders.map((col, idx) => (
                      <option key={idx} value={idx}>
                        Cột {String.fromCharCode(65 + idx)}: {col || `(Trống)`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stats Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Tổng số dòng</span>
                    <Layers className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {parseResult.summary.totalRows}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Ngành mới</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {parseResult.summary.validNewCount}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Đã tồn tại</span>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">
                    {parseResult.summary.existsCount}
                  </p>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/50 dark:bg-rose-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Lỗi / Trùng</span>
                    <XCircle className="h-4 w-4 text-rose-600" />
                  </div>
                  <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-400">
                    {parseResult.summary.invalidCount + parseResult.summary.duplicateInFileCount}
                  </p>
                </div>
              </div>

              {/* Options & Table Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tự động cập nhật tên & mô tả nếu mã ngành đã tồn tại trong hệ thống</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="max-h-[320px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="w-10 px-3 py-2.5 text-center">#</th>
                      <th className="w-28 px-3 py-2.5 font-bold">Mã ngành</th>
                      <th className="px-3 py-2.5 font-bold">Tên ngành</th>
                      <th className="px-3 py-2.5 font-bold">Mô tả</th>
                      <th className="w-36 px-3 py-2.5 font-bold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          !row.isSelected ? "opacity-60 bg-slate-50/40" : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.isSelected}
                            disabled={row.status === "INVALID"}
                            onChange={() => handleToggleSelectRow(row.id)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-30 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-white">
                          {row.code || <span className="text-rose-500 italic">Trống</span>}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                          {row.name || <span className="text-rose-500 italic">Trống</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                          {row.description || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {row.status === "VALID_NEW" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="h-3 w-3" /> Mới
                            </span>
                          )}
                          {row.status === "EXISTS" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800" title={`Đã có: ${row.existingMajorName}`}>
                              <AlertTriangle className="h-3 w-3" /> Đã tồn tại
                            </span>
                          )}
                          {row.status === "DUPLICATE_IN_FILE" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800" title={row.error}>
                              <XCircle className="h-3 w-3" /> Trùng trong file
                            </span>
                          )}
                          {row.status === "INVALID" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800" title={row.error}>
                              <XCircle className="h-3 w-3" /> {row.error || "Lỗi"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500">
            {parseResult && (
              <span>
                Đã chọn <strong>{validSelectedCount}</strong> / {rows.length} ngành hợp lệ
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>

            {parseResult && (
              <button
                type="button"
                onClick={handleSubmitImport}
                disabled={submitting || validSelectedCount === 0}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang nhập dữ liệu...
                  </>
                ) : (
                  <>
                    <span>Tiến hành nhập {validSelectedCount} ngành</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportMajorsExcelModal;
