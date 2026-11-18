import { prisma } from "../config/DB.js";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";

export const questionService = {
  /**
   * Tạo câu hỏi mới cho Quiz (Kiểm tra authorId của Quiz)
   */
  async createQuestion(authorId, quizId, data) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy bài thi");
    }

    if (quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền thêm câu hỏi vào bài thi này");
    }

    const { content, type = "MULTIPLE_CHOICE", points = 1, order, answers = [] } = data;

    if (!content || !content.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Nội dung câu hỏi không được để trống");
    }

    const currentQuestionCount = await prisma.question.count({
      where: { quizId },
    });

    const questionOrder = typeof order === "number" ? order : currentQuestionCount + 1;

    return await prisma.$transaction(async (tx) => {
      const newQuestion = await tx.question.create({
        data: {
          quizId,
          content: content.trim(),
          type,
          points: Number(points) || 1,
          order: questionOrder,
        },
      });

      if (Array.isArray(answers) && answers.length > 0) {
        for (let i = 0; i < answers.length; i++) {
          const a = answers[i];
          await tx.answer.create({
            data: {
              questionId: newQuestion.id,
              content: a.content?.trim() || `Đáp án ${i + 1}`,
              isCorrect: Boolean(a.isCorrect),
              order: i + 1,
            },
          });
        }
      }

      return await tx.question.findUnique({
        where: { id: newQuestion.id },
        include: {
          answers: {
            orderBy: { order: "asc" },
            include: { media: { orderBy: { order: "asc" } } },
          },
        },
      });
    });
  },

  /**
   * Cập nhật câu hỏi (Kiểm tra ownership qua question -> quiz.authorId)
   */
  async updateQuestion(authorId, questionId, data) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });

    if (!question) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy câu hỏi");
    }

    if (question.quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền chỉnh sửa câu hỏi này");
    }

    const { content, type, points, order, answers } = data;

    return await prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id: questionId },
        data: {
          ...(content !== undefined && { content: content.trim() }),
          ...(type !== undefined && { type }),
          ...(points !== undefined && { points: Number(points) || 1 }),
          ...(order !== undefined && { order: Number(order) }),
        },
      });

      // Nếu có truyền answers thì cập nhật lại danh sách đáp án
      if (Array.isArray(answers)) {
        await tx.answer.deleteMany({
          where: { questionId },
        });

        for (let i = 0; i < answers.length; i++) {
          const a = answers[i];
          await tx.answer.create({
            data: {
              questionId,
              content: a.content?.trim() || `Đáp án ${i + 1}`,
              isCorrect: Boolean(a.isCorrect),
              order: i + 1,
            },
          });
        }
      }

      return await tx.question.findUnique({
        where: { id: questionId },
        include: {
          answers: {
            orderBy: { order: "asc" },
            include: { media: { orderBy: { order: "asc" } } },
          },
        },
      });
    });
  },

  /**
   * Xóa câu hỏi (Kiểm tra ownership qua question -> quiz.authorId)
   */
  async deleteQuestion(authorId, questionId) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });

    if (!question) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy câu hỏi");
    }

    if (question.quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền xóa câu hỏi này");
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    return true;
  },
};
