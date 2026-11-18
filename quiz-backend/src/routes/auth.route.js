import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import {
  registerLimiter,
  verifyEmailLimiter,
  resendOtpLimiter,
  loginLimiter,
} from '../middlewares/rateLimiter.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const Router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản người dùng mới và tự động gửi mã OTP 6 số qua email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "sinhvien@hubt.edu.vn"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "MatKhau@123"
 *     responses:
 *       201:
 *         description: Đăng ký bước đầu thành công, mã OTP đã gửi qua email
 *       400:
 *         description: Email đã tồn tại hoặc dữ liệu không hợp lệ
 *       429:
 *         description: Quá nhiều yêu cầu đăng ký (Rate limited)
 */
Router.route('/register').post(registerLimiter, authController.register);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Xác thực mã OTP 6 số nhận từ email để kích hoạt tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "sinhvien@hubt.edu.vn"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Xác thực thành công, tài khoản đã được kích hoạt
 *       400:
 *         description: Mã OTP không chính xác hoặc đã hết hạn
 */
Router.route('/verify-email').post(verifyEmailLimiter, authController.verifyEmail);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Gửi lại mã OTP mới đến email (áp dụng thời gian chờ cooldown 60 giây)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "sinhvien@hubt.edu.vn"
 *     responses:
 *       200:
 *         description: Đã gửi lại mã OTP mới qua email
 *       400:
 *         description: Email chưa đăng ký hoặc tài khoản đã kích hoạt
 *       429:
 *         description: Gửi mã quá nhanh, vui lòng chờ 60 giây
 */
Router.route('/resend-otp').post(resendOtpLimiter, authController.resendOtp);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống (chỉ cho phép khi tài khoản đã kích hoạt qua OTP)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "sinhvien@hubt.edu.vn"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "MatKhau@123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về Access Token & Refresh Token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Sai email, mật khẩu hoặc tài khoản chưa kích hoạt email
 */
Router.route('/login').post(loginLimiter, authController.login);

/**
 * @swagger
 * /auth/refresh_token:
 *   post:
 *     summary: Cấp lại Access Token mới bằng Refresh Token
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cấp lại token mới thành công
 *       401:
 *         description: Refresh Token không hợp lệ hoặc đã hết hạn
 */
Router.route('/refresh_token').post(authController.refreshToken);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin tài khoản người dùng đang đăng nhập hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin tài khoản người dùng hiện tại
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
Router.route('/me').get(authMiddleware.authenticationUser, authController.getProfile);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất và thu hồi phiên đăng nhập
 *     tags: [Auth]
 */
Router.route('/logout').post(authMiddleware.authenticationUser, authController.logout);

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Lấy danh sách các phiên đăng nhập đang hoạt động
 *     tags: [Auth]
 */
Router.route('/sessions').get(authMiddleware.authenticationUser, authController.getSessions);
Router.route('/sessions/other').delete(authMiddleware.authenticationUser, authController.revokeOtherSessions);
Router.route('/sessions/:id').delete(authMiddleware.authenticationUser, authController.revokeSession);

/**
 * @swagger
 * /auth/academic-class:
 *   patch:
 *     summary: Sinh viên tự bổ sung lớp vào hồ sơ khi chưa có lớp
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
Router.route('/academic-class').patch(authMiddleware.authenticationUser, authController.updateStudentClass);

export const authRoute = Router;


