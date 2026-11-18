import { privateApi } from "../../utils/axiosInstance";
import type { Question } from "../../types/quiz.types";
import type { QuizSection } from "../../types/quiz-section.types";

export const quizSectionApi = {
  createSection: async (
    quizId: string,
    data: { title: string; description?: string; order?: number }
  ): Promise<QuizSection> => {
    const res = await privateApi.post(`/quizzes/${quizId}/sections`, data);
    return res.data.data;
  },

  getSectionsByQuizId: async (quizId: string): Promise<QuizSection[]> => {
    const res = await privateApi.get(`/quizzes/${quizId}/sections`);
    return res.data.data;
  },

  updateSection: async (
    sectionId: string,
    data: { title?: string; description?: string; order?: number }
  ): Promise<QuizSection> => {
    const res = await privateApi.patch(`/quizzes/sections/${sectionId}`, data);
    return res.data.data;
  },

  deleteSection: async (sectionId: string): Promise<{ success: boolean; message: string }> => {
    const res = await privateApi.delete(`/quizzes/sections/${sectionId}`);
    return res.data;
  },

  reorderSections: async (
    quizId: string,
    sections: { id: string; order: number }[]
  ): Promise<QuizSection[]> => {
    const res = await privateApi.patch(`/quizzes/${quizId}/sections/reorder`, { sections });
    return res.data.data;
  },

  reorderQuestions: async (
    sectionId: string,
    questions: { id: string; order: number }[]
  ): Promise<QuizSection> => {
    const res = await privateApi.patch(`/quizzes/sections/${sectionId}/questions/reorder`, { questions });
    return res.data.data;
  },

  moveQuestion: async (
    questionId: string,
    targetSectionId: string | null,
    order?: number
  ): Promise<Question> => {
    const res = await privateApi.patch(`/quizzes/questions/${questionId}/move-section`, {
      targetSectionId,
      order,
    });
    return res.data.data;
  },
};
