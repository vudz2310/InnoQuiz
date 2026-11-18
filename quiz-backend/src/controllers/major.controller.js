import { StatusCodes } from "http-status-codes";
import { majorService } from "../services/major.service.js";

const getPublicMajors = async (req, res, next) => {
  try {
    const majors = await majorService.getPublicMajors();
    res.status(StatusCodes.OK).json({
      success: true,
      data: majors,
    });
  } catch (error) {
    next(error);
  }
};

const getPublicClassesByMajor = async (req, res, next) => {
  try {
    const { majorId } = req.params;
    const classes = await majorService.getPublicClassesByMajor(majorId);
    res.status(StatusCodes.OK).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminMajors = async (req, res, next) => {
  try {
    const { search, status, allowRegistration } = req.query;
    const majors = await majorService.getAdminMajors({
      search,
      status,
      allowRegistration,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: majors,
    });
  } catch (error) {
    next(error);
  }
};

const createMajor = async (req, res, next) => {
  try {
    const newMajor = await majorService.createMajor(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Tạo ngành học mới thành công!",
      data: newMajor,
    });
  } catch (error) {
    next(error);
  }
};

const updateMajor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await majorService.updateMajor(id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật ngành học thành công!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMajor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await majorService.deleteMajor(id);
    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const bulkImportMajors = async (req, res, next) => {
  try {
    const { items, updateExisting } = req.body;
    const result = await majorService.bulkImportMajors({ items, updateExisting });
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Đã nhập dữ liệu: Tạo mới ${result.created}, Cập nhật ${result.updated}, Bỏ qua/Lỗi ${result.skipped}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const majorController = {
  getPublicMajors,
  getPublicClassesByMajor,
  getAdminMajors,
  createMajor,
  updateMajor,
  deleteMajor,
  bulkImportMajors,
};

