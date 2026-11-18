import express from "express";
import { profileController } from "../controllers/profile.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const Router = express.Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Lấy thông tin profile của user đang đăng nhập
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
Router.route("/").get(
  authMiddleware.authenticationUser,
  profileController.getMyProfile,
);

/**
 * @swagger
 * /profile:
 *   patch:
 *     summary: Cập nhật thông tin cá nhân (name, avatar, email)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email đã được sử dụng bởi tài khoản khác
 */
Router.route("/").patch(
  authMiddleware.authenticationUser,
  profileController.updateProfile,
);

/**
 * @swagger
 * /profile/password:
 *   patch:
 *     summary: Đổi mật khẩu (không yêu cầu nhập lại mật khẩu cũ theo quyết định hiện tại)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu mới không hợp lệ
 */
Router.route("/password").patch(
  authMiddleware.authenticationUser,
  profileController.changePassword,
);

/**
 * @swagger
 * /profile:
 *   delete:
 *     summary: Xoá tài khoản (hard delete)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xoá tài khoản thành công
 *       404:
 *         description: Tài khoản không tồn tại
 */
Router.route("/").delete(
  authMiddleware.authenticationUser,
  profileController.deleteAccount,
);

export const profileRoute = Router;