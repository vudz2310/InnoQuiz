import express from "express";
import { securityController } from "../controllers/security.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminLimiter } from "../middlewares/rateLimiter.js";

const Router = express.Router();

// Tất cả route Security đều yêu cầu quyền ADMIN và áp dụng Admin Rate Limiter
Router.use(
  authMiddleware.authenticationUser,
  authMiddleware.requireRole("ADMIN"),
  adminLimiter
);

// 1. Tổng quan số liệu bảo mật
Router.route("/overview").get(securityController.getSecurityOverview);

// 2. Nhật ký sự kiện bảo mật (Security Events)
Router.route("/events").get(securityController.getSecurityEvents);

// 3. Cảnh báo bảo mật (Security Alerts)
Router.route("/alerts").get(securityController.getSecurityAlerts);
Router.route("/alerts/:id").patch(securityController.updateSecurityAlert);

// 4. Quản lý thực thể bị chặn (IP, User ID, Student Code)
Router.route("/identifiers").get(securityController.getBlockedIdentifiers);
Router.route("/identifiers/block").post(securityController.blockIdentifier);
Router.route("/identifiers/:id/unblock").post(securityController.unblockIdentifier);

// 5. Cấu hình bảo mật hệ thống
Router.route("/settings")
  .get(securityController.getSecuritySettings)
  .patch(securityController.updateSecuritySettings);

export const securityRoute = Router;
