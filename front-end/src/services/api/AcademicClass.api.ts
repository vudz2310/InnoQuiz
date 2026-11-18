import { privateApi } from "../../utils/axiosInstance";
import type { AcademicClass } from "../../types/academic.interface";

export const academicClassApi = {
  async getAdminClasses(params?: {
    search?: string;
    majorId?: string;
    cohort?: string;
    status?: string;
  }): Promise<AcademicClass[]> {
    const { data } = await privateApi.get("/admin/classes", { params });
    return data.data;
  },

  async getClassStudents(id: string): Promise<AcademicClass & { students: unknown[] }> {
    const { data } = await privateApi.get(`/admin/classes/${id}/students`);
    return data.data;
  },

  async createClass(payload: Partial<AcademicClass>): Promise<AcademicClass> {
    const { data } = await privateApi.post("/admin/classes", payload);
    return data.data;
  },

  async updateClass(id: string, payload: Partial<AcademicClass>): Promise<AcademicClass> {
    const { data } = await privateApi.patch(`/admin/classes/${id}`, payload);
    return data.data;
  },

  async deleteClass(id: string): Promise<{ softDeleted: boolean; message: string }> {
    const { data } = await privateApi.delete(`/admin/classes/${id}`);
    return data;
  },

  async bulkDeleteClasses(ids: string[]): Promise<{
    total: number;
    hardDeleted: number;
    softDeactivated: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const { data } = await privateApi.post("/admin/classes/bulk-delete", { ids });
    return data.data;
  },

  async bulkUpdateStatus(payload: {
    ids?: string[];
    cohort?: string;
    status?: "ACTIVE" | "INACTIVE";
    allowRegistration?: boolean;
  }): Promise<{
    updatedCount: number;
    status?: string;
    allowRegistration?: boolean;
    target: string;
  }> {
    const { data } = await privateApi.patch("/admin/classes/bulk-status", payload);
    return data.data;
  },

  async bulkImportClasses(payload: {
    items: Array<{
      code: string;
      name: string;
      majorId?: string;
      majorCodeOrName?: string;
      cohort?: string;
      status?: "ACTIVE" | "INACTIVE";
      allowRegistration?: boolean;
    }>;
    updateExisting?: boolean;
  }): Promise<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; code: string; name: string; error: string }>;
  }> {
    const { data } = await privateApi.post("/admin/classes/bulk-import", payload);
    return data.data;
  },
};

