/**
 * Regex nhận diện chuỗi ghép dòng legacy trong Visual Basic / ASP / macro:
 * Ví dụ:
 *  " & vbCrLf & _"
 *  " & vbCrLf & \_"
 *  " &vbcrlf&_"
 */
const LEGACY_VB_LINE_BREAK = /[ \t]*&[ \t]*vbcrlf[ \t]*&[ \t]*\\?_[ \t]*/gi;

/**
 * Giải mã các HTML entities thường gặp trong văn bản tài liệu Word/HTML
 * Đặc biệt giải mã &#x20; và &nbsp; thành dấu cách thật.
 */
export function decodeHtmlEntities(input: string): string {
  if (!input) return "";

  return input
    .replace(/&#x20;/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    });
}

/**
 * Giải mã chuỗi nối dòng legacy (& vbCrLf & _) thành ký tự xuống dòng thực tế \n.
 * Không thay thế từ 'vbCrLf' đứng độc lập trong câu hỏi lập trình.
 */
export function decodeLegacyEncodedLineBreaks(input: string): string {
  if (!input) return "";

  const decoded = decodeHtmlEntities(input);
  return decoded.replace(LEGACY_VB_LINE_BREAK, "\n");
}
