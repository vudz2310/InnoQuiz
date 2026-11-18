import * as XLSX from "xlsx";
import type { AcademicClass, Major } from "../../../types/academic.interface";

export interface ParsedClassRow {
  id: string;
  rowNumber: number;
  code: string;
  name: string;
  cohort?: string;
  majorCodeOrName?: string;
  matchedMajorId?: string;
  matchedMajorName?: string;
  status: "VALID_NEW" | "EXISTS" | "DUPLICATE_IN_FILE" | "INVALID";
  error?: string;
  existingClassName?: string;
  isSelected: boolean;
}

export interface ClassExcelParseResult {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  detectedHeaderRow: number;
  detectedColumns: {
    codeColIndex: number;
    nameColIndex: number;
    cohortColIndex: number;
    majorColIndex: number;
    columnHeaders: string[];
  };
  confidence: "HIGH" | "MEDIUM" | "LOW";
  rows: ParsedClassRow[];
  summary: {
    totalRows: number;
    validNewCount: number;
    existsCount: number;
    duplicateInFileCount: number;
    invalidCount: number;
  };
}

function normalizeKeyword(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isClassCodeKeyword(text: string): boolean {
  const norm = normalizeKeyword(text);
  if (!norm) return false;
  return (
    norm === "ma lop" ||
    norm === "ma lop hoc" ||
    norm === "ma hoc phan" ||
    norm === "ma" ||
    norm === "code" ||
    norm === "class code" ||
    norm === "classcode" ||
    norm === "malop" ||
    norm === "ky hieu lop" ||
    norm === "stt ma lop" ||
    norm === "stt / ma lop"
  );
}

function isClassNameKeyword(text: string): boolean {
  const norm = normalizeKeyword(text);
  if (!norm) return false;
  return (
    norm === "ten lop" ||
    norm === "ten lop hoc" ||
    norm === "ten hoc phan" ||
    norm === "lop hoc" ||
    norm === "lop" ||
    norm === "ten" ||
    norm === "name" ||
    norm === "class name" ||
    norm === "classname" ||
    norm === "tenlop"
  );
}

function isCohortKeyword(text: string): boolean {
  const norm = normalizeKeyword(text);
  if (!norm) return false;
  return (
    norm === "khoa" ||
    norm === "nien khoa" ||
    norm === "khoa hoc" ||
    norm === "cohort" ||
    norm === "k" ||
    norm === "khoa dao tao"
  );
}

function isMajorKeyword(text: string): boolean {
  const norm = normalizeKeyword(text);
  if (!norm) return false;
  return (
    norm === "nganh" ||
    norm === "ma nganh" ||
    norm === "ten nganh" ||
    norm === "major" ||
    norm === "khoa nganh" ||
    norm === "chuyen nganh" ||
    norm === "nganh hoc"
  );
}

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
 * Tự động trích xuất Khóa học (K28, K29, K30...) từ mã lớp hoặc tên lớp
 */
function extractCohortFromText(text: string): string | undefined {
  if (!text) return undefined;
  // Khớp K28, K29, K30, D28, D29, D30, 28, 29, 30...
  const matchK = text.match(/\b(?:K|D)(\d{2})\b/i) || text.match(/\bK(\d{2})/i) || text.match(/^D(\d{2})/i);
  if (matchK && matchK[1]) {
    return `K${matchK[1]}`;
  }
  const matchNum = text.match(/\b(2[5-9]|3[0-9]|4[0-5])\b/);
  if (matchNum && matchNum[1]) {
    return `K${matchNum[1]}`;
  }
  return undefined;
}

/**
 * Tự động đoán ngành từ mã lớp hoặc tên lớp
 */
function guessMajorFromText(text: string, majors: Major[]): Major | undefined {
  if (!text || majors.length === 0) return undefined;
  const upper = text.toUpperCase();

  // Match theo mã ngành chính xác trong chuỗi
  for (const m of majors) {
    const code = m.code.toUpperCase().trim();
    if (upper.includes(code)) {
      return m;
    }
  }

  // Match theo tên ngành
  const norm = normalizeKeyword(text);
  for (const m of majors) {
    const normName = normalizeKeyword(m.name);
    if (norm.includes(normName) || normName.includes(norm)) {
      return m;
    }
  }

  return undefined;
}

export async function parseClassExcelFile(
  file: File,
  existingClasses: AcademicClass[] = [],
  availableMajors: Major[] = [],
  targetSheetName?: string
): Promise<ClassExcelParseResult> {
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

  const stringMatrix: string[][] = matrix.map((row) =>
    Array.isArray(row) ? row.map((cell) => (cell !== null && cell !== undefined ? String(cell).trim() : "")) : []
  );

  // 1. TÌM DÒNG HEADER
  let detectedHeaderRow = -1;
  let codeColIndex = -1;
  let nameColIndex = -1;
  let cohortColIndex = -1;
  let majorColIndex = -1;
  let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";

  const maxScanRows = Math.min(15, stringMatrix.length);

  for (let r = 0; r < maxScanRows; r++) {
    const row = stringMatrix[r];
    let tempCode = -1;
    let tempName = -1;
    let tempCohort = -1;
    let tempMajor = -1;

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell) continue;

      if (isClassCodeKeyword(cell) && tempCode === -1) {
        tempCode = c;
      } else if (isClassNameKeyword(cell) && tempName === -1) {
        tempName = c;
      } else if (isCohortKeyword(cell) && tempCohort === -1) {
        tempCohort = c;
      } else if (isMajorKeyword(cell) && tempMajor === -1) {
        tempMajor = c;
      }
    }

    if (tempCode !== -1 && tempName !== -1 && tempCode !== tempName) {
      detectedHeaderRow = r;
      codeColIndex = tempCode;
      nameColIndex = tempName;
      cohortColIndex = tempCohort;
      majorColIndex = tempMajor;
      confidence = "HIGH";
      break;
    }
  }

  // Fallback nếu không có Header
  if (codeColIndex === -1 || nameColIndex === -1) {
    const startRow = detectedHeaderRow !== -1 ? detectedHeaderRow + 1 : 0;
    const sampleRows = stringMatrix.slice(startRow, startRow + 10);
    const maxCols = Math.max(...sampleRows.map((r) => r.length), 0);

    if (maxCols >= 2) {
      const col0IsSeq = sampleRows.every((r) => /^\d+$/.test(r[0] || ""));
      if (col0IsSeq && maxCols >= 3) {
        codeColIndex = 1;
        nameColIndex = 2;
        if (maxCols >= 4) cohortColIndex = 3;
        if (maxCols >= 5) majorColIndex = 4;
      } else {
        codeColIndex = 0;
        nameColIndex = 1;
        if (maxCols >= 3) cohortColIndex = 2;
        if (maxCols >= 4) majorColIndex = 3;
      }
      confidence = "MEDIUM";
    }
  }

  // Headers array
  const headerRow = detectedHeaderRow >= 0 ? stringMatrix[detectedHeaderRow] : [];
  const maxColCount = Math.max(...stringMatrix.map((r) => r.length), 0);
  const columnHeaders: string[] = [];
  for (let c = 0; c < maxColCount; c++) {
    const hText = headerRow[c] || `Cột ${String.fromCharCode(65 + c)}`;
    columnHeaders.push(hText);
  }

  // 2. TRÍCH XUẤT DỮ LIỆU TỪNG DÒNG
  const dataStartRow = detectedHeaderRow >= 0 ? detectedHeaderRow + 1 : 0;
  const parsedRows: ParsedClassRow[] = [];
  const seenCodesInFile = new Map<string, number>();

  const existingCodeMap = new Map<string, AcademicClass>();
  for (const c of existingClasses) {
    existingCodeMap.set(c.code.toUpperCase().trim(), c);
  }

  for (let r = dataStartRow; r < stringMatrix.length; r++) {
    const row = stringMatrix[r];
    if (!row || row.length === 0) continue;

    const isAllBlank = row.every((c) => !c || c.trim() === "");
    if (isAllBlank) continue;

    if (isAdministrativeFooterRow(row)) continue;

    const rawCode = codeColIndex >= 0 && row[codeColIndex] ? row[codeColIndex].trim() : "";
    const rawName = nameColIndex >= 0 && row[nameColIndex] ? row[nameColIndex].trim() : "";
    let rawCohort = cohortColIndex >= 0 && row[cohortColIndex] ? row[cohortColIndex].trim() : "";
    const rawMajor = majorColIndex >= 0 && row[majorColIndex] ? row[majorColIndex].trim() : "";

    if (!rawCode && !rawName) continue;

    const cleanCode = rawCode.toUpperCase().replace(/\s+/g, "");
    const cleanName = rawName.replace(/\s+/g, " ");

    // Tự động suy ra Khóa nếu cột trống
    if (!rawCohort) {
      rawCohort = extractCohortFromText(cleanCode) || extractCohortFromText(cleanName) || "K30";
    }
    if (rawCohort && !rawCohort.toUpperCase().startsWith("K") && /^\d+$/.test(rawCohort)) {
      rawCohort = `K${rawCohort}`;
    }

    // Match ngành
    let matchedMajor: Major | undefined;
    if (rawMajor) {
      matchedMajor =
        availableMajors.find(
          (m) =>
            m.code.toUpperCase() === rawMajor.toUpperCase() ||
            m.name.toLowerCase() === rawMajor.toLowerCase() ||
            m.name.toLowerCase().includes(rawMajor.toLowerCase())
        );
    }
    if (!matchedMajor) {
      matchedMajor = guessMajorFromText(cleanCode, availableMajors) || guessMajorFromText(cleanName, availableMajors);
    }
    if (!matchedMajor && availableMajors.length > 0) {
      matchedMajor = availableMajors[0];
    }

    let status: ParsedClassRow["status"] = "VALID_NEW";
    let error: string | undefined;
    let existingClassName: string | undefined;

    if (!cleanCode) {
      status = "INVALID";
      error = "Thiếu mã lớp";
    } else if (!cleanName) {
      status = "INVALID";
      error = "Thiếu tên lớp";
    } else if (seenCodesInFile.has(cleanCode)) {
      status = "DUPLICATE_IN_FILE";
      error = `Trùng mã với dòng ${seenCodesInFile.get(cleanCode)}`;
    } else if (existingCodeMap.has(cleanCode)) {
      status = "EXISTS";
      existingClassName = existingCodeMap.get(cleanCode)?.name;
    } else {
      status = "VALID_NEW";
      seenCodesInFile.set(cleanCode, r + 1);
    }

    parsedRows.push({
      id: `imported-class-row-${r + 1}`,
      rowNumber: r + 1,
      code: cleanCode,
      name: cleanName,
      cohort: rawCohort || undefined,
      majorCodeOrName: rawMajor || matchedMajor?.code,
      matchedMajorId: matchedMajor?.id,
      matchedMajorName: matchedMajor?.name,
      status,
      error,
      existingClassName,
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
      cohortColIndex,
      majorColIndex,
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

export function exportClassSampleExcel(): void {
  const sampleData = [
    {
      "Mã lớp": "D29CNTT01",
      "Tên lớp": "Công nghệ thông tin 01 - Khóa 29",
      "Khóa": "K29",
      "Mã ngành": "CNTT",
    },
    {
      "Mã lớp": "D29CNTT02",
      "Tên lớp": "Công nghệ thông tin 02 - Khóa 29",
      "Khóa": "K29",
      "Mã ngành": "CNTT",
    },
    {
      "Mã lớp": "D29KTPM01",
      "Tên lớp": "Kỹ thuật phần mềm 01 - Khóa 29",
      "Khóa": "K29",
      "Mã ngành": "KTPM",
    },
    {
      "Mã lớp": "D28QTKD01",
      "Tên lớp": "Quản trị kinh doanh 01 - Khóa 28",
      "Khóa": "K28",
      "Mã ngành": "QTKD",
    },
    {
      "Mã lớp": "D28TCNH02",
      "Tên lớp": "Tài chính ngân hàng 02 - Khóa 28",
      "Khóa": "K28",
      "Mã ngành": "TCNH",
    },
    {
      "Mã lớp": "D30KETOAN01",
      "Tên lớp": "Kế toán 01 - Khóa 30",
      "Khóa": "K30",
      "Mã ngành": "KETOAN",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet["!cols"] = [
    { wch: 18 }, // Mã lớp
    { wch: 38 }, // Tên lớp
    { wch: 12 }, // Khóa
    { wch: 18 }, // Mã ngành
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachLopHoc");
  XLSX.writeFile(workbook, "Mau_Danh_Sach_Lop_Hoc_HUBT.xlsx");
}
