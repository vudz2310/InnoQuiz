import express from "express";
import { majorController } from "../controllers/major.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const Router = express.Router();

// Public routes (cho đăng ký sinh viên & hiển thị học phần)
Router.route("/").get(majorController.getPublicMajors);
Router.route("/:majorId/classes").get(majorController.getPublicClassesByMajor);

// Admin routes (chỉ Admin)
Router.route("/admin/all").get(
  authMiddleware.authenticationUser,
  authMiddleware.requireRole("ADMIN"),
  majorController.getAdminMajors
);

Router.route("/admin/create").post(
  authMiddleware.authenticationUser,
  authMiddleware.requireRole("ADMIN"),
  majorController.createMajor
);

Router.route("/admin/bulk-import").post(
  authMiddleware.authenticationUser,
  authMiddleware.requireRole("ADMIN"),
  majorController.bulkImportMajors
);

Router.route("/admin/:id")
  .patch(
    authMiddleware.authenticationUser,
    authMiddleware.requireRole("ADMIN"),
    majorController.updateMajor
  )
  .delete(
    authMiddleware.authenticationUser,
    authMiddleware.requireRole("ADMIN"),
    majorController.deleteMajor
  );

export const majorRoute = Router;
