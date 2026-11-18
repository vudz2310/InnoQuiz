import { quizSectionService } from "../services/quizSection.service.js";
import { StatusCodes } from "http-status-codes";

export const quizSectionController = {
  async createSection(req, res, next) {
    try {
      const { quizId } = req.params;
      const authorId = req.user.id;
      const section = await quizSectionService.createSection(quizId, authorId, req.body);
      res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Tạo phần thi thành công",
        data: section,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSectionsByQuizId(req, res, next) {
    try {
      const { quizId } = req.params;
      const currentUserId = req.user?.id || null;
      const sections = await quizSectionService.getSectionsByQuizId(quizId, currentUserId);
      res.status(StatusCodes.OK).json({
        success: true,
        data: sections,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateSection(req, res, next) {
    try {
      const { sectionId } = req.params;
      const authorId = req.user.id;
      const section = await quizSectionService.updateSection(sectionId, authorId, req.body);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Cập nhật phần thi thành công",
        data: section,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteSection(req, res, next) {
    try {
      const { sectionId } = req.params;
      const authorId = req.user.id;
      const result = await quizSectionService.deleteSection(sectionId, authorId);
      res.status(StatusCodes.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  async reorderSections(req, res, next) {
    try {
      const { quizId } = req.params;
      const authorId = req.user.id;
      const { sections } = req.body;
      const result = await quizSectionService.reorderSections(quizId, authorId, sections);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Đổi thứ tự phần thi thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async reorderQuestionsInSection(req, res, next) {
    try {
      const { sectionId } = req.params;
      const authorId = req.user.id;
      const { questions } = req.body;
      const result = await quizSectionService.reorderQuestionsInSection(sectionId, authorId, questions);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Đổi thứ tự câu hỏi trong phần thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async moveQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      const authorId = req.user.id;
      const { targetSectionId, order } = req.body;
      const result = await quizSectionService.moveQuestionToSection(
        questionId,
        targetSectionId,
        authorId,
        order
      );
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Di chuyển câu hỏi thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
