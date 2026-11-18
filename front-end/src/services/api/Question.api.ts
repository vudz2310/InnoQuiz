import { privateApi } from "../../utils/axiosInstance";
import type { Question, QuestionDraft } from "../../types/quiz.types";

export const questionApi = {
  // Thêm câu hỏi vào đề thi
  async createQuestion(quizId: string, payload: QuestionDraft): Promise<Question> {
    const response = await privateApi.post(`/quizzes/${quizId}/questions`, payload);
    return response.data?.data;
  },

  // Cập nhật câu hỏi
  async updateQuestion(id: string, payload: Partial<QuestionDraft>): Promise<Question> {
    const response = await privateApi.put(`/questions/${id}`, payload);
    return response.data?.data;
  },

  // Xóa câu hỏi
  async deleteQuestion(id: string): Promise<{ success: boolean; message: string }> {
    const response = await privateApi.delete(`/questions/${id}`);
    return response.data;
  },
};
