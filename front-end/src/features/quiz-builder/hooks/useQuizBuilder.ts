import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { quizApi } from "../../../services/api/Quiz.api";
import { categoryApi } from "../../../services/api/Category.api";
import { uploadApi } from "../../../services/api/Upload.api";
import { useNotification } from "../../../components/Notification";
import { validateQuizDraft } from "../../../validations/quiz.validate";
import { getMediaUrl } from "../../../utils/media";
import type {
  QuizDraft,
  QuestionDraft,
  AnswerDraft,
  Category,
  QuestionType,
  DraftMedia,
  Quiz,
  CreateQuizPayload,
  UpdateQuizPayload,
} from "../../../types/quiz.types";
import type { QuizSectionDraft } from "../../../types/quiz-section.types";

const createDefaultAnswer = (order: number, isCorrect = false) => ({
  content: "",
  isCorrect,
  order,
});

const createDefaultQuestion = (order: number, type: QuestionType = "MULTIPLE_CHOICE"): QuestionDraft => {
  if (type === "TRUE_FALSE") {
    return {
      content: "",
      type: "TRUE_FALSE",
      points: 1,
      order,
      answers: [
        { content: "Đúng (True)", isCorrect: true, order: 1 },
        { content: "Sai (False)", isCorrect: false, order: 2 },
      ],
    };
  }

  return {
    content: "",
    type: "MULTIPLE_CHOICE",
    points: 1,
    order,
    answers: [
      createDefaultAnswer(1, true),
      createDefaultAnswer(2, false),
      createDefaultAnswer(3, false),
      createDefaultAnswer(4, false),
    ],
  };
};

const createDefaultSection = (order: number = 1, title: string = "PHẦN 1: TRẮC NGHIỆM"): QuizSectionDraft => ({
  title,
  order,
  questions: [createDefaultQuestion(1)],
});

// Helper làm sạch các đáp án (chỉ giữ text & metadata, loại bỏ triệt để media/binary)
const sanitizeAnswers = (answers: AnswerDraft[]) =>
  (answers || []).map((a, aIdx) => ({
    id: a.id,
    content: a.content?.trim() || `Đáp án ${aIdx + 1}`,
    isCorrect: Boolean(a.isCorrect),
    order: a.order ?? aIdx + 1,
  }));

// Helper làm sạch các câu hỏi (chỉ giữ text & metadata)
const sanitizeQuestions = (questions: QuestionDraft[]) =>
  (questions || []).map((q, qIdx) => ({
    id: q.id,
    content: q.content?.trim() || `Câu hỏi ${qIdx + 1}`,
    type: q.type || "MULTIPLE_CHOICE",
    points: typeof q.points === "number" ? q.points : 1,
    order: q.order ?? qIdx + 1,
    answers: sanitizeAnswers(q.answers),
  }));

// Chuẩn hóa và làm sạch triệt để payload trước khi gửi lên API /v1/quizzes
// Đảm bảo không chứa bất kỳ Base64, dataUrl hay Binary file nào
const buildCleanPayload = (quizDraft: QuizDraft): CreateQuizPayload => {
  const hasSections = Array.isArray(quizDraft.sections) && quizDraft.sections.length > 0;

  const payload: CreateQuizPayload = {
    title: quizDraft.title.trim(),
    description: quizDraft.description?.trim() || undefined,
    coverKey: quizDraft.coverKey || undefined,
    coverUrl: quizDraft.coverUrl || undefined,
    categoryId: quizDraft.categoryId || undefined,
    timeLimit: quizDraft.timeLimit ?? undefined,
  };

  if (hasSections) {
    payload.sections = (quizDraft.sections || []).map((sec, sIdx) => ({
      id: sec.id,
      title: sec.title?.trim() || `Phần ${sIdx + 1}`,
      description: sec.description?.trim() || undefined,
      order: sec.order ?? sIdx + 1,
      questions: sanitizeQuestions(sec.questions || []),
    }));
    // Quan trọng: Tuyệt đối KHÔNG gửi kèm quizDraft.questions khi đã có sections
    // để tránh nhân đôi số lượng câu hỏi và giảm tối đa dung lượng JSON
  } else {
    payload.questions = sanitizeQuestions(quizDraft.questions || []);
  }

  // Đo lường kích thước payload theo quy chuẩn kiến trúc
  try {
    const jsonStr = JSON.stringify(payload);
    const sizeBytes = new Blob([jsonStr]).size;
    console.log(
      `[QuizPayload] Kích thước payload JSON: ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(2)} KB, ${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`
    );
  } catch (err: unknown) {
    console.warn("Không thể tính kích thước payload:", err);
  }

  return payload;
};

async function mediaToFile(media: DraftMedia): Promise<File | null> {
  // Nếu ảnh đã có URL trên server hoặc storageKey và không có dataUrl mới -> không cần tạo File upload lại
  if (!media.dataUrl && media.url && (media.url.startsWith("http") || media.url.startsWith("/storage"))) {
    return null;
  }

  if (media.dataUrl?.startsWith("data:")) {
    try {
      const res = await fetch(media.dataUrl);
      const blob = await res.blob();
      const ext = media.mimeType?.split("/")[1] || "png";
      const filename = media.originalName || `${media.assetId || "image"}.${ext}`;
      return new File([blob], filename, { type: media.mimeType || blob.type || "image/png" });
    } catch {
      // Tiếp tục fallback giải mã Base64 bên dưới
    }

    try {
      const match = media.dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
      if (!match) return null;

      const mimeType = match[1] || media.mimeType || "image/png";
      const payload = match[3];
      const binary = match[2] ? atob(payload) : decodeURIComponent(payload);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      return new File([bytes], media.originalName || `${media.assetId || "image"}.png`, { type: mimeType });
    } catch {
      return null;
    }
  }

  if (!media.url) return null;
  try {
    const response = await fetch(getMediaUrl(media.url));
    if (!response.ok) return null;
    const blob = await response.blob();
    return new File([blob], media.originalName || `${media.assetId || "image"}.png`, { type: media.mimeType || blob.type });
  } catch {
    return null;
  }
}

// Upload riêng biệt các hình ảnh qua multipart/form-data sau khi Quiz/Questions đã được lưu thành công vào PostgreSQL
async function persistImportedQuestionMedia(
  savedQuiz: Quiz,
  draftSections: QuizSectionDraft[] | undefined,
  draftQuestions: QuestionDraft[] | undefined,
  showWarning: (title: string, message: string) => void,
  showError: (title: string, message: string) => void,
): Promise<{ updatedSections?: QuizSectionDraft[]; updatedQuestions?: QuestionDraft[] }> {
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB theo limit Multer backend

  // 1. Trường hợp có Sections
  if (draftSections && draftSections.length > 0 && savedQuiz.sections?.length) {
    const updatedSections: QuizSectionDraft[] = JSON.parse(JSON.stringify(draftSections));

    for (let sectionIndex = 0; sectionIndex < updatedSections.length; sectionIndex += 1) {
      const draftSection = updatedSections[sectionIndex];
      const savedSection = savedQuiz.sections[sectionIndex];
      if (!savedSection) continue;

      for (let questionIndex = 0; questionIndex < draftSection.questions.length; questionIndex += 1) {
        const draftQuestion = draftSection.questions[questionIndex];
        const savedQuestion = savedSection.questions[questionIndex];
        if (!savedQuestion) continue;

        // Upload media của câu hỏi
        if (draftQuestion.media?.length) {
          for (let mIdx = 0; mIdx < draftQuestion.media.length; mIdx += 1) {
            const media = draftQuestion.media[mIdx];
            if (!media.dataUrl && media.url && (media.url.startsWith("http") || media.url.startsWith("/storage"))) {
              continue;
            }
            const file = await mediaToFile(media);
            if (!file) continue;

            if (file.size > MAX_FILE_SIZE) {
              showWarning(
                "Ảnh vượt quá kích thước",
                `Ảnh tại câu hỏi ${questionIndex + 1} (${(file.size / 1024 / 1024).toFixed(1)}MB) vượt quá giới hạn 15MB.`
              );
              continue;
            }

            try {
              const res = await uploadApi.uploadQuestionImage(savedQuestion.id, file);
              if (res) {
                media.url = res.url;
                media.storageKey = res.storageKey;
                delete media.dataUrl; // Xóa Base64 để giải phóng RAM
              }
            } catch (err: unknown) {
              const status = (err as { response?: { status?: number } })?.response?.status;
              if (status === 413) {
                showError("Ảnh quá dung lượng", `Ảnh tại câu hỏi ${questionIndex + 1} vượt quá dung lượng cho phép của máy chủ.`);
              } else {
                console.error(`Lỗi tải ảnh câu hỏi (${savedQuestion.id}):`, err);
              }
            }
          }
        }

        // Upload media của các đáp án (Options)
        if (draftQuestion.answers?.length) {
          for (let answerIndex = 0; answerIndex < draftQuestion.answers.length; answerIndex += 1) {
            const draftAnswer = draftQuestion.answers[answerIndex];
            const savedAnswer = savedQuestion.answers?.[answerIndex];
            if (!savedAnswer || !draftAnswer.media?.length) continue;

            for (let mIdx = 0; mIdx < draftAnswer.media.length; mIdx += 1) {
              const media = draftAnswer.media[mIdx];
              if (!media.dataUrl && media.url && (media.url.startsWith("http") || media.url.startsWith("/storage"))) {
                continue;
              }
              const file = await mediaToFile(media);
              if (!file) continue;

              if (file.size > MAX_FILE_SIZE) {
                showWarning(
                  "Ảnh đáp án vượt quá kích thước",
                  `Ảnh tại đáp án ${answerIndex + 1} câu ${questionIndex + 1} vượt quá 15MB.`
                );
                continue;
              }

              try {
                const res = await uploadApi.uploadAnswerImage(savedAnswer.id, file);
                if (res) {
                  media.url = res.url;
                  media.storageKey = res.storageKey;
                  delete media.dataUrl;
                }
              } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 413) {
                  showError("Ảnh quá dung lượng", `Ảnh đáp án tại câu hỏi ${questionIndex + 1} vượt quá dung lượng cho phép.`);
                } else {
                  console.error(`Lỗi tải ảnh đáp án (${savedAnswer.id}):`, err);
                }
              }
            }
          }
        }
      }
    }

    return {
      updatedSections,
      updatedQuestions: updatedSections.flatMap((s) => s.questions),
    };
  }

  // 2. Trường hợp câu hỏi phẳng không có Sections
  if (draftQuestions && draftQuestions.length > 0 && savedQuiz.questions?.length) {
    const updatedQuestions: QuestionDraft[] = JSON.parse(JSON.stringify(draftQuestions));

    for (let questionIndex = 0; questionIndex < updatedQuestions.length; questionIndex += 1) {
      const draftQuestion = updatedQuestions[questionIndex];
      const savedQuestion = savedQuiz.questions[questionIndex];
      if (!savedQuestion) continue;

      if (draftQuestion.media?.length) {
        for (let mIdx = 0; mIdx < draftQuestion.media.length; mIdx += 1) {
          const media = draftQuestion.media[mIdx];
          if (!media.dataUrl && media.url && (media.url.startsWith("http") || media.url.startsWith("/storage"))) {
            continue;
          }
          const file = await mediaToFile(media);
          if (!file) continue;

          if (file.size > MAX_FILE_SIZE) {
            showWarning(
              "Ảnh vượt quá kích thước",
              `Ảnh tại câu hỏi ${questionIndex + 1} vượt quá giới hạn 15MB.`
            );
            continue;
          }

          try {
            const res = await uploadApi.uploadQuestionImage(savedQuestion.id, file);
            if (res) {
              media.url = res.url;
              media.storageKey = res.storageKey;
              delete media.dataUrl;
            }
          } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 413) {
              showError("Ảnh quá dung lượng", `Ảnh tại câu hỏi ${questionIndex + 1} vượt quá dung lượng.`);
            } else {
              console.error(`Lỗi tải ảnh câu hỏi (${savedQuestion.id}):`, err);
            }
          }
        }
      }

      if (draftQuestion.answers?.length) {
        for (let answerIndex = 0; answerIndex < draftQuestion.answers.length; answerIndex += 1) {
          const draftAnswer = draftQuestion.answers[answerIndex];
          const savedAnswer = savedQuestion.answers?.[answerIndex];
          if (!savedAnswer || !draftAnswer.media?.length) continue;

          for (let mIdx = 0; mIdx < draftAnswer.media.length; mIdx += 1) {
            const media = draftAnswer.media[mIdx];
            if (!media.dataUrl && media.url && (media.url.startsWith("http") || media.url.startsWith("/storage"))) {
              continue;
            }
            const file = await mediaToFile(media);
            if (!file) continue;

            if (file.size > MAX_FILE_SIZE) {
              showWarning(
                "Ảnh đáp án vượt quá kích thước",
                `Ảnh tại đáp án ${answerIndex + 1} câu ${questionIndex + 1} vượt quá 15MB.`
              );
              continue;
            }

            try {
              const res = await uploadApi.uploadAnswerImage(savedAnswer.id, file);
              if (res) {
                media.url = res.url;
                media.storageKey = res.storageKey;
                delete media.dataUrl;
              }
            } catch (err: unknown) {
              const status = (err as { response?: { status?: number } })?.response?.status;
              if (status === 413) {
                showError("Ảnh quá dung lượng", `Ảnh đáp án tại câu hỏi ${questionIndex + 1} vượt quá dung lượng.`);
              } else {
                console.error(`Lỗi tải ảnh đáp án (${savedAnswer.id}):`, err);
              }
            }
          }
        }
      }
    }

    return { updatedQuestions };
  }

  return {};
}

export const useQuizBuilder = (initialQuizId?: string) => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotification();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  const [quiz, setQuiz] = useState<QuizDraft>({
    title: "",
    description: "",
    categoryId: "",
    timeLimit: 30,
    sections: [createDefaultSection(1, "PHẦN 1: TRẮC NGHIỆM")],
    questions: [createDefaultQuestion(1)],
    status: "DRAFT",
  });

  const [initialLoading, setInitialLoading] = useState<boolean>(Boolean(initialQuizId));
  const [saving, setSaving] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  // 1. Tải danh mục Categories
  useEffect(() => {
    let isMounted = true;
    categoryApi
      .getCategories()
      .then((data) => {
        if (isMounted) setCategories(data);
      })
      .catch((err) => console.error("Lỗi tải danh mục:", err))
      .finally(() => {
        if (isMounted) setCategoriesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Tải bài thi nếu đang ở chế độ Edit
  useEffect(() => {
    if (!initialQuizId) return;

    let isMounted = true;
    setInitialLoading(true);

    quizApi
      .getQuizById(initialQuizId)
      .then((data) => {
        if (!isMounted || !data) return;

        // Build sections
        let draftSections: QuizSectionDraft[] = [];
        if (data.sections && data.sections.length > 0) {
          draftSections = data.sections.map((sec, sIdx) => ({
            id: sec.id,
            title: sec.title,
            description: sec.description || undefined,
            order: sec.order || sIdx + 1,
            questions: (sec.questions || []).map((q, qIdx) => ({
              id: q.id,
              sectionId: sec.id,
              content: q.content,
              type: q.type,
              points: q.points,
              order: qIdx + 1,
              media: q.media?.map((media) => ({
                tempId: media.id,
                type: "IMAGE" as const,
                assetId: media.id,
                order: media.order,
                originalName: media.originalName || undefined,
                mimeType: media.mimeType,
                url: media.url || media.storageKey,
                width: media.width || undefined,
                height: media.height || undefined,
              })),
              answers: (q.answers || []).map((a, aIdx) => ({
                id: a.id,
                content: a.content,
                isCorrect: Boolean(a.isCorrect),
                order: aIdx + 1,
                media: a.media?.map((media) => ({
                  tempId: media.id,
                  type: "IMAGE" as const,
                  assetId: media.id,
                  order: media.order,
                  originalName: media.originalName || undefined,
                  mimeType: media.mimeType,
                  url: media.url || media.storageKey,
                  width: media.width || undefined,
                  height: media.height || undefined,
                })),
              })),
            })),
          }));
        } else if (data.questions && data.questions.length > 0) {
          draftSections = [
            {
              title: "PHẦN 1: TRẮC NGHIỆM",
              order: 1,
              questions: data.questions.map((q, idx) => ({
                id: q.id,
                content: q.content,
                type: q.type,
                points: q.points,
                order: idx + 1,
                media: q.media?.map((media) => ({
                  tempId: media.id,
                  type: "IMAGE" as const,
                  assetId: media.id,
                  order: media.order,
                  originalName: media.originalName || undefined,
                  mimeType: media.mimeType,
                  url: media.url || media.storageKey,
                  width: media.width || undefined,
                  height: media.height || undefined,
                })),
                answers: (q.answers || []).map((a, aIdx) => ({
                  id: a.id,
                  content: a.content,
                  isCorrect: Boolean(a.isCorrect),
                  order: aIdx + 1,
                  media: a.media?.map((media) => ({
                    tempId: media.id,
                    type: "IMAGE" as const,
                    assetId: media.id,
                    order: media.order,
                    originalName: media.originalName || undefined,
                    mimeType: media.mimeType,
                    url: media.url || media.storageKey,
                    width: media.width || undefined,
                    height: media.height || undefined,
                  })),
                })),
              })),
            },
          ];
        } else {
          draftSections = [createDefaultSection(1)];
        }

        const flatQuestions: QuestionDraft[] = draftSections.flatMap((s) => s.questions);

        setQuiz({
          id: data.id,
          title: data.title,
          description: data.description || "",
          coverKey: data.coverKey || null,
          coverUrl: data.coverUrl || null,
          categoryId: data.categoryId || "",
          timeLimit: data.timeLimit || null,
          status: data.status,
          sections: draftSections,
          questions: flatQuestions,
        });
      })
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: { message?: string; code?: string } } };
        console.error("Lỗi khi tải bài thi để sửa:", err);
        showError("Lỗi tải đề thi", apiError.response?.data?.message || "Không thể tải bài thi này");
        navigate("/my-quizzes");
      })
      .finally(() => {
        if (isMounted) setInitialLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialQuizId, navigate]);

  // Cover handlers
  const setCover = (coverUrl: string, coverKey?: string, file?: File) => {
    setQuiz((prev) => ({
      ...prev,
      coverUrl,
      coverKey: coverKey || prev.coverKey,
      coverFile: file || prev.coverFile,
    }));
  };

  const removeCover = () => {
    setQuiz((prev) => ({
      ...prev,
      coverUrl: null,
      coverKey: null,
      coverFile: null,
    }));
  };

  // Các hàm cập nhật thông tin cơ bản
  const setTitle = (title: string) => {
    setQuiz((prev) => ({ ...prev, title }));
    if (validationErrors.title) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.title;
        return next;
      });
    }
  };

  const setDescription = (description: string) => {
    setQuiz((prev) => ({ ...prev, description }));
  };

  const setCategoryId = (categoryId: string) => {
    setQuiz((prev) => ({ ...prev, categoryId }));
    if (validationErrors.categoryId) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.categoryId;
        return next;
      });
    }
  };

  const setTimeLimit = (timeLimit: number | null) => {
    setQuiz((prev) => ({ ...prev, timeLimit }));
  };

  // ================= QUẢN LÝ PHẦN (SECTION ACTIONS) =================
  const addSection = (title?: string) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const nextOrder = currentSections.length + 1;
      const newSec = createDefaultSection(nextOrder, title || `PHẦN ${nextOrder}: NỘI DUNG MỚI`);
      const updated = [...currentSections, newSec].map((s, idx) => ({ ...s, order: idx + 1 }));
      return {
        ...prev,
        sections: updated,
        questions: updated.flatMap((s) => s.questions),
      };
    });
  };

  const updateSection = (sectionIndex: number, fields: Partial<QuizSectionDraft>) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const updated = [...currentSections];
      if (updated[sectionIndex]) {
        updated[sectionIndex] = { ...updated[sectionIndex], ...fields };
      }
      return {
        ...prev,
        sections: updated,
        questions: updated.flatMap((s) => s.questions),
      };
    });
  };

  const deleteSection = (sectionIndex: number) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      if (currentSections.length <= 1) {
        showWarning("Cấu trúc đề thi", "Đề thi phải có ít nhất 1 phần.");
        return prev;
      }
      const updated = currentSections
        .filter((_, i) => i !== sectionIndex)
        .map((s, i) => ({ ...s, order: i + 1 }));
      return {
        ...prev,
        sections: updated,
        questions: updated.flatMap((s) => s.questions),
      };
    });
  };

  const moveSection = (sectionIndex: number, direction: "UP" | "DOWN") => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const targetIndex = direction === "UP" ? sectionIndex - 1 : sectionIndex + 1;
      if (targetIndex < 0 || targetIndex >= currentSections.length) return prev;

      const newSections = [...currentSections];
      const temp = newSections[sectionIndex];
      newSections[sectionIndex] = newSections[targetIndex];
      newSections[targetIndex] = temp;

      const updated = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
      return {
        ...prev,
        sections: updated,
        questions: updated.flatMap((s) => s.questions),
      };
    });
  };

  // ================= QUẢN LÝ CÂU HỎI TRONG PHẦN (QUESTION IN SECTION) =================
  const addQuestionToSection = (sectionIndex: number, type: QuestionType = "MULTIPLE_CHOICE") => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const sec = currentSections[sectionIndex] || currentSections[0];
      const newQuestion = createDefaultQuestion(sec.questions.length + 1, type);

      const updatedSec = {
        ...sec,
        questions: [...sec.questions, newQuestion],
      };

      const updatedSections = [...currentSections];
      updatedSections[sectionIndex] = updatedSec;

      return {
        ...prev,
        sections: updatedSections,
        questions: updatedSections.flatMap((s) => s.questions),
      };
    });
  };

  const deleteQuestionFromSection = (sectionIndex: number, questionIndex: number) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const sec = currentSections[sectionIndex];
      if (!sec) return prev;

      const totalQuestions = currentSections.reduce((sum, s) => sum + s.questions.length, 0);
      if (totalQuestions <= 1) {
        showWarning("Cấu trúc đề thi", "Đề thi cần có ít nhất một câu hỏi.");
        return prev;
      }

      const updatedQuestions = sec.questions
        .filter((_, i) => i !== questionIndex)
        .map((q, i) => ({ ...q, order: i + 1 }));

      const updatedSections = [...currentSections];
      updatedSections[sectionIndex] = { ...sec, questions: updatedQuestions };

      return {
        ...prev,
        sections: updatedSections,
        questions: updatedSections.flatMap((s) => s.questions),
      };
    });
  };

  const moveQuestionInSection = (sectionIndex: number, questionIndex: number, direction: "UP" | "DOWN") => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const sec = currentSections[sectionIndex];
      if (!sec) return prev;

      const targetIndex = direction === "UP" ? questionIndex - 1 : questionIndex + 1;
      if (targetIndex < 0 || targetIndex >= sec.questions.length) return prev;

      const newQuestions = [...sec.questions];
      const temp = newQuestions[questionIndex];
      newQuestions[questionIndex] = newQuestions[targetIndex];
      newQuestions[targetIndex] = temp;

      const updatedQuestions = newQuestions.map((q, idx) => ({ ...q, order: idx + 1 }));
      const updatedSections = [...currentSections];
      updatedSections[sectionIndex] = { ...sec, questions: updatedQuestions };

      return {
        ...prev,
        sections: updatedSections,
        questions: updatedSections.flatMap((s) => s.questions),
      };
    });
  };

  const updateQuestionInSection = (
    sectionIndex: number,
    questionIndex: number,
    fields: Partial<QuestionDraft>
  ) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const sec = currentSections[sectionIndex];
      if (!sec || !sec.questions[questionIndex]) return prev;

      const newQuestions = [...sec.questions];
      newQuestions[questionIndex] = { ...newQuestions[questionIndex], ...fields };

      const updatedSections = [...currentSections];
      updatedSections[sectionIndex] = { ...sec, questions: newQuestions };

      return {
        ...prev,
        sections: updatedSections,
        questions: updatedSections.flatMap((s) => s.questions),
      };
    });
  };

  const changeQuestionTypeInSection = (
    sectionIndex: number,
    questionIndex: number,
    type: QuestionType
  ) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const sec = currentSections[sectionIndex];
      if (!sec || !sec.questions[questionIndex]) return prev;

      const current = sec.questions[questionIndex];
      if (current.type === type) return prev;

      const newQuestions = [...sec.questions];
      if (type === "TRUE_FALSE") {
        newQuestions[questionIndex] = {
          ...current,
          type,
          answers: [
            { content: "Đúng (True)", isCorrect: true, order: 1 },
            { content: "Sai (False)", isCorrect: false, order: 2 },
          ],
        };
      } else {
        newQuestions[questionIndex] = {
          ...current,
          type: "MULTIPLE_CHOICE",
          answers: [
            createDefaultAnswer(1, true),
            createDefaultAnswer(2, false),
            createDefaultAnswer(3, false),
            createDefaultAnswer(4, false),
          ],
        };
      }

      const updatedSections = [...currentSections];
      updatedSections[sectionIndex] = { ...sec, questions: newQuestions };

      return {
        ...prev,
        sections: updatedSections,
        questions: updatedSections.flatMap((s) => s.questions),
      };
    });
  };

  const addAnswerInSection = (sectionIndex: number, questionIndex: number) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const sec = currentSections[sectionIndex];
      if (!sec || !sec.questions[questionIndex]) return prev;

      const q = sec.questions[questionIndex];
      if (q.type === "TRUE_FALSE") return prev;

      const newQuestions = [...sec.questions];
      newQuestions[questionIndex] = {
        ...q,
        answers: [...q.answers, createDefaultAnswer(q.answers.length + 1, false)],
      };

      const updatedSections = [...currentSections];
      updatedSections[sectionIndex] = { ...sec, questions: newQuestions };

      return {
        ...prev,
        sections: updatedSections,
        questions: updatedSections.flatMap((s) => s.questions),
      };
    });
  };

  const deleteAnswerInSection = (
    sectionIndex: number,
    questionIndex: number,
    answerIndex: number
  ) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const sec = currentSections[sectionIndex];
      if (!sec || !sec.questions[questionIndex]) return prev;

      const q = sec.questions[questionIndex];
      if (q.type === "TRUE_FALSE") return prev;
      if (q.answers.length <= 2) {
        showWarning("Số lượng đáp án", "Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án.");
        return prev;
      }

      const updatedAnswers = q.answers
        .filter((_, i) => i !== answerIndex)
        .map((a, i) => ({ ...a, order: i + 1 }));

      const hasCorrect = updatedAnswers.some((a) => a.isCorrect);
      if (!hasCorrect && updatedAnswers.length > 0) {
        updatedAnswers[0].isCorrect = true;
      }

      const newQuestions = [...sec.questions];
      newQuestions[questionIndex] = { ...q, answers: updatedAnswers };

      const updatedSections = [...currentSections];
      updatedSections[sectionIndex] = { ...sec, questions: newQuestions };

      return {
        ...prev,
        sections: updatedSections,
        questions: updatedSections.flatMap((s) => s.questions),
      };
    });
  };

  const updateAnswerInSection = (
    sectionIndex: number,
    questionIndex: number,
    answerIndex: number,
    content: string
  ) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const sec = currentSections[sectionIndex];
      if (!sec || !sec.questions[questionIndex]) return prev;

      const q = sec.questions[questionIndex];
      const newAnswers = [...q.answers];
      newAnswers[answerIndex] = { ...newAnswers[answerIndex], content };

      const newQuestions = [...sec.questions];
      newQuestions[questionIndex] = { ...q, answers: newAnswers };

      const updatedSections = [...currentSections];
      updatedSections[sectionIndex] = { ...sec, questions: newQuestions };

      return {
        ...prev,
        sections: updatedSections,
        questions: updatedSections.flatMap((s) => s.questions),
      };
    });
  };

  const setCorrectAnswerInSection = (
    sectionIndex: number,
    questionIndex: number,
    answerIndex: number
  ) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const sec = currentSections[sectionIndex];
      if (!sec || !sec.questions[questionIndex]) return prev;

      const q = sec.questions[questionIndex];
      const newAnswers = q.answers.map((a, idx) => ({
        ...a,
        isCorrect: idx === answerIndex,
      }));

      const newQuestions = [...sec.questions];
      newQuestions[questionIndex] = { ...q, answers: newAnswers };

      const updatedSections = [...currentSections];
      updatedSections[sectionIndex] = { ...sec, questions: newQuestions };

      return {
        ...prev,
        sections: updatedSections,
        questions: updatedSections.flatMap((s) => s.questions),
      };
    });
  };

  const moveQuestionAcrossSections = (
    sourceSectionIndex: number,
    questionIndex: number,
    targetSectionIndex: number
  ) => {
    setQuiz((prev) => {
      const currentSections = prev.sections && prev.sections.length > 0 ? prev.sections : [createDefaultSection(1)];
      const sourceSec = currentSections[sourceSectionIndex];
      const targetSec = currentSections[targetSectionIndex];
      if (!sourceSec || !targetSec || sourceSectionIndex === targetSectionIndex) return prev;

      const questionToMove = sourceSec.questions[questionIndex];
      if (!questionToMove) return prev;

      const updatedSourceQuestions = sourceSec.questions
        .filter((_, i) => i !== questionIndex)
        .map((q, i) => ({ ...q, order: i + 1 }));

      const updatedTargetQuestions = [
        ...targetSec.questions,
        { ...questionToMove, order: targetSec.questions.length + 1 },
      ];

      const updatedSections = [...currentSections];
      updatedSections[sourceSectionIndex] = { ...sourceSec, questions: updatedSourceQuestions };
      updatedSections[targetSectionIndex] = { ...targetSec, questions: updatedTargetQuestions };

      return {
        ...prev,
        sections: updatedSections,
        questions: updatedSections.flatMap((s) => s.questions),
      };
    });
  };

  // Import sections
  const importSections = (newSections: QuizSectionDraft[], replace: boolean = true) => {
    setQuiz((prev) => {
      const formatted = newSections.map((sec, sIdx) => ({
        ...sec,
        order: sIdx + 1,
        questions: (sec.questions || []).map((q, qIdx) => ({
          ...q,
          order: qIdx + 1,
        })),
      }));

      let finalSections: QuizSectionDraft[] = [];
      if (replace || !prev.sections || prev.sections.length === 0) {
        finalSections = formatted;
      } else {
        finalSections = [...prev.sections, ...formatted].map((s, i) => ({ ...s, order: i + 1 }));
      }

      return {
        ...prev,
        sections: finalSections,
        questions: finalSections.flatMap((s) => s.questions),
      };
    });
  };

  // Legacy helper methods operating on first section
  const addQuestion = (type: QuestionType = "MULTIPLE_CHOICE") => addQuestionToSection(0, type);
  const deleteQuestion = (index: number) => deleteQuestionFromSection(0, index);
  const moveQuestion = (index: number, direction: "UP" | "DOWN") => moveQuestionInSection(0, index, direction);
  const updateQuestion = (index: number, fields: Partial<QuestionDraft>) => updateQuestionInSection(0, index, fields);
  const changeQuestionType = (index: number, type: QuestionType) => changeQuestionTypeInSection(0, index, type);
  const addAnswer = (qIndex: number) => addAnswerInSection(0, qIndex);
  const deleteAnswer = (qIndex: number, aIndex: number) => deleteAnswerInSection(0, qIndex, aIndex);
  const updateAnswer = (qIndex: number, aIndex: number, content: string) => updateAnswerInSection(0, qIndex, aIndex, content);
  const setCorrectAnswer = (qIndex: number, aIndex: number) => setCorrectAnswerInSection(0, qIndex, aIndex);

  const importQuestions = (newQuestions: QuestionDraft[], replace: boolean = false) => {
    const singleSec: QuizSectionDraft = {
      title: "PHẦN 1: TRẮC NGHIỆM",
      order: 1,
      questions: newQuestions.map((q, idx) => ({ ...q, order: idx + 1 })),
    };
    importSections([singleSec], replace);
  };

  // ================= 3. LƯU BẢN NHÁP (SAVE DRAFT) =================
  const saveDraft = useCallback(async (): Promise<string | null> => {
    const validation = validateQuizDraft(quiz, false);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showWarning("Chưa hoàn thiện đề thi", validation.firstError || "Vui lòng kiểm tra lại thông tin đề thi.");
      return null;
    }

    try {
      setSaving(true);
      setValidationErrors({});

      let resultId = quiz.id;

      if (quiz.id) {
        // Cập nhật với payload sạch (text + metadata, không chứa Base64)
        const cleanPayload = buildCleanPayload(quiz);
        const updated = await quizApi.updateQuiz(quiz.id, cleanPayload);
        const { updatedSections, updatedQuestions } = await persistImportedQuestionMedia(
          updated,
          quiz.sections,
          quiz.questions,
          showWarning,
          showError
        );

        if (quiz.coverFile) {
          const coverRes = await uploadApi.uploadQuizCover(quiz.id, quiz.coverFile);
          setQuiz((prev) => ({
            ...prev,
            coverUrl: coverRes.coverUrl,
            coverKey: coverRes.coverKey,
            coverFile: null,
            sections: updatedSections || prev.sections,
            questions: updatedQuestions || prev.questions,
          }));
        } else {
          setQuiz((prev) => ({
            ...prev,
            sections: updatedSections || prev.sections,
            questions: updatedQuestions || prev.questions,
          }));
        }
      } else {
        // Tạo mới với payload sạch (text + metadata, không chứa Base64)
        const cleanPayload = buildCleanPayload(quiz);
        const created = await quizApi.createQuiz(cleanPayload);
        resultId = created.id;
        const { updatedSections, updatedQuestions } = await persistImportedQuestionMedia(
          created,
          quiz.sections,
          quiz.questions,
          showWarning,
          showError
        );

        if (quiz.coverFile && created.id) {
          const coverRes = await uploadApi.uploadQuizCover(created.id, quiz.coverFile);
          setQuiz((prev) => ({
            ...prev,
            id: created.id,
            coverUrl: coverRes.coverUrl,
            coverKey: coverRes.coverKey,
            coverFile: null,
            status: "DRAFT",
            sections: updatedSections || prev.sections,
            questions: updatedQuestions || prev.questions,
          }));
        } else {
          setQuiz((prev) => ({
            ...prev,
            id: created.id,
            status: "DRAFT",
            sections: updatedSections || prev.sections,
            questions: updatedQuestions || prev.questions,
          }));
        }
      }

      showSuccess("Lưu bản nháp thành công!", "Dữ liệu đề thi đã được lưu an toàn.");
      return resultId || null;
    } catch (err: unknown) {
      const apiError = err as { response?: { status?: number; data?: { message?: string; code?: string } } };
      console.error("Lỗi khi lưu nháp:", err);
      let errorMsg = apiError.response?.data?.message || "Không thể lưu đề thi.";
      if (apiError.response?.status === 413) {
        errorMsg = "Dữ liệu gửi lên vượt quá dung lượng cho phép của máy chủ (413). Vui lòng kiểm tra lại hình ảnh hoặc tệp tải lên.";
      }
      showError("Lỗi lưu đề thi", errorMsg);
      return null;
    } finally {
      setSaving(false);
    }
  }, [quiz, showSuccess, showError, showWarning]);

  // ================= 4. XUẤT BẢN ĐỀ THI (PUBLISH) =================
  const publish = useCallback(async () => {
    const validation = validateQuizDraft(quiz, true);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showWarning("Chưa đủ điều kiện", validation.firstError || "Đề thi chưa đủ điều kiện xuất bản.");
      return;
    }

    try {
      setPublishing(true);
      setValidationErrors({});

      let activeQuizId = quiz.id;
      if (!activeQuizId) {
        const cleanPayload = buildCleanPayload(quiz);
        const created = await quizApi.createQuiz(cleanPayload);
        activeQuizId = created.id;
        await persistImportedQuestionMedia(
          created,
          quiz.sections,
          quiz.questions,
          showWarning,
          showError
        );

        if (quiz.coverFile && created.id) {
          await uploadApi.uploadQuizCover(created.id, quiz.coverFile);
        }
      } else {
        const cleanPayload = buildCleanPayload(quiz);
        const updated = await quizApi.updateQuiz(activeQuizId, cleanPayload);
        await persistImportedQuestionMedia(
          updated,
          quiz.sections,
          quiz.questions,
          showWarning,
          showError
        );

        if (quiz.coverFile) {
          await uploadApi.uploadQuizCover(activeQuizId, quiz.coverFile);
        }
      }

      await quizApi.publishQuiz(activeQuizId);

      showSuccess("Xuất bản thành công!", "🎉 Đề thi hiện đã được công khai trên hệ thống HUBT.");
      navigate("/my-quizzes");
    } catch (err: unknown) {
      const apiError = err as { response?: { status?: number; data?: { message?: string; code?: string } } };
      console.error("Lỗi khi xuất bản bài thi:", err);
      let errorMsg = apiError.response?.data?.message || "Không thể xuất bản bài thi.";
      if (apiError.response?.status === 413) {
        errorMsg = "Dữ liệu đề thi vượt quá giới hạn của máy chủ (413). Vui lòng kiểm tra lại hình ảnh hoặc tệp tải lên.";
      }
      showError("Lỗi xuất bản", errorMsg);
    } finally {
      setPublishing(false);
    }
  }, [quiz, navigate, showSuccess, showError, showWarning]);

  return {
    quiz,
    categories,
    categoriesLoading,
    initialLoading,
    saving,
    publishing,
    validationErrors,
    previewOpen,
    setPreviewOpen,
    setTitle,
    setDescription,
    setCover,
    removeCover,
    setCategoryId,
    setTimeLimit,
    // Section Management
    addSection,
    updateSection,
    deleteSection,
    moveSection,
    addQuestionToSection,
    deleteQuestionFromSection,
    moveQuestionInSection,
    updateQuestionInSection,
    changeQuestionTypeInSection,
    addAnswerInSection,
    deleteAnswerInSection,
    updateAnswerInSection,
    setCorrectAnswerInSection,
    moveQuestionAcrossSections,
    importSections,
    // Legacy support
    addQuestion,
    deleteQuestion,
    moveQuestion,
    updateQuestion,
    changeQuestionType,
    addAnswer,
    deleteAnswer,
    updateAnswer,
    setCorrectAnswer,
    importQuestions,
    saveDraft,
    publish,
  };
};
