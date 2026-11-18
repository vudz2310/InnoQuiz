export const VN_UPPER = "A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ";
export const VN_LOWER = "a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ";

/**
 * Hàn gắn các ký tự tiếng Việt bị vỡ khoảng trắng do trích xuất PDF/OCR
 * (Ví dụ: "Quan  ni ệ m  nào  sau  đ ây" -> "Quan niệm nào sau đây")
 */
export function healVietnameseSpacedText(text: string): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  return lines
    .map((line) => {
      let trimmed = line.trim();
      if (!trimmed) return "";

      const hasStar = /^\*\s*/.test(trimmed);
      if (hasStar) trimmed = trimmed.replace(/^\*\s*/, "");

      // Chuẩn hóa TA/TB/TC bị dãn cách: "TA   1,1    “" hoặc "TA ( 1,1 ) = “"
      trimmed = trimmed.replace(
        /^T\s*([A-Z])?\s*\(?\s*(\d+)\s*[,.\s]+\s*(\d+)\s*\)?\s*[:=“"']?\s*/i,
        "TA($2,$3)=“"
      );
      // Bỏ mã HA/HB/HC: "HA  1   “" hoặc "HA ( 1 ) = “"
      trimmed = trimmed.replace(/^H\s*([A-Z])?\s*\(?\s*(\d+)\s*\)?\s*[:=“"']?\s*/i, "");

      // Nếu dòng có nhiều khoảng cách đôi (>= 2 spaces), tách thành các từ lớn
      if (/\s{2,}/.test(trimmed)) {
        const tokens = trimmed.split(/\s{2,}/);
        const healed = tokens.map((tok) => {
          tok = tok.trim();
          const parts = tok.split(" ");
          if (parts.length > 1 && parts.some((p) => p.length <= 2)) {
            return parts.join("");
          }
          return tok;
        });
        trimmed = healed.join(" ");
      }

      return (hasStar ? "* " : "") + trimmed;
    })
    .join("\n");
}

import { ALL_VIET_SYLLABLES, COMMON_SYLLABLES_BONUS } from "./vietnameseLexicon";

const VN_ACCENTS_REGEX = new RegExp(`[${VN_UPPER.replace("A-Z", "")}${VN_LOWER.replace("a-z", "")}]`);

/**
 * Tách một chuỗi tiếng Việt bị dính liền các âm tiết (Dynamic Programming Segmentation)
 * Chỉ chạy khi từ có chứa ký tự dấu tiếng Việt để bảo vệ 100% từ tiếng Anh/kỹ thuật.
 */
function unglueVietnameseWord(core: string): string {
  if (!core || core.length <= 4) return core;

  // Nếu là từ không chứa dấu tiếng Việt (thuần ASCII), tuyệt đối bảo toàn nguyên dạng
  if (!VN_ACCENTS_REGEX.test(core)) {
    return core;
  }

  const n = core.length;
  const lower = core.toLowerCase();
  const dp: Array<{ list: string[]; score: number } | null> = new Array(n + 1).fill(null);
  dp[n] = { list: [], score: 0 };

  for (let i = n - 1; i >= 0; i--) {
    let best: { list: string[]; score: number } | null = null;
    for (let len = Math.min(7, n - i); len >= 1; len--) {
      const sub = lower.substring(i, i + len);
      if (ALL_VIET_SYLLABLES.has(sub) && dp[i + len] !== null) {
        let subScore = 10 - len; // Ưu tiên các âm tiết dài hơn (vd: "biểu" > "bi" + "ểu")
        if (COMMON_SYLLABLES_BONUS.has(sub)) subScore -= 4; // Ưu tiên từ ngữ thông dụng trong đề thi

        // Phạt nặng âm tiết 1 ký tự (trừ một số từ đơn hiếm hoi như y, ở, ê, a)
        if (len === 1 && !["y", "ở", "ê", "ổ", "a"].includes(sub)) {
          subScore += 50;
        }

        const totalScore = subScore + dp[i + len]!.score;
        const candidate = [core.substring(i, i + len), ...dp[i + len]!.list];
        if (best === null || totalScore < best.score) {
          best = { list: candidate, score: totalScore };
        }
      }
    }

    if (best === null && dp[i + 1] !== null) {
      best = { list: [core.substring(i, i + 1), ...dp[i + 1]!.list], score: 100 + dp[i + 1]!.score };
    }
    dp[i] = best;
  }

  if (!dp[0]) return core;

  const rawList = dp[0].list;
  const merged: string[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const s = rawList[i];
    if (s.length === 1 && merged.length > 0 && !ALL_VIET_SYLLABLES.has(s.toLowerCase())) {
      merged[merged.length - 1] += s;
    } else {
      merged.push(s);
    }
  }

  return merged.join(" ");
}

/**
 * Chuẩn hóa văn bản trích xuất từ Word DOCX hoặc dán thô.
 * Giữ nguyên các từ kỹ thuật, mã phiên bản và PascalCase/CamelCase.
 */
export function normalizeWordText(text: string): string {
  if (!text) return "";
  let res = text;

  // 1. Tách "Câu 24Trong" -> "Câu 24: Trong"
  res = res.replace(new RegExp(`^(câu\\s*\\d+)([${VN_UPPER}${VN_LOWER}])`, "gmi"), "$1: $2");
  res = res.replace(new RegExp(`(\\n\\s*câu\\s*\\d+)([${VN_UPPER}${VN_LOWER}])`, "gmi"), "$1: $2");

  // 2. Tách từ viết tắt hoa đứng trước chữ thường tiếng Việt: "AIhẹp" -> "AI hẹp"
  res = res.replace(new RegExp(`([${VN_UPPER}]{2,})([${VN_LOWER}])`, "g"), "$1 $2");

  // 3. Tách dấu câu dính liền với từ tiếng Việt có dấu: "tạo,phát" -> "tạo, phát"
  res = res.replace(new RegExp(`([,;])([${VN_UPPER}${VN_LOWER}])`, "g"), "$1 $2");

  // 4. Phân tách âm tiết tiếng Việt dính liền toàn bộ nhưng CHỈ khi có dấu tiếng Việt
  const lines = res.split(/\r?\n/);
  return lines
    .map((line) => {
      const words = line.split(" ");
      return words
        .map((word) => {
          const match = word.match(/^([^a-zA-ZÀ-ỹ0-9]*)(.*?)([^a-zA-ZÀ-ỹ0-9]*)$/);
          if (!match) return word;
          const [, pre, core, post] = match;
          if (core.length > 4 && VN_ACCENTS_REGEX.test(core)) {
            return pre + unglueVietnameseWord(core) + post;
          }
          return word;
        })
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim();
    })
    .join("\n");
}

/**
 * Làm sạch hoàn toàn nội dung câu hỏi (loại bỏ tiền tố Câu X:, mã thẻ HA/HB/HC của EduQuiz, ngoặc kép, nhãn thừa)
 */
export function cleanQuestionText(str: string): string {
  if (!str) return "";
  let res = str.trim();
  // Bỏ tiền tố Câu 1:, Câu hỏi 1:, Question 1:, Bài 1:
  res = res.replace(/^(?:câu\s*hỏi|câu|question|bài)\s*(?:số\s*)?\d+\s*[:\.\-\–\—\)]?\s*/i, "");
  // Bỏ mã thẻ EduQuiz: HA(1)=“, HB(2)=“, HC(10)=“, H(1)=, HA1=, etc.
  res = res.replace(/^H\s*[A-Z]?\s*\(?\s*\d+\s*\)?\s*[:=“"']*\s*/i, "");
  // Bỏ nếu lặp lại chữ "Câu 1:" bên trong sau mã thẻ
  res = res.replace(/^(?:câu\s*hỏi|câu|question|bài)\s*(?:số\s*)?\d+\s*[:\.\-\–\—\)]?\s*/i, "");
  // Bỏ nhãn loại câu hỏi EduQuiz/Word thừa ở đầu hoặc cuối câu: (Một đáp án), (Trắc nghiệm), (Nhiều đáp án)...
  res = res.replace(/^[\(\[]\s*(?:m\s*ộ\s*t|n\s*h\s*i\s*ề\s*u|c\s*h\s*ọ\s*n|trắc\s*nghiệm|single|multiple)\s+(?:đáp\s*án|lựa\s*chọn)\s*[\)\]]\s*[:\.\-]?\s*/i, "");
  res = res.replace(/^[\(\[]\s*\d+(?:[.,]\d+)?\s*(?:đ|điểm|pts|points?)\s*[\)\]]\s*[:\.\-]?\s*/i, "");
  res = res.replace(/\s*[\(\[]\s*(?:m\s*ộ\s*t|n\s*h\s*i\s*ề\s*u|c\s*h\s*ọ\s*n|trắc\s*nghiệm|single|multiple)\s+(?:đáp\s*án|lựa\s*chọn)\s*[\)\]]$/i, "");
  res = res.replace(/\s*[\(\[]\s*\d+(?:[.,]\d+)?\s*(?:đ|điểm|pts|points?)\s*[\)\]]$/i, "");
  // Bỏ nhãn hình minh họa thừa trong ngoặc vuông, nhọn hoặc nhọn kép: [Hình 01], <Ảnh 2>, {ảnh}
  res = res.replace(/\s*\[\s*(?:hình\s*minh\s*họa|hình\s*ảnh|ảnh|hình|image)\s*[:\.\-]?\s*.*?\]\s*$/i, "");
  res = res.replace(/\s*<\s*(?:hình\s*minh\s*họa|hình\s*ảnh|ảnh|hình|image)\s*[:\.\-]?\s*.*?>\s*$/i, "");
  res = res.replace(/\s*\{\s*(?:hình\s*minh\s*họa|hình\s*ảnh|ảnh|hình|image)\s*[:\.\-]?\s*.*?\}\s*$/i, "");
  res = res.replace(/\{\s*(?:hình\s*minh\s*họa|hình\s*ảnh|ảnh|hình|image)\s*[:\.\-]?\s*.*?\}/gi, "");
  // Bỏ ngoặc kép bao quanh “ ”, " ", ' '
  res = res.replace(/^[\s“"”'‘`«]+/, "").replace(/[\s”"“'’`»]+$/, "");
  return res.trim();
}

/**
 * Làm sạch hoàn toàn nội dung đáp án (loại bỏ mã thẻ TA/TB/TC của EduQuiz, ngoặc kép “ ”, dấu sao, nhãn A. B. a. b.)
 */
export function cleanAnswerText(str: string): string {
  if (!str) return "";
  let res = str.trim();
  // 1. Bỏ dấu sao & ký tự thoát \* hoặc ★ ✔ & ngoặc kép đầu
  res = res.replace(/^(?:\\?\*|★|✔|[\s“"”'‘`«])+/, "");
  // 2. Bỏ mã EduQuiz: TA( 1,1 )=“, TB(2,1)=“, TC(18,4)=“, T(1,1)=, etc.
  res = res.replace(/^T\s*[A-Z]?\s*\(?\s*(?:[A-Z],)?\s*\d+\s*[,.\s]+\s*\d+\s*\)?\s*[:=“"']*\s*/i, "");
  // 3. Bỏ ngoặc kép đầu nếu có sau mã thẻ
  res = res.replace(/^[\s“"”'‘`«]+/, "");
  // 4. Bỏ nhãn chữ cái a. b. c. d. A. B. C. D. 1. 2. ở đầu
  res = res.replace(/^(?:\[|\()?([a-hA-H]|\d+)[\.\)\:\-\]]\s*/, "");
  // 5. Bỏ dấu sao còn sót lại sau nhãn (ví dụ "A.*")
  res = res.replace(/^(?:\\?\*|★|✔|\s)+/, "");
  // 6. Bỏ ngoặc kép đầu và cuối còn sót
  res = res.replace(/^[\s“"”'‘`«]+/, "").replace(/[\s”"“'’`»]+$/, "");
  return res.trim();
}

/**
 * Tách dòng chứa nhiều đáp án trên cùng 1 hàng (ví dụ: "A. Hà Nội   B. Đà Nẵng   C. Hải Phòng   D. Cần Thơ" hoặc "\*A. Hà Nội B. Đà Nẵng")
 */
export function splitMultiOptionsInLine(line: string): { keyLetter: string; isCorrect: boolean; content: string }[] | null {
  const inlineRegex = /(?:^|[\t ]{2,}|\s+)(?:(\\\*|\*|★|✔)\s*)?(?:\[([A-Ha-h])\]|\(([A-Ha-h])\)|([A-Ha-h])[.):-])(?:\s*(\\\*|\*|★|✔))?\s+(?=\S)/gi;
  const rawMatches = [...line.matchAll(inlineRegex)];
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

  // Ký tự đầu tiên phải là A..H và các đáp án phải nối tiếp nhau theo thứ tự chữ cái (A -> B -> C -> D)
  const firstCharCode = labels[0].charCodeAt(0);
  if (firstCharCode < 65 || firstCharCode > 72) return null;

  for (let i = 1; i < labels.length; i++) {
    if (labels[i].charCodeAt(0) !== labels[i - 1].charCodeAt(0) + 1) {
      return null;
    }
  }

  const results: { keyLetter: string; isCorrect: boolean; content: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const startIndex = (match.index ?? 0) + match[0].length;
    const endIndex = i + 1 < matches.length ? (matches[i + 1].index ?? line.length) : line.length;
    const content = cleanAnswerText(line.slice(startIndex, endIndex));
    const isCorrect = Boolean(match[1] || match[5]);
    const keyLetter = labels[i];
    if (content) {
      results.push({ keyLetter, isCorrect, content });
    }
  }

  return results.length >= 2 ? results : null;
}

/**
 * Kiểm tra xem một dòng có phải là tiêu đề Phần (Section Header) hay không
 * Ví dụ: "PHẦN 1", "Phần 1: Trắc nghiệm", "PHẦN I", "PART 1", "Phần thứ 1", "Chương 1: ..."
 */
export function detectSectionHeader(line: string): { isSection: boolean; title: string; sectionNumber?: number } {
  const trimmed = line.trim();
  if (!trimmed) return { isSection: false, title: "" };

  // Dòng chứa dấu hỏi '?' là câu hỏi, tuyệt đối không phải tiêu đề phần:
  if (trimmed.includes("?")) {
    return { isSection: false, title: "" };
  }

  // TUYỆT ĐỐI KHÔNG nhận nhầm các từ ngữ tiếng Việt thông dụng bắt đầu bằng "phần":
  if (/^phần\s*(?:mềm|cứng|trăm|tử|quang|đoạn|thưởng|nào|gì|sau|trên|dưới|này|kia|lớn|bài|giải|đầu|cuối|khác|được|có|là|xử|chọn|gồm|thuộc|thi hành)\b/i.test(trimmed)) {
    return { isSection: false, title: "" };
  }

  // KHÔNG nhận nhầm các dòng ghi chú tham chiếu có chữ "Câu":
  // Ví dụ: "Phần 1: Câu 13.", "Phần 3: Các câu 97, 98, 99...", "Phần MMT 1: Câu 10 và 30."
  if (/^phần\s*(?:\d+|MMT\s*\d+|[IVXLCDM]+)?\s*[:.-]\s*(?:các\s*)?câu\s*\d+/i.test(trimmed)) {
    return { isSection: false, title: "" };
  }

  const romanPattern = "(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)";
  const sectionRegex = new RegExp(
    `^(?:phần\\s*thứ\\s*(\\d+)|(?:phần|part|chương|section)\\s*(?:MMT\\s*)?(\\d+|${romanPattern}|[A-E]))(?=[\\s:.-]|$)(?!\\p{L})\\s*(.*)$`,
    "iu"
  );

  const sectionMatch = trimmed.match(sectionRegex);
  if (sectionMatch) {
    const numStr = sectionMatch[1] || sectionMatch[2];
    const subTitle = (sectionMatch[3] || "").trim();

    // Nếu phần phụ đề bắt đầu bằng "câu \d+" hoặc "các câu \d+" thì là ghi chú tham chiếu
    if (/^(?:các\s*)?câu\s*\d+/i.test(subTitle)) {
      return { isSection: false, title: "" };
    }

    let sectionNum: number | undefined;
    if (numStr && /^\d+$/.test(numStr)) {
      sectionNum = parseInt(numStr, 10);
    }
    return {
      isSection: true,
      title: trimmed,
      sectionNumber: sectionNum,
    };
  }

  return { isSection: false, title: "" };
}

/**
 * Kiểm tra xem dòng có phải là tiêu đề phụ / siêu dữ liệu không cần thiết
 * (Ví dụ: "Câu 169 (Một đáp án)", "Trang 1/5", URLs, Header ngày giờ EduQuiz, "Trắc nghiệm", "[Hình minh họa: Ảnh 3]")
 */
export function isIgnorableMetaLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;

  // 1. Chứa từ khóa EduQuiz hoặc URL liên quan
  if (/eduquiz/i.test(trimmed)) return true;
  if (/https?:\/\/\S+/i.test(trimmed)) return true;

  // 2. Ngày giờ xuất bản (vd: 9/21/26, 1:25 PM)
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}(?:,\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AP]M)?)?/i.test(trimmed)) return true;

  // 3. Đánh số trang (Trang 1/62, 1/62, Page 1 of 62)
  if (/^(?:Trang|Page)\s*\d+(?:\s*(?:\/|of)\s*\d+)?$/i.test(trimmed)) return true;
  if (/^\d+\s*\/\s*\d+$/i.test(trimmed)) return true;

  // 4. Nhãn hình ảnh đơn thuần ([Hình minh họa: Ảnh 3], <Ảnh 3>, Ảnh 01, Hình 02, Hình 05)
  if (/^\[?\s*(?:hình\s*minh\s*họa|hình\s*ảnh|image|figure|ảnh|hình)\s*[:\.\-]?\s*.*?\]?$/i.test(trimmed)) return true;
  if (/^<\s*(?:ảnh|hình|image)\s*\d+\s*>$/i.test(trimmed)) return true;

  // 5. Dòng phân loại câu hỏi độc lập (Trắc nghiệm, Tự luận, True/False, Đúng/Sai)
  if (/^(?:trắc\s*nghiệm|tự\s*luận|multiple\s*choice|true\/false|đúng\/sai)$/i.test(trimmed)) return true;

  // 6. Dòng siêu dữ liệu câu hỏi EduQuiz / Word (ví dụ "Câu 1 Một đáp án)", "Câu 1 (Một đáp án)")
  if (/^câu\s*\d*\s*[:\.\-]?\s*[\(\[]?\s*(?:m\s*ộ\s*t|n\s*h\s*i\s*ề\s*u|c\s*h\s*ọ\s*n|trắc\s*nghiệm|single|multiple)\s+(?:đáp\s*án|lựa\s*chọn)\s*[\)\]]?$/i.test(trimmed)) {
    return true;
  }

  if (/^câu\s*\d*\s*[:\.\-]?\s*[\(\[]\s*\d+(?:[.,]\d+)?\s*(?:đ|điểm|pts|points?)\s*[\)\]]$/i.test(trimmed)) {
    return true;
  }

  if (/^[\(\[]?\s*(?:m\s*ộ\s*t|n\s*h\s*i\s*ề\s*u|c\s*h\s*ọ\s*n|trắc\s*nghiệm)\s+(?:đáp\s*án|lựa\s*chọn)\s*[\)\]]?$/i.test(trimmed)) {
    return true;
  }

  return false;
}
