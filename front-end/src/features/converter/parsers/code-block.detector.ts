/**
 * Bộ nhận diện và quản lý khối mã nguồn (Code Block Detector)
 * Ngăn chặn việc Option Parser nhận nhầm các dòng code thành các lựa chọn trắc nghiệm.
 */

// Danh sách các từ khóa mở đầu khối mã nguồn phổ biến
const CODE_START_PATTERNS = [
  /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?class\s+[a-zA-Z_][a-zA-Z0-9_]*/i,
  /^\s*(?:public|private|protected)?\s*interface\s+[a-zA-Z_][a-zA-Z0-9_]*/i,
  /^\s*(?:public|private|protected)?\s*enum\s+[a-zA-Z_][a-zA-Z0-9_]*/i,
  /^\s*(?:package|import)\s+[a-zA-Z_][a-zA-Z0-9_.*]*\s*;/i,
  /^\s*(?:public\s+)?static\s+void\s+main\s*\(/i,
  /^\s*#\s*include\s*[<"][a-zA-Z0-9_.]+[>"]/i,
  /^\s*using\s+namespace\s+[a-zA-Z_][a-zA-Z0-9_]*\s*;/i,
  /^\s*using\s+System\b/i,
  /^\s*def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/i,
  /^\s*(?:SELECT|CREATE\s+TABLE|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b/i,
];

// Các biểu hiện cấu trúc đặc trưng của dòng lệnh
const CODE_LINE_PATTERNS = [
  /^\s*[{}]\s*$/,
  /^\s*(?:int|float|double|char|boolean|byte|short|long|String|void|auto)\b.*[;{=]/i,
  /;\s*$/,
  /\bSystem\.(?:out|in|err)\b/i,
  /\bConsole\.(?:WriteLine|Write|ReadLine)\b/i,
  /\b(?:printf|scanf|cout|cin)\b/i,
  /^\s*(?:for|while|if|else\s+if|switch)\s*\(.*[){]/i,
  /^\s*else\s*\{?\s*$/,
  /^\s*return\b.*[;{]/i,
  /^\s*(?:try|catch|finally)\b.*[){]/i,
];

// Regex kiểm tra dòng lựa chọn bắt buộc có Anchor ở đầu dòng (Anchored Option Line)
export const ANCHORED_OPTION_LINE =
  /^\s*(\\\*|\*|★|✔)?\s*(?:\[([A-Ha-h])\]|\(([A-Ha-h])\)|([A-Ha-h])[.):-])(?:\s*(\\\*|\*|★|✔))?\s*(?=\S)/;

/**
 * Kiểm tra xem một dòng có phải là dòng bắt đầu của một khối mã nguồn hay không.
 */
export function looksLikeCodeStart(line: string): { isCode: boolean; language?: string } {
  const trimmed = line.trim();
  if (!trimmed) return { isCode: false };

  for (const pattern of CODE_START_PATTERNS) {
    if (pattern.test(trimmed)) {
      let language = "text";
      if (/class|interface|enum|public static void|System\.out|package|import/i.test(trimmed)) {
        language = "java";
      } else if (/#include|using namespace/i.test(trimmed)) {
        language = "cpp";
      } else if (/using System/i.test(trimmed)) {
        language = "csharp";
      } else if (/def\s+/i.test(trimmed)) {
        language = "python";
      } else if (/SELECT|CREATE TABLE/i.test(trimmed)) {
        language = "sql";
      }
      return { isCode: true, language };
    }
  }

  return { isCode: false };
}

/**
 * Kiểm tra xem một dòng có mang đặc trưng của dòng code không.
 */
export function isCodeLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  if (looksLikeCodeStart(trimmed).isCode) return true;

  for (const pattern of CODE_LINE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Tính toán độ sâu thay đổi của dấu ngoặc nhọn trong một dòng (bỏ qua chuỗi văn bản trong ngoặc kép).
 */
export function calculateBraceDelta(line: string): number {
  let delta = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "{") delta++;
      else if (ch === "}") delta--;
    }
  }

  return delta;
}

/**
 * Phán đoán ngôn ngữ lập trình của một đoạn mã.
 */
export function detectLanguage(code: string): string {
  if (/\b(?:System\.out|public\s+static\s+void\s+main|StringBuffert|String\[\]|new\s+String)\b/i.test(code)) {
    return "java";
  }
  if (/#include\b|\busing\s+namespace\s+std\b|\bcout\b|\bcin\b/i.test(code)) {
    return "cpp";
  }
  if (/\bConsole\.WriteLine\b|\busing\s+System\b/i.test(code)) {
    return "csharp";
  }
  if (/\bdef\s+[a-zA-Z_]|\bimport\s+numpy\b|\bprint\s*\(/i.test(code)) {
    return "python";
  }
  if (/\b(?:SELECT\b.*FROM\b|CREATE\s+TABLE|INSERT\s+INTO)\b/i.test(code)) {
    return "sql";
  }
  return "java";
}

/**
 * Kiểm tra xem một dòng có thực sự là một Option hay không (Anchor ở đầu dòng).
 * Tuyệt đối loại trừ các dòng code như "public class TinhToan", "{", "a=1;", "System.out.println(S=+s);".
 */
export function isOptionLine(line: string): boolean {
  if (!line || !line.trim()) return false;
  const trimmed = line.trim();

  // Bác bỏ ngay nếu là từ khóa code rõ ràng
  if (looksLikeCodeStart(trimmed).isCode) return false;
  if (/^[{}]\s*$/.test(trimmed)) return false;
  if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^;]+;/.test(trimmed)) return false; // vd: a=1;
  if (/^System\.(?:out|in|err)\./i.test(trimmed)) return false;

  return ANCHORED_OPTION_LINE.test(trimmed);
}
