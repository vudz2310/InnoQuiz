import { StatusCodes } from "http-status-codes";
import { academicClassService } from "../services/academicClass.service.js";

const getAdminClasses = async (req, res, next) => {
  try {
    const { search, majorId, cohort, status } = req.query;
    const classes = await academicClassService.getAdminClasses({
      search,
      majorId,
      cohort,
      status,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

const getClassStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classDetail = await academicClassService.getClassStudents(id);
    res.status(StatusCodes.OK).json({
      success: true,
      data: classDetail,
    });
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const newClass = await academicClassService.createClass(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Tạo lớp học mới thành công!",
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await academicClassService.updateClass(id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật thông tin lớp học thành công!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await academicClassService.deleteClass(id);
    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const bulkDeleteClasses = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const result = await academicClassService.bulkDeleteClasses(ids);
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Đã xóa ${result.hardDeleted} lớp và chuyển ngừng hoạt động ${result.softDeactivated} lớp đã có sinh viên`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, cohort, status, allowRegistration } = req.body;
    const result = await academicClassService.bulkUpdateStatus({
      ids,
      cohort,
      status,
      allowRegistration,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Đã cập nhật trạng thái cho ${result.updatedCount} lớp (${result.target})`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const bulkImportClasses = async (req, res, next) => {
  try {
    const { items, updateExisting } = req.body;
    const result = await academicClassService.bulkImportClasses({ items, updateExisting });
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Đã nhập dữ liệu: Tạo mới ${result.created}, Cập nhật ${result.updated}, Bỏ qua/Lỗi ${result.skipped}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const academicClassController = {
  getAdminClasses,
  getClassStudents,
  createClass,
  updateClass,
  deleteClass,
  bulkDeleteClasses,
  bulkUpdateStatus,
  bulkImportClasses,
};

