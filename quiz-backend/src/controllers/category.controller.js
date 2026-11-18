import { StatusCodes } from "http-status-codes";
import { categoryService } from "../services/category.service.js";

export const categoryController = {
  async getCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      return res.status(StatusCodes.OK).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },
};
