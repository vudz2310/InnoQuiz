import { StatusCodes } from "http-status-codes";
import { teacherService } from "../services/teacher.service.js";

const getTeacherStats = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const stats = await teacherService.getTeacherStats(teacherId);
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherClasses = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const classes = await teacherService.getTeacherClasses(teacherId);
    res.status(StatusCodes.OK).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherStudents = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { search, classId, page, limit } = req.query;
    const result = await teacherService.getTeacherStudents(teacherId, {
      search,
      classId,
      page,
      limit,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherQuizzes = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { search, status, page, limit } = req.query;
    const result = await teacherService.getTeacherQuizzes(teacherId, {
      search,
      status,
      page,
      limit,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const teacherController = {
  getTeacherStats,
  getTeacherClasses,
  getTeacherStudents,
  getTeacherQuizzes,
};
