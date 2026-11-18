import { privateApi } from "../../utils/axiosInstance";
import type { User } from "../../types/auth.interface";

export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalMajors: number;
  totalClasses: number;
  totalQuizzes: number;
  totalAttempts: number;
}

export interface StudentsResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminTeacher {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
  createdAt: string;
  major: { id: string; code: string; name: string } | null;
  _count: {
    quizzes: number;
  };
}

export interface AdminQuizItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  majorScope: string;
  timeLimit: number | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
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
}

export interface AdminQuizzesResponse {
  items: AdminQuizItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminApi = {
  async getStats(): Promise<AdminStats> {
    const { data } = await privateApi.get("/admin/stats");
    return data.data;
  },

  async getStudents(params?: {
    search?: string;
    majorId?: string;
    classId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<StudentsResponse> {
    const { data } = await privateApi.get("/admin/students", { params });
    return data.data;
  },

  async updateStudentAcademicInfo(
    studentId: string,
    payload: {
      majorId?: string;
      classId?: string | null;
      studentCode?: string;
    }
  ): Promise<User> {
    const { data } = await privateApi.patch(
      `/admin/students/${studentId}/academic-info`,
      payload
    );
    return data.data;
  },

  async updateStudentStatus(studentId: string, status: string): Promise<User> {
    const { data } = await privateApi.patch(
      `/admin/students/${studentId}/status`,
      { status }
    );
    return data.data;
  },

  async getTeachers(params?: {
    search?: string;
    majorId?: string;
  }): Promise<AdminTeacher[]> {
    const { data } = await privateApi.get("/admin/teachers", { params });
    return data.data;
  },

  async getAdminQuizzes(params?: {
    search?: string;
    majorId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminQuizzesResponse> {
    const { data } = await privateApi.get("/admin/quizzes", { params });
    return data.data;
  },

  async updateQuizStatus(quizId: string, status: string): Promise<{ id: string; status: string }> {
    const { data } = await privateApi.patch(`/admin/quizzes/${quizId}/status`, { status });
    return data.data;
  },
};
