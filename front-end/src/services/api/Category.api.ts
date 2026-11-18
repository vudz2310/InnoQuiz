import { publicApi } from "../../utils/axiosInstance";
import type { Category } from "../../types/quiz.types";

export const categoryApi = {
  async getCategories(): Promise<Category[]> {
    const response = await publicApi.get("/categories");
    return response.data?.data || [];
  },
};
