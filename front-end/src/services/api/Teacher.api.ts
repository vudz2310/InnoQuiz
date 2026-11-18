import { privateApi } from "../../utils/axiosInstance";

export interface TeacherStats {
  totalQuizzes: number;
  totalAttempts: number;
  totalClasses: number;
  totalStudents: number;
  recentQuizzes: Array<{
    id: string;
    title: string;
    status: string;
    majorScope: string;
    timeLimit: number | null;
    createdAt: string;
    _count: {
      questions: number;
      attempts: number;
    };
    quizMajors: Array<{
      major: {
        id: string;
        code: string;
        name: string;
      };
    }>;
  }>;
  recentAttempts: Array<{
    id: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    duration: number | null;
    status: string;
    finishedAt: string | null;
    createdAt: string;
    user: {
      id: string;
      name: string;
      studentCode: string | null;
      academicClass: {
        code: string;
        name: string;
      } | null;
    };
    quiz: {
      id: string;
      title: string;
    };
  }>;
}

export interface TeacherClass {
  id: string;
  code: string;
  name: string;
  cohort: string | null;
  status: string;
  major: {
    id: string;
    code: string;
    name: string;
  };
  _count: {
    students: number;
  };
}

export interface TeacherStudentsResponse {
  items: Array<{
    id: string;
    name: string;
    email: string;
    studentCode: string | null;
    status: string;
    avatar: string;
    major: { id: string; code: string; name: string } | null;
    academicClass: { id: string; code: string; name: string; cohort: string | null } | null;
    _count: {
      attempts: number;
    };
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TeacherQuizzesResponse {
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    majorScope: string;
    timeLimit: number | null;
    createdAt: string;
    updatedAt: string;
    _count: {
      questions: number;
      attempts: number;
    };
    quizMajors: Array<{
      major: {
        id: string;
        code: string;
        name: string;
      };
    }>;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const teacherApi = {
  async getStats(): Promise<TeacherStats> {
    const { data } = await privateApi.get("/teacher/stats");
    return data.data;
  },

  async getClasses(): Promise<TeacherClass[]> {
    const { data } = await privateApi.get("/teacher/classes");
    return data.data;
  },

  async getStudents(params?: {
    search?: string;
    classId?: string;
    page?: number;
    limit?: number;
  }): Promise<TeacherStudentsResponse> {
    const { data } = await privateApi.get("/teacher/students", { params });
    return data.data;
  },

  async getQuizzes(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<TeacherQuizzesResponse> {
    const { data } = await privateApi.get("/teacher/quizzes", { params });
    return data.data;
  },
};
