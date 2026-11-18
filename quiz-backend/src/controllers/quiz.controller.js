import { StatusCodes } from "http-status-codes";
import { quizService } from "../services/quiz.service.js";

export const quizController = {
  // Lấy danh sách bài thi công khai
  async getQuizzes(req, res, next) {
    try {
      const { page, limit, search, categoryId, majorId } = req.query;
      const currentUser = req.user || req.jwtDecoded || null;
      const result = await quizService.getAllQuizzes({
        page,
        limit,
        search,
        categoryId,
        majorId,
        currentUser,
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Lấy danh sách bài thi do chính user tạo
  async getMyQuizzes(req, res, next) {
    try {
      const authorId = req.user.id;
      const { page, limit, search, status } = req.query;
      const result = await quizService.getMyQuizzes(authorId, {
        page,
        limit,
        search,
        status,
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Lấy chi tiết bài thi theo ID
  async getQuizById(req, res, next) {
    try {
      const { id } = req.params;
      const currentUser = req.user || req.jwtDecoded || null;
      const quiz = await quizService.getQuizById(
        id,
        currentUser?.id || null,
        currentUser?.role || null,
        currentUser?.majorId || null
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: quiz,
      });
    } catch (error) {
      next(error);
    }
  },

  // Tạo bài thi mới (authorId tự động lấy từ JWT)
  async createQuiz(req, res, next) {
    try {
      const authorId = req.user.id;
      const quiz = await quizService.createQuiz(authorId, req.body);

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: quiz,
        message: "Tạo đề thi thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật bài thi (kiểm tra ownership)
  async updateQuiz(req, res, next) {
    try {
      const { id } = req.params;
      const authorId = req.user.id;
      const updatedQuiz = await quizService.updateQuiz(id, authorId, req.body);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: updatedQuiz,
        message: "Cập nhật bài thi thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // Xóa bài thi (kiểm tra ownership hoặc quyền Admin)
  async deleteQuiz(req, res, next) {
    try {
      const { id } = req.params;
      const authorId = req.user.id;
      const userRole = req.user.role;
      await quizService.deleteQuiz(id, authorId, userRole);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Xóa đề thi thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // Xuất bản bài thi (Chuyển sang PUBLISHED)
  async publishQuiz(req, res, next) {
    try {
      const { id } = req.params;
      const authorId = req.user.id;
      const publishedQuiz = await quizService.publishQuiz(id, authorId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: publishedQuiz,
        message: "Xuất bản bài thi thành công",
      });
    } catch (error) {
      next(error);
    }
  },
};
