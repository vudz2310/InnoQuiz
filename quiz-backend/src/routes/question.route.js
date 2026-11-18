import express from "express";
import { questionController } from "../controllers/question.controller.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /questions/{id}:
 *   put:
 *     summary: Cập nhật nội dung câu hỏi và danh sách đáp án
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của câu hỏi cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Ký hiệu của Copyright là gì?"
 *               type:
 *                 type: string
 *                 enum: [MULTIPLE_CHOICE, TRUE_FALSE]
 *               points:
 *                 type: integer
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     content:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *                     order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Cập nhật câu hỏi thành công
 *       403:
 *         description: Không có quyền cập nhật câu hỏi này
 *       404:
 *         description: Không tìm thấy câu hỏi
 */
router.put("/:id", verifyToken, questionController.updateQuestion);

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     summary: Xóa câu hỏi khỏi đề thi
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của câu hỏi cần xóa
 *     responses:
 *       200:
 *         description: Xóa câu hỏi thành công
 *       403:
 *         description: Không có quyền xóa câu hỏi này
 *       404:
 *         description: Không tìm thấy câu hỏi
 */
router.delete("/:id", verifyToken, questionController.deleteQuestion);

export const questionRoute = router;

