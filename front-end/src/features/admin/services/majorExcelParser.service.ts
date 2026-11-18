import * as XLSX from "xlsx";
import type { Major } from "../../../types/academic.interface";

export interface ParsedMajorRow {
  id: string;
  rowNumber: number;
  code: string;
  name: string;
  description?: string;
  status: "VALID_NEW" | "EXISTS" | "DUPLICATE_IN_FILE" | "INVALID";
  error?: string;
  existingMajorName?: string;
  isSelected: boolean;
}

export interface MajorExcelParseResult {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  detectedHeaderRow: number;
  detectedColumns: {
    codeColIndex: number;
    nameColIndex: number;
    descColIndex: number;
    columnHeaders: string[];
  };
  confidence: "HIGH" | "MEDIUM" | "LOW";
  rows: ParsedMajorRow[];
  summary: {
    totalRows: number;
    validNewCount: number;
    existsCount: number;
    duplicateInFileCount: number;
    invalidCount: number;
  };
}

/**
 * Loại bỏ dấu tiếng Việt và chuẩn hóa để so khớp từ khóa
 */
function normalizeKeyword(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Kiểm tra xem chuỗi có phải từ khóa của cột Mã ngành không
 */
function isCodeKeyword(text: string): boolean {
  const norm = normalizeKeyword(text);
  if (!norm) return false;
  return (
    norm === "ma nganh" ||
    norm === "ma nganh hoc" ||
    norm === "ma chuyen nganh" ||
    norm === "ma hoc phan" ||
    norm === "ma" ||
    norm === "code" ||
    norm === "major code" ||
    norm === "majorcode" ||
    norm === "manganh" ||
    norm === "stt ma" ||
    norm === "stt / ma" ||
    norm === "ky hieu" ||
    norm === "id"
  );
}

/**
 * Kiểm tra xem chuỗi có phải từ khóa của cột Tên ngành không
 */
function isNameKeyword(text: string): boolean {
  const norm = normalizeKeyword(text);
  if (!norm) return false;
  return (
    norm === "ten nganh" ||
    norm === "ten nganh hoc" ||
    norm === "ten chuyen nganh" ||
    norm === "ten nganh dao tao" ||
    norm === "nganh hoc" ||
    norm === "nganh dao tao" ||
    norm === "chuyen nganh" ||
    norm === "ten" ||
    norm === "name" ||
    norm === "major name" ||
    norm === "majorname" ||
    norm === "tennganh"
  );
}

/**
 * Kiểm tra xem chuỗi có phải từ khóa của cột Mô tả / Ghi chú không
 */
function isDescKeyword(text: string): boolean {
  const norm = normalizeKeyword(text);
  if (!norm) return false;
  return (
    norm === "mo ta" ||
    norm === "ghi chu" ||
    norm === "description" ||
    norm === "note" ||
    norm === "notes" ||
    norm === "thong tin them"
  );
}

/**
 * Phát hiện dòng footer hành chính không phải dữ liệu ngành
 */
function isAdministrativeFooterRow(rowValues: string[]): boolean {
  const combined = normalizeKeyword(rowValues.join(" "));
  const footerKeywords = [
    "nguoi lap bieu",
    "nguoi lap",
    "truong phong",
    "truong khoa",
    "ban giam hieu",
    "ha noi ngay",
    "tong so",
    "ghi chu:",
    "luu y:",
    "xac nhan cua",
  ];
  return footerKeywords.some((kw) => combined.includes(kw));
}

/**
 * Đánh giá điểm xem một cột dữ liệu có đặc trưng của Mã Ngành không
 * (chuỗi ngắn 2-15 ký tự, không dấu, chữ hoa, số, ít khoảng trắng)
 */
function scoreColumnAsCode(values: string[]): number {
  if (values.length === 0) return 0;
  let matches = 0;
  for (const val of values) {
    const trimmed = (val || "").trim();
    if (!trimmed) continue;
    // Mã thường có độ dài 2-15 ký tự, chữ/số/gạch ngang
    if (trimmed.length >= 2 && trimmed.length <= 15 && !trimmed.includes("\n")) {
      const isAlphanumericCode = /^[A-Za-z0-9_.-]+$/.test(trimmed);
      const isShortWord = trimmed.split(/\s+/).length <= 2;
      if (isAlphanumericCode || isShortWord) {
        matches++;
      }
    }
  }
  return matches / values.length;
}

/**
 * Đánh giá điểm xem một cột dữ liệu có đặc trưng của Tên Ngành không
 * (chuỗi dài hơn, chứa từ 2-10 từ tiếng Việt)
 */
function scoreColumnAsName(values: string[]): number {
  if (values.length === 0) return 0;
  let matches = 0;
  for (const val of values) {
    const trimmed = (val || "").trim();
    if (!trimmed) continue;
    const wordCount = trimmed.split(/\s+/).length;
    if (trimmed.length >= 4 && wordCount >= 2 && wordCount <= 12) {
      matches++;
    }
  }
  return matches / values.length;
}

/**
 * Thuật toán chính: Đọc và nhận diện dữ liệu Excel thông minh
 */
export async function parseMajorExcelFile(
  file: File,
  existingMajors: Major[] = [],
  targetSheetName?: string
): Promise<MajorExcelParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true, raw: false });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("Tệp Excel không chứa bảng tính (Sheet) nào!");
  }

  const sheetNames = workbook.SheetNames;
  const selectedSheet = targetSheetName && sheetNames.includes(targetSheetName)
    ? targetSheetName
    : sheetNames[0];

  const worksheet = workbook.Sheets[selectedSheet];
  const matrix: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (!matrix || matrix.length === 0) {
    throw new Error("Bảng tính được chọn không có dữ liệu!");
  }

  // Chuyển toàn bộ sang string matrix
  const stringMatrix: string[][] = matrix.map((row) =>
    Array.isArray(row) ? row.map((cell) => (cell !== null && cell !== undefined ? String(cell).trim() : "")) : []
  );

  // 1. TÌM DÒNG HEADER
  let detectedHeaderRow = -1;
  let codeColIndex = -1;
  let nameColIndex = -1;
  let descColIndex = -1;
  let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";

  const maxScanRows = Math.min(15, stringMatrix.length);

  for (let r = 0; r < maxScanRows; r++) {
    const row = stringMatrix[r];
    let tempCodeCol = -1;
    let tempNameCol = -1;
    let tempDescCol = -1;

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell) continue;

      if (isCodeKeyword(cell) && tempCodeCol === -1) {
        tempCodeCol = c;
      } else if (isNameKeyword(cell) && tempNameCol === -1) {
        tempNameCol = c;
      } else if (isDescKeyword(cell) && tempDescCol === -1) {
        tempDescCol = c;
      }
    }

    // Nếu tìm thấy cả Mã và Tên trong cùng 1 dòng
    if (tempCodeCol !== -1 && tempNameCol !== -1 && tempCodeCol !== tempNameCol) {
      detectedHeaderRow = r;
      codeColIndex = tempCodeCol;
      nameColIndex = tempNameCol;
      descColIndex = tempDescCol;
      confidence = "HIGH";
      break;
    }
  }

  // Nếu không tìm thấy dòng có cả 2, tìm dòng có ít nhất 1 từ khóa rõ ràng
  if (detectedHeaderRow === -1) {
    for (let r = 0; r < maxScanRows; r++) {
      const row = stringMatrix[r];
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (isCodeKeyword(cell) && codeColIndex === -1) {
          codeColIndex = c;
          detectedHeaderRow = r;
        }
        if (isNameKeyword(cell) && nameColIndex === -1) {
          nameColIndex = c;
          detectedHeaderRow = r;
        }
      }
    }
  }

  // 2. NẾU KHÔNG CÓ HEADER (BẢNG TRẦN) -> DÙNG HEURISTIC ĐẶC TRƯNG CỘT
  if (codeColIndex === -1 || nameColIndex === -1) {
    const startRow = detectedHeaderRow !== -1 ? detectedHeaderRow + 1 : 0;
    const sampleRows = stringMatrix.slice(startRow, startRow + 10);

    const maxCols = Math.max(...sampleRows.map((r) => r.length), 0);
    const colScores: Array<{ col: number; codeScore: number; nameScore: number }> = [];

    for (let c = 0; c < maxCols; c++) {
      const colValues = sampleRows.map((r) => r[c] || "");
      colScores.push({
        col: c,
        codeScore: scoreColumnAsCode(colValues),
        nameScore: scoreColumnAsName(colValues),
      });
    }

    // Chọn cột có codeScore cao nhất
    if (codeColIndex === -1) {
      const bestCode = [...colScores].sort((a, b) => b.codeScore - a.codeScore)[0];
      if (bestCode && bestCode.codeScore > 0.4) {
        codeColIndex = bestCode.col;
      }
    }

    // Chọn cột có nameScore cao nhất (khác codeColIndex)
    if (nameColIndex === -1) {
      const bestName = [...colScores]
        .filter((s) => s.col !== codeColIndex)
        .sort((a, b) => b.nameScore - a.nameScore)[0];
      if (bestName && bestName.nameScore > 0.4) {
        nameColIndex = bestName.col;
      }
    }

    // Fallback mặc định: Cột 0 là Mã, Cột 1 là Tên (hoặc Cột 1 là Mã, Cột 2 là Tên nếu Cột 0 là STT)
    if (codeColIndex === -1 && nameColIndex === -1) {
      if (maxCols >= 2) {
        // Kiểm tra xem cột 0 có phải số thứ tự không (1, 2, 3...)
        const col0IsSeq = sampleRows.every((r) => /^\d+$/.test(r[0] || ""));
        if (col0IsSeq && maxCols >= 3) {
          codeColIndex = 1;
          nameColIndex = 2;
        } else {
          codeColIndex = 0;
          nameColIndex = 1;
        }
        confidence = "MEDIUM";
      }
    }
  }

  // Tiêu đề các cột để hiển thị UI
  const headerRow = detectedHeaderRow >= 0 ? stringMatrix[detectedHeaderRow] : [];
  const maxColCount = Math.max(...stringMatrix.map((r) => r.length), 0);
  const columnHeaders: string[] = [];
  for (let c = 0; c < maxColCount; c++) {
    const hText = headerRow[c] || `Cột ${String.fromCharCode(65 + c)}`;
    columnHeaders.push(hText);
  }

  // 3. TRÍCH XUẤT DỮ LIỆU TỪNG DÒNG (ROWS EXTRACTION)
  const dataStartRow = detectedHeaderRow >= 0 ? detectedHeaderRow + 1 : 0;
  const parsedRows: ParsedMajorRow[] = [];
  const seenCodesInFile = new Map<string, number>();

  const existingCodeMap = new Map<string, Major>();
  for (const m of existingMajors) {
    existingCodeMap.set(m.code.toUpperCase().trim(), m);
  }

  let rowCounter = 0;

  for (let r = dataStartRow; r < stringMatrix.length; r++) {
    const row = stringMatrix[r];
    if (!row || row.length === 0) continue;

    // Bỏ qua dòng trống hoàn toàn
    const isAllBlank = row.every((c) => !c || c.trim() === "");
    if (isAllBlank) continue;

    // Bỏ qua dòng footer hành chính
    if (isAdministrativeFooterRow(row)) continue;

    const rawCode = codeColIndex >= 0 && row[codeColIndex] ? row[codeColIndex].trim() : "";
    const rawName = nameColIndex >= 0 && row[nameColIndex] ? row[nameColIndex].trim() : "";
    const rawDesc = descColIndex >= 0 && row[descColIndex] ? row[descColIndex].trim() : "";

    // Bỏ qua nếu cả 2 cột đều trống
    if (!rawCode && !rawName) continue;

    rowCounter++;
    const cleanCode = rawCode.toUpperCase().replace(/\s+/g, "");
    const cleanName = rawName.replace(/\s+/g, " ");

    let status: ParsedMajorRow["status"] = "VALID_NEW";
    let error: string | undefined;
    let existingMajorName: string | undefined;

    if (!cleanCode) {
      status = "INVALID";
      error = "Thiếu mã ngành";
    } else if (!cleanName) {
      status = "INVALID";
      error = "Thiếu tên ngành";
    } else if (seenCodesInFile.has(cleanCode)) {
      status = "DUPLICATE_IN_FILE";
      error = `Trùng mã với dòng ${seenCodesInFile.get(cleanCode)}`;
    } else if (existingCodeMap.has(cleanCode)) {
      status = "EXISTS";
      existingMajorName = existingCodeMap.get(cleanCode)?.name;
    } else {
      status = "VALID_NEW";
      seenCodesInFile.set(cleanCode, r + 1);
    }

    parsedRows.push({
      id: `imported-row-${r + 1}`,
      rowNumber: r + 1,
      code: cleanCode,
      name: cleanName,
      description: rawDesc || undefined,
      status,
      error,
      existingMajorName,
      isSelected: status === "VALID_NEW" || status === "EXISTS",
    });
  }

  const validNewCount = parsedRows.filter((r) => r.status === "VALID_NEW").length;
  const existsCount = parsedRows.filter((r) => r.status === "EXISTS").length;
  const duplicateInFileCount = parsedRows.filter((r) => r.status === "DUPLICATE_IN_FILE").length;
  const invalidCount = parsedRows.filter((r) => r.status === "INVALID").length;

  return {
    fileName: file.name,
    sheetNames,
    selectedSheet,
    detectedHeaderRow,
    detectedColumns: {
      codeColIndex,
      nameColIndex,
      descColIndex,
      columnHeaders,
    },
    confidence,
    rows: parsedRows,
    summary: {
      totalRows: parsedRows.length,
      validNewCount,
      existsCount,
      duplicateInFileCount,
      invalidCount,
    },
  };
}

/**
 * Tạo và tải xuống file Excel mẫu chuẩn (.xlsx)
 */
export function exportMajorSampleExcel(): void {
  const sampleData = [
    {
      "Mã ngành": "CNTT",
      "Tên ngành": "Công nghệ thông tin",
      "Mô tả": "Khoa Công nghệ thông tin - Đào tạo Kỹ sư & Cử nhân CNTT HUBT",
    },
    {
      "Mã ngành": "KTPM",
      "Tên ngành": "Kỹ thuật phần mềm",
      "Mô tả": "Chuyên ngành Phát triển Phần mềm & Hệ thống Thông tin",
    },
    {
      "Mã ngành": "QTKD",
      "Tên ngành": "Quản trị kinh doanh",
      "Mô tả": "Khoa Quản trị kinh doanh HUBT",
    },
    {
      "Mã ngành": "TCNH",
      "Tên ngành": "Tài chính - Ngân hàng",
      "Mô tả": "Khoa Tài chính Ngân hàng HUBT",
    },
    {
      "Mã ngành": "KETOAN",
      "Tên ngành": "Kế toán",
      "Mô tả": "Khoa Kế toán - Kiểm toán HUBT",
    },
    {
      "Mã ngành": "NNA",
      "Tên ngành": "Ngôn ngữ Anh",
      "Mô tả": "Khoa Tiếng Anh HUBT",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Mã ngành
    { wch: 30 }, // Tên ngành
    { wch: 55 }, // Mô tả
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachNganh");

  XLSX.writeFile(workbook, "Mau_Danh_Sach_Nganh_HUBT.xlsx");
}
