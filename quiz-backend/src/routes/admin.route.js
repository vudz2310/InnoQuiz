import express from "express";
import { adminController } from "../controllers/admin.controller.js";
import { majorController } from "../controllers/major.controller.js";
import { academicClassController } from "../controllers/academicClass.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const Router = express.Router();

// Tất cả route /admin/* đều yêu cầu JWT hợp lệ và role ADMIN
Router.use(authMiddleware.authenticationUser, authMiddleware.requireRole("ADMIN"));

// Thống kê tổng quan
Router.route("/stats").get(adminController.getAdminStats);

// Quản lý Ngành (Admin)
Router.route("/majors")
  .get(majorController.getAdminMajors)
  .post(majorController.createMajor);

Router.route("/majors/bulk-import").post(majorController.bulkImportMajors);

Router.route("/majors/:id")
  .put(majorController.updateMajor)
  .patch(majorController.updateMajor)
  .delete(majorController.deleteMajor);

// Quản lý Lớp (Admin)
Router.route("/classes")
  .get(academicClassController.getAdminClasses)
  .post(academicClassController.createClass);

Router.route("/classes/bulk-delete").post(academicClassController.bulkDeleteClasses);
Router.route("/classes/bulk-status").patch(academicClassController.bulkUpdateStatus);
Router.route("/classes/bulk-import").post(academicClassController.bulkImportClasses);

Router.route("/classes/:id")
  .put(academicClassController.updateClass)
  .patch(academicClassController.updateClass)
  .delete(academicClassController.deleteClass);

Router.route("/classes/:id/students").get(academicClassController.getClassStudents);

// Quản lý Sinh viên (Admin)
Router.route("/students").get(adminController.getStudents);
Router.route("/students/:id/academic-info").patch(adminController.updateStudentAcademicInfo);
Router.route("/students/:id/status").patch(adminController.updateStudentStatus);

// Quản lý Giảng viên (Admin)
Router.route("/teachers").get(adminController.getTeachers);

// Quản lý Đề thi toàn hệ thống (Admin)
Router.route("/quizzes").get(adminController.getAdminQuizzes);
Router.route("/quizzes/:id/status").patch(adminController.updateAdminQuizStatus);

export const adminRoute = Router;
