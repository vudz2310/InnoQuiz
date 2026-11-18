import type { QuestionDraft } from "../../../types/quiz.types";

export type QuestionIssueSeverity = "error" | "warning";

export type QuestionIssueType =
  | "MISSING_CORRECT"
  | "EMPTY_CONTENT"
  | "INSUFFICIENT_ANSWERS"
  | "EMPTY_ANSWER"
  | "MULTIPLE_CORRECT"
  | "FIVE_OPTIONS";

export interface QuestionIssue {
  type: QuestionIssueType;
  message: string;
  severity: QuestionIssueSeverity;
}

/**
 * Kiểm tra các lỗi / thiếu sót của câu hỏi trong trình tạo đề thi.
 * Trả về danh sách issue để hiển thị trực tiếp cho người dùng sửa và bổ sung đáp án.
 */
export function checkQuestionIssues(q: QuestionDraft): QuestionIssue[] {
  const issues: QuestionIssue[] = [];

  // 1. Kiểm tra nội dung câu hỏi (chấp nhận nếu có hình ảnh đính kèm)
  const hasContent = Boolean(q.content?.trim()) || Boolean(q.media && q.media.length > 0);
  if (!hasContent) {
    issues.push({
      type: "EMPTY_CONTENT",
      message: "Chưa nhập nội dung câu hỏi",
      severity: "error",
    });
  }

  // 2. Kiểm tra phương án trả lời
  if (!q.answers || q.answers.length === 0) {
    issues.push({
      type: "INSUFFICIENT_ANSWERS",
      message: "Chưa có phương án trả lời nào",
      severity: "error",
    });
    return issues;
  }

  if (q.type === "MULTIPLE_CHOICE" && q.answers.length < 2) {
    issues.push({
      type: "INSUFFICIENT_ANSWERS",
      message: "Cần tối thiểu 2 phương án trả lời",
      severity: "error",
    });
  }

  // Cảnh báo câu hỏi có 5 đáp án (cần kiểm tra và sửa/xóa đáp án thừa)
  if (q.answers.length >= 5) {
    issues.push({
      type: "FIVE_OPTIONS",
      message: `Câu hỏi có ${q.answers.length} đáp án (A, B, C, D, E...)`,
      severity: "warning",
    });
  }

  // Kiểm tra đáp án rỗng
  const hasEmptyAnswer = q.answers.some((a) => !a.content?.trim());
  if (hasEmptyAnswer) {
    issues.push({
      type: "EMPTY_ANSWER",
      message: "Có phương án còn để trống nội dung",
      severity: "error",
    });
  }

  // 3. Kiểm tra đáp án đúng
  const correctCount = q.answers.filter((a) => a.isCorrect).length;
  if (correctCount === 0) {
    issues.push({
      type: "MISSING_CORRECT",
      message: "Chưa chọn đáp án đúng",
      severity: "error",
    });
  } else if (q.type === "MULTIPLE_CHOICE" && correctCount > 1) {
    issues.push({
      type: "MULTIPLE_CORRECT",
      message: "Có nhiều hơn 1 đáp án đúng (chỉ được chọn 1)",
      severity: "warning",
    });
  }

  return issues;
}
