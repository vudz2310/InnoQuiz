import { prisma } from "../config/DB.js";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";

export const quizSectionService = {
  /**
   * Tạo phần mới cho đề thi
   */
  async createSection(quizId, authorId, data) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { sections: { orderBy: { order: "desc" }, take: 1 } },
    });

    if (!quiz) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy đề thi");
    }

    if (quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền chỉnh sửa đề thi này");
    }

    const { title, description } = data;
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Tiêu đề phần là bắt buộc");
    }

    const nextOrder = data.order !== undefined
      ? parseInt(data.order, 10)
      : (quiz.sections[0]?.order ? quiz.sections[0].order + 1 : 1);

    const section = await prisma.quizSection.create({
      data: {
        quizId,
        title: title.trim(),
        description: description?.trim() || null,
        order: nextOrder,
      },
      include: {
        questions: {
          include: { answers: true },
        },
      },
    });

    return section;
  },

  /**
   * Lấy danh sách tất cả các phần trong đề thi
   */
  async getSectionsByQuizId(quizId, currentUserId = null) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, authorId: true, status: true },
    });

    if (!quiz) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy đề thi");
    }

    const isAuthor = currentUserId && quiz.authorId === currentUserId;

    if (quiz.status === "DRAFT" && !isAuthor) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền xem bản nháp này");
    }

    const sections = await prisma.quizSection.findMany({
      where: { quizId },
      orderBy: { order: "asc" },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            answers: {
              orderBy: { order: "asc" },
              include: { media: { orderBy: { order: "asc" } } },
            },
          },
        },
      },
    });

    if (!isAuthor) {
      return sections.map((sec) => ({
        ...sec,
        questions: sec.questions.map((q) => ({
          ...q,
          answers: q.answers.map(({ isCorrect, ...rest }) => rest),
        })),
      }));
    }

    return sections;
  },

  /**
   * Cập nhật thông tin phần (tiêu đề, mô tả, thứ tự)
   */
  async updateSection(sectionId, authorId, data) {
    const section = await prisma.quizSection.findUnique({
      where: { id: sectionId },
      include: { quiz: true },
    });

    if (!section) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phần thi");
    }

    if (section.quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền chỉnh sửa phần thi này");
    }

    const updateData = {};
    if (data.title !== undefined) {
      if (!data.title || !data.title.trim()) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Tiêu đề phần không được để trống");
      }
      updateData.title = data.title.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description ? data.description.trim() : null;
    }
    if (data.order !== undefined) {
      updateData.order = parseInt(data.order, 10);
    }

    const updated = await prisma.quizSection.update({
      where: { id: sectionId },
      data: updateData,
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { answers: true },
        },
      },
    });

    return updated;
  },

  /**
   * Xóa một phần
   */
  async deleteSection(sectionId, authorId) {
    const section = await prisma.quizSection.findUnique({
      where: { id: sectionId },
      include: { quiz: true },
    });

    if (!section) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phần thi");
    }

    if (section.quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền xóa phần thi này");
    }

    await prisma.quizSection.delete({
      where: { id: sectionId },
    });

    return { success: true, message: "Xóa phần thi thành công" };
  },

  /**
   * Đổi thứ tự các phần trong đề thi
   */
  async reorderSections(quizId, authorId, sectionOrders) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy đề thi");
    }

    if (quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền chỉnh sửa đề thi này");
    }

    if (!Array.isArray(sectionOrders)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Danh sách thứ tự phần không hợp lệ");
    }

    await prisma.$transaction(
      sectionOrders.map((item, idx) =>
        prisma.quizSection.update({
          where: { id: item.id },
          data: { order: item.order !== undefined ? item.order : idx + 1 },
        })
      )
    );

    return await this.getSectionsByQuizId(quizId, authorId);
  },

  /**
   * Đổi thứ tự câu hỏi trong một phần (reset numbering 1, 2, 3...)
   */
  async reorderQuestionsInSection(sectionId, authorId, questionOrders) {
    const section = await prisma.quizSection.findUnique({
      where: { id: sectionId },
      include: { quiz: true },
    });

    if (!section) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phần thi");
    }

    if (section.quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền chỉnh sửa phần thi này");
    }

    if (!Array.isArray(questionOrders)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Danh sách thứ tự câu hỏi không hợp lệ");
    }

    await prisma.$transaction(
      questionOrders.map((item, idx) =>
        prisma.question.update({
          where: { id: item.id },
          data: {
            sectionId,
            order: item.order !== undefined ? item.order : idx + 1,
          },
        })
      )
    );

    return await prisma.quizSection.findUnique({
      where: { id: sectionId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { answers: true },
        },
      },
    });
  },

  /**
   * Di chuyển câu hỏi sang phần khác
   */
  async moveQuestionToSection(questionId, targetSectionId, authorId, newOrder = null) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });

    if (!question) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy câu hỏi");
    }

    if (question.quiz.authorId !== authorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Bạn không có quyền di chuyển câu hỏi này");
    }

    if (targetSectionId) {
      const targetSec = await prisma.quizSection.findUnique({
        where: { id: targetSectionId },
      });

      if (!targetSec || targetSec.quizId !== question.quizId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Phần đích không tồn tại hoặc không thuộc đề thi này"
        );
      }
    }

    const maxOrder = targetSectionId
      ? await prisma.question.count({ where: { sectionId: targetSectionId } })
      : 0;

    const finalOrder = newOrder !== null ? newOrder : maxOrder + 1;

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        sectionId: targetSectionId || null,
        order: finalOrder,
      },
      include: { answers: true },
    });

    return updated;
  },
};
