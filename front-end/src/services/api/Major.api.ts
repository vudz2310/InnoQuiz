import { publicApi, privateApi } from "../../utils/axiosInstance";
import type { Major, AcademicClass } from "../../types/academic.interface";

export const majorApi = {
  // Public APIs
  async getPublicMajors(): Promise<Major[]> {
    const { data } = await publicApi.get("/majors");
    return data.data;
  },

  async getClassesByMajor(majorId: string): Promise<AcademicClass[]> {
    const { data } = await publicApi.get(`/majors/${majorId}/classes`);
    return data.data;
  },

  // Admin APIs
  async getAdminMajors(params?: {
    search?: string;
    status?: string;
    allowRegistration?: boolean;
  }): Promise<Major[]> {
    const { data } = await privateApi.get("/admin/majors", { params });
    return data.data;
  },

  async createMajor(payload: Partial<Major>): Promise<Major> {
    const { data } = await privateApi.post("/admin/majors", payload);
    return data.data;
  },

  async updateMajor(id: string, payload: Partial<Major>): Promise<Major> {
    const { data } = await privateApi.patch(`/admin/majors/${id}`, payload);
    return data.data;
  },

  async deleteMajor(id: string): Promise<{ softDeleted: boolean; message: string }> {
    const { data } = await privateApi.delete(`/admin/majors/${id}`);
    return data;
  },

  async bulkImportMajors(payload: {
    items: Array<{
      code: string;
      name: string;
      description?: string;
      status?: "ACTIVE" | "INACTIVE";
      allowRegistration?: boolean;
      displayOrder?: number;
    }>;
    updateExisting?: boolean;
  }): Promise<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; code: string; name: string; error: string }>;
  }> {
    const { data } = await privateApi.post("/admin/majors/bulk-import", payload);
    return data.data;
  },
};

