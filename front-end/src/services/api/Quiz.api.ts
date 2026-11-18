import { publicApi, privateApi } from "../../utils/axiosInstance";
import type {
  Quiz,
  QuizListParams,
  QuizListResponse,
  CreateQuizPayload,
  UpdateQuizPayload,
} from "../../types/quiz.types";

export const quizApi = {
  // 1. Lấy danh sách đề thi công khai
  async getQuizzes(params: QuizListParams = {}): Promise<QuizListResponse> {
    const response = await publicApi.get("/quizzes", { params });
    return response.data?.data;
  },

  // 2. Lấy danh sách đề thi của chính user
  async getMyQuizzes(params: QuizListParams = {}): Promise<QuizListResponse> {
    const response = await privateApi.get("/quizzes/my", { params });
    return response.data?.data;
  },

  // 3. Lấy chi tiết đề thi theo ID
  async getQuizById(id: string): Promise<Quiz> {
    // Dùng privateApi để tự động gửi token nếu user đã đăng nhập (cho phép tác giả xem draft và xem isCorrect)
    const response = await privateApi.get(`/quizzes/${id}`);
    return response.data?.data;
  },

  // 4. Tạo đề thi mới
  async createQuiz(payload: CreateQuizPayload): Promise<Quiz> {
    const response = await privateApi.post("/quizzes", payload);
    return response.data?.data;
  },

  // 5. Cập nhật đề thi
  async updateQuiz(id: string, payload: UpdateQuizPayload): Promise<Quiz> {
    const response = await privateApi.put(`/quizzes/${id}`, payload);
    return response.data?.data;
  },

  // 6. Xóa đề thi
  async deleteQuiz(id: string): Promise<{ success: boolean; message: string }> {
    const response = await privateApi.delete(`/quizzes/${id}`);
    return response.data;
  },

  // 7. Xuất bản đề thi (chuyển sang PUBLISHED)
  async publishQuiz(id: string): Promise<Quiz> {
    const response = await privateApi.patch(`/quizzes/${id}/publish`);
    return response.data?.data;
  },
};
