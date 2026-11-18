import express from "express";
import { academicClassController } from "../controllers/academicClass.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const Router = express.Router();

// Tất cả các route lớp học ở đây yêu cầu đăng nhập và có quyền ADMIN
Router.use(authMiddleware.authenticationUser, authMiddleware.requireRole("ADMIN"));

Router.route("/")
  .get(academicClassController.getAdminClasses)
  .post(academicClassController.createClass);

Router.route("/bulk-delete").post(academicClassController.bulkDeleteClasses);
Router.route("/bulk-status").patch(academicClassController.bulkUpdateStatus);
Router.route("/bulk-import").post(academicClassController.bulkImportClasses);

Router.route("/:id")
  .patch(academicClassController.updateClass)
  .delete(academicClassController.deleteClass);

Router.route("/:id/students").get(academicClassController.getClassStudents);

export const academicClassRoute = Router;
