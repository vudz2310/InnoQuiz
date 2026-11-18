import { prisma } from "../config/DB.js";

export const categoryService = {
  /**
   * Lấy toàn bộ danh sách Category
   */
  async getAllCategories() {
    return await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },
};
