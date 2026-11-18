import { StatusCodes } from "http-status-codes";
import { questionService } from "../services/question.service.js";

export const questionController = {
  // Thêm câu hỏi vào bài thi
  async createQuestion(req, res, next) {
    try {
      const { quizId } = req.params;
      const authorId = req.user.id;
      const question = await questionService.createQuestion(authorId, quizId, req.body);

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: question,
        message: "Thêm câu hỏi thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật câu hỏi
  async updateQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const authorId = req.user.id;
      const question = await questionService.updateQuestion(authorId, id, req.body);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: question,
        message: "Cập nhật câu hỏi thành công",
      });
    } catch (error) {
      next(error);
    }
  },

  // Xóa câu hỏi
  async deleteQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const authorId = req.user.id;
      await questionService.deleteQuestion(authorId, id);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Xóa câu hỏi thành công",
      });
    } catch (error) {
      next(error);
    }
  },
};
