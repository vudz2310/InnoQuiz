import express from "express";
import { categoryController } from "../controllers/category.controller.js";

const router = express.Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lấy danh sách tất cả các danh mục môn học HUBT
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Danh sách các danh mục môn học thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: "c7f99142-3783-4a30-86ae-7a32d169bbf1"
 *                   name:
 *                     type: string
 *                     example: "Công nghệ thông tin"
 *                   description:
 *                     type: string
 *                     example: "Các môn chuyên ngành CNTT trường HUBT"
 *       500:
 *         description: Lỗi máy chủ nội bộ
 */
router.get("/", categoryController.getCategories);

export const categoryRoute = router;
