import { privateApi } from "../../utils/axiosInstance";
import type {
  StartAttemptResponse,
  AttemptResult,
  AttemptAnswer,
  HistoryItem,
  ExamMode,
  ExamConfig,
  SaveAnswerResponse,
  WrongAnswerItem,
  LearningProgress,
} from "../../types/attempt.types";

export const attemptApi = {
  // Start session (ExamMode: PRACTICE, MOCK_EXAM, TEST, ASSIGNMENT, FLASHCARD)
  async startSession(payload: {
    quizId: string;
    mode?: ExamMode;
    config?: Partial<ExamConfig>;
    source?: string;
  }): Promise<StartAttemptResponse> {
    const response = await privateApi.post("/exam-sessions", payload);
    return response.data?.data;
  },

  // Get current active session
  async getSession(sessionId: string): Promise<StartAttemptResponse> {
    const response = await privateApi.get(`/exam-sessions/${sessionId}`);
    return response.data?.data;
  },

  // Save single answer / instant check
  async saveAnswer(
    sessionId: string,
    data: { questionId: string; answerId: string | null; selectedAnswerIds?: string[] }
  ): Promise<SaveAnswerResponse> {
    const response = await privateApi.post(`/exam-sessions/${sessionId}/answers`, data);
    return response.data?.data;
  },

  // Submit session
  async submitSession(
    sessionId: string,
    answers?: AttemptAnswer[]
  ): Promise<AttemptResult> {
    const response = await privateApi.post(`/exam-sessions/${sessionId}/submit`, { answers });
    return response.data?.data;
  },

  // Get detailed result
  async getResult(sessionId: string): Promise<AttemptResult> {
    const response = await privateApi.get(`/exam-sessions/${sessionId}/result`);
    return response.data?.data;
  },

  // Get wrong answers bank
  async getWrongAnswers(params: { quizId?: string; page?: number; limit?: number } = {}): Promise<{
    items: WrongAnswerItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await privateApi.get("/exam-sessions/wrong-answers", { params });
    return response.data?.data;
  },

  // Start Practice on Wrong Answers
  async startWrongAnswersPractice(quizId?: string): Promise<StartAttemptResponse> {
    const response = await privateApi.post("/exam-sessions/wrong-answers/practice", { quizId });
    return response.data?.data;
  },

  // Get overall learning progress & statistics
  async getLearningProgress(): Promise<LearningProgress> {
    const response = await privateApi.get("/exam-sessions/progress");
    return response.data?.data;
  },

  // History with optional mode filter
  async getHistory(params: { mode?: ExamMode; page?: number; limit?: number } = {}): Promise<{
    items: HistoryItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await privateApi.get("/exam-sessions/history", { params });
    return response.data?.data;
  },

  // Legacy wrappers for 100% backwards compatibility
  async startAttempt(quizId: string): Promise<StartAttemptResponse> {
    return this.startSession({ quizId, mode: "MOCK_EXAM" });
  },

  async submitAttempt(attemptId: string, answers: AttemptAnswer[]): Promise<AttemptResult> {
    return this.submitSession(attemptId, answers);
  },

  async getAttemptResult(attemptId: string): Promise<AttemptResult> {
    return this.getResult(attemptId);
  },
};
