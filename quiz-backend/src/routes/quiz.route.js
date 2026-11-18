import express from "express";
import { quizController } from "../controllers/quiz.controller.js";
import { questionController } from "../controllers/question.controller.js";
import { verifyToken, optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /quizzes:
 *   get:
 *     summary: Lấy danh sách đề thi công khai (hỗ trợ phân trang, lọc môn học, tìm kiếm)
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng đề thi mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm theo tiêu đề hoặc mô tả đề thi
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo mã danh mục môn học
 *     responses:
 *       200:
 *         description: Danh sách đề thi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     quizzes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Quiz'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get("/", optionalAuth, quizController.getQuizzes);

/**
 * @swagger
 * /quizzes/my:
 *   get:
 *     summary: Lấy danh sách đề thi do chính người dùng hiện tại tạo (My Quizzes)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *         description: Lọc theo trạng thái đề thi
 *     responses:
 *       200:
 *         description: Lấy danh sách đề thi của tôi thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
router.get("/my", verifyToken, quizController.getMyQuizzes);

/**
 * @swagger
 * /quizzes/{id}:
 *   get:
 *     summary: Lấy chi tiết đề thi và toàn bộ câu hỏi theo ID
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của đề thi
 *     responses:
 *       200:
 *         description: Chi tiết đề thi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Quiz'
 *       404:
 *         description: Không tìm thấy đề thi
 */
router.get("/:id", optionalAuth, quizController.getQuizById);

/**
 * @swagger
 * /quizzes:
 *   post:
 *     summary: Tạo đề thi mới (trạng thái mặc định là DRAFT)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - categoryId
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Đề ôn tập Triết học Mác - Lênin"
 *               description:
 *                 type: string
 *                 example: "Đề kiểm tra giữa kỳ môn Triết học dành cho sinh viên HUBT"
 *               durationMinutes:
 *                 type: integer
 *                 example: 60
 *               passScore:
 *                 type: integer
 *                 example: 50
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: "c7f99142-3783-4a30-86ae-7a32d169bbf1"
 *     responses:
 *       201:
 *         description: Tạo đề thi thành công
 *       400:
 *         description: Thiếu dữ liệu bắt buộc
 *       401:
 *         description: Chưa đăng nhập
 */
router.post("/", verifyToken, quizController.createQuiz);

/**
 * @swagger
 * /quizzes/{id}:
 *   put:
 *     summary: Cập nhật thông tin đề thi (chỉ người tạo mới có quyền cập nhật)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               durationMinutes:
 *                 type: integer
 *               passScore:
 *                 type: integer
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ARCHIVED]
 *     responses:
 *       200:
 *         description: Cập nhật đề thi thành công
 *       403:
 *         description: Không có quyền chỉnh sửa đề thi này
 *       404:
 *         description: Không tìm thấy đề thi
 */
router.put("/:id", verifyToken, quizController.updateQuiz);

/**
 * @swagger
 * /quizzes/{id}:
 *   delete:
 *     summary: Xóa đề thi (chỉ người tạo mới có quyền xóa)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Xóa đề thi thành công
 *       403:
 *         description: Không có quyền xóa đề thi này
 *       404:
 *         description: Không tìm thấy đề thi
 */
router.delete("/:id", verifyToken, quizController.deleteQuiz);

/**
 * @swagger
 * /quizzes/{id}/publish:
 *   patch:
 *     summary: Xuất bản đề thi (chuyển trạng thái sang PUBLISHED sau khi kiểm tra đủ câu hỏi)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Xuất bản đề thi thành công
 *       400:
 *         description: Đề thi chưa đủ điều kiện xuất bản (ví dụ chưa có câu hỏi nào)
 *       403:
 *         description: Không có quyền xuất bản
 */
router.patch("/:id/publish", verifyToken, quizController.publishQuiz);

/**
 * @swagger
 * /quizzes/{quizId}/questions:
 *   post:
 *     summary: Thêm câu hỏi mới kèm danh sách đáp án vào đề thi
 *     tags: [Quizzes, Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của đề thi cần thêm câu hỏi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - answers
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Cấu trúc dữ liệu nào hoạt động theo cơ chế LIFO?"
 *               type:
 *                 type: string
 *                 enum: [MULTIPLE_CHOICE, TRUE_FALSE]
 *                 default: MULTIPLE_CHOICE
 *               points:
 *                 type: integer
 *                 default: 10
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - content
 *                     - isCorrect
 *                   properties:
 *                     content:
 *                       type: string
 *                       example: "Stack (Ngăn xếp)"
 *                     isCorrect:
 *                       type: boolean
 *                       example: true
 *                     order:
 *                       type: integer
 *                       example: 1
 *     responses:
 *       201:
 *         description: Thêm câu hỏi thành công
 *       400:
 *         description: Dữ liệu câu hỏi hoặc đáp án không hợp lệ
 */
router.post("/:quizId/questions", verifyToken, questionController.createQuestion);

// ==================== QUIZ SECTION ROUTES ====================
import { quizSectionController } from "../controllers/quizSection.controller.js";

router.post("/:quizId/sections", verifyToken, quizSectionController.createSection);
router.get("/:quizId/sections", optionalAuth, quizSectionController.getSectionsByQuizId);
router.patch("/:quizId/sections/reorder", verifyToken, quizSectionController.reorderSections);
router.patch("/:quizId/sections/:sectionId", verifyToken, quizSectionController.updateSection);
router.delete("/:quizId/sections/:sectionId", verifyToken, quizSectionController.deleteSection);
router.patch("/:quizId/sections/:sectionId/questions/reorder", verifyToken, quizSectionController.reorderQuestionsInSection);
router.patch("/questions/:questionId/move-section", verifyToken, quizSectionController.moveQuestion);

export const quizRoute = router;


