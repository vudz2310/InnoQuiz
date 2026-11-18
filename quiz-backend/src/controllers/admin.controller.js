import { StatusCodes } from "http-status-codes";
import { adminService } from "../services/admin.service.js";

const getStudents = async (req, res, next) => {
  try {
    const { search, majorId, classId, status, page, limit } = req.query;
    const result = await adminService.getStudents({
      search,
      majorId,
      classId,
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

const updateStudentAcademicInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await adminService.updateStudentAcademicInfo(id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật thông tin học tập của sinh viên thành công!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const updateStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await adminService.updateStudentStatus(id, status);
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Cập nhật trạng thái tài khoản thành ${updated.status} thành công!`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const stats = await adminService.getAdminStats();
    res.status(StatusCodes.OK).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getTeachers = async (req, res, next) => {
  try {
    const { search, majorId } = req.query;
    const teachers = await adminService.getTeachers({ search, majorId });
    res.status(StatusCodes.OK).json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminQuizzes = async (req, res, next) => {
  try {
    const { search, majorId, status, page, limit } = req.query;
    const result = await adminService.getAdminQuizzes({
      search,
      majorId,
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

const updateAdminQuizStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await adminService.updateAdminQuizStatus(id, status);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật trạng thái đề thi thành công!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const adminController = {
  getStudents,
  updateStudentAcademicInfo,
  updateStudentStatus,
  getAdminStats,
  getTeachers,
  getAdminQuizzes,
  updateAdminQuizStatus,
};
