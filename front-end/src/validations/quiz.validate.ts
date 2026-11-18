import type { QuizDraft } from "../types/quiz.types";

export interface QuizValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
}

/**
 * Validate dữ liệu bài thi trắc nghiệm (cho cả lưu nháp và xuất bản)
 * @param quiz Dữ liệu bản nháp
 * @param isPublishing true nếu đang ấn 'Xuất bản', false nếu đang ấn 'Lưu nháp'
 */
export const validateQuizDraft = (
  quiz: QuizDraft,
  isPublishing: boolean = false
): QuizValidationResult => {
  const errors: Record<string, string> = {};

  // 1. Tiêu đề (Bắt buộc cho cả Lưu nháp và Xuất bản)
  if (!quiz.title || !quiz.title.trim()) {
    errors.title = "Tiêu đề đề thi không được để trống.";
  } else if (quiz.title.trim().length < 3) {
    errors.title = "Tiêu đề đề thi phải có ít nhất 3 ký tự.";
  }

  // 2. Thời gian làm bài (Nếu có nhập thì phải > 0)
  if (quiz.timeLimit !== undefined && quiz.timeLimit !== null) {
    if (Number(quiz.timeLimit) <= 0) {
      errors.timeLimit = "Thời gian làm bài phải lớn hơn 0 phút.";
    }
  }

  // Nếu chỉ Lưu nháp (Save Draft), không ép buộc phải có câu hỏi hay danh mục
  if (!isPublishing) {
    const errorKeys = Object.keys(errors);
    return {
      isValid: errorKeys.length === 0,
      errors,
      firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    };
  }

  // ================= CÁC ĐIỀU KIỆN BẮT BUỘC KHI XUẤT BẢN (PUBLISH) =================

  // 3. Danh mục
  if (!quiz.categoryId) {
    errors.categoryId = "Vui lòng chọn danh mục cho đề thi trước khi xuất bản.";
  }

  // 4. Số lượng câu hỏi (hỗ trợ cả sections và flat questions)
  const allSections = quiz.sections && quiz.sections.length > 0
    ? quiz.sections
    : [{ title: "Phần 1", order: 1, questions: quiz.questions || [] }];

  const totalQuestions = allSections.reduce((sum, s) => sum + (s.questions ? s.questions.length : 0), 0);

  if (totalQuestions === 0) {
    errors.questions = "Đề thi phải có ít nhất 1 câu hỏi để xuất bản.";
  } else {
    // 5. Kiểm tra từng phần và câu hỏi
    allSections.forEach((sec, sIdx) => {
      const secQuestions = sec.questions || [];
      secQuestions.forEach((q, qIndex) => {
        const qNum = qIndex + 1;
        const prefix = `sec_${sIdx}_q_${qIndex}`;
        const legacyPrefix = `question_${qIndex}`;

        if (!q.content || !q.content.trim()) {
          errors[`${prefix}_content`] = `${sec.title || `Phần ${sIdx + 1}`}: Câu hỏi số ${qNum} chưa nhập nội dung.`;
          errors[`${legacyPrefix}_content`] = errors[`${prefix}_content`];
        }

        if (!q.answers || q.answers.length === 0) {
          errors[`${prefix}_answers`] = `${sec.title || `Phần ${sIdx + 1}`}: Câu hỏi số ${qNum} chưa có đáp án nào.`;
          errors[`${legacyPrefix}_answers`] = errors[`${prefix}_answers`];
          return;
        }

        // Kiểm tra nội dung các đáp án
        const hasEmptyAnswer = q.answers.some((a) => !a.content || !a.content.trim());
        if (hasEmptyAnswer) {
          errors[`${prefix}_empty_answer`] = `${sec.title || `Phần ${sIdx + 1}`}: Câu hỏi số ${qNum} có đáp án còn để trống nội dung.`;
        }

        const correctCount = q.answers.filter((a) => a.isCorrect).length;

        if (q.type === "MULTIPLE_CHOICE") {
          if (q.answers.length < 2) {
            errors[`${prefix}_answers_count`] = `${sec.title || `Phần ${sIdx + 1}`}: Câu hỏi số ${qNum} (Trắc nghiệm) phải có ít nhất 2 đáp án.`;
          }
          if (correctCount === 0) {
            errors[`${prefix}_correct`] = `${sec.title || `Phần ${sIdx + 1}`}: Câu hỏi số ${qNum} chưa chọn đáp án đúng.`;
            errors[`${legacyPrefix}_correct`] = errors[`${prefix}_correct`];
          } else if (correctCount > 1) {
            errors[`${prefix}_correct`] = `${sec.title || `Phần ${sIdx + 1}`}: Câu hỏi số ${qNum} chỉ được có 1 đáp án đúng duy nhất.`;
            errors[`${legacyPrefix}_correct`] = errors[`${prefix}_correct`];
          }
        } else if (q.type === "TRUE_FALSE") {
          if (q.answers.length !== 2) {
            errors[`${prefix}_answers_count`] = `${sec.title || `Phần ${sIdx + 1}`}: Câu hỏi số ${qNum} (Đúng/Sai) phải có đúng 2 đáp án.`;
          }
          if (correctCount !== 1) {
            errors[`${prefix}_correct`] = `${sec.title || `Phần ${sIdx + 1}`}: Câu hỏi số ${qNum} (Đúng/Sai) phải chọn 1 đáp án chính xác.`;
            errors[`${legacyPrefix}_correct`] = errors[`${prefix}_correct`];
          }
        }
      });
    });
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
  };
};
