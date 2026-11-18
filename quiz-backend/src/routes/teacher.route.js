import express from "express";
import { teacherController } from "../controllers/teacher.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const Router = express.Router();

// Tất cả các route trong /teacher/* yêu cầu đăng nhập và có role TEACHER
Router.use(authMiddleware.authenticationUser, authMiddleware.requireRole("TEACHER"));

Router.route("/stats").get(teacherController.getTeacherStats);
Router.route("/classes").get(teacherController.getTeacherClasses);
Router.route("/students").get(teacherController.getTeacherStudents);
Router.route("/quizzes").get(teacherController.getTeacherQuizzes);

export const teacherRoute = Router;
