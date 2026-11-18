import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import { storageService } from "../services/storage/storage.service.js";

// Upload User Avatar
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng chọn ảnh đại diện!");
    }
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Bạn chưa đăng nhập");
    }

    const result = await storageService.uploadUserAvatar(
      userId,
      req.file.buffer,
      req.file.mimetype
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật ảnh đại diện thành công!",
      data: result,
      avatarUrl: result.avatarUrl,
      avatarKey: result.avatarKey,
    });
  } catch (error) {
    next(error);
  }
};

// Upload Quiz Cover
const uploadQuizCover = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng chọn ảnh bìa đề thi!");
    }
    const quizId = req.params.quizId || req.body.quizId;
    if (!quizId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Thiếu ID đề thi!");
    }

    const result = await storageService.uploadQuizCover(quizId, req.file.buffer);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật ảnh bìa đề thi thành công!",
      data: result,
      coverUrl: result.coverUrl,
      coverKey: result.coverKey,
    });
  } catch (error) {
    next(error);
  }
};

// Upload Question Image
const uploadQuestionImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng chọn hình ảnh câu hỏi!");
    }
    const { questionId, quizId } = req.params;

    const result = await storageService.uploadQuestionImage(
      quizId,
      questionId,
      req.file.buffer,
      req.file.originalname
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Tải ảnh câu hỏi thành công!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Upload Answer / Option Image
const uploadAnswerImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng chọn hình ảnh đáp án!");
    }
    const { answerId, quizId } = req.params;
    const result = await storageService.uploadAnswerImage(
      quizId,
      answerId,
      req.file.buffer,
      req.file.originalname,
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Tải hình ảnh đáp án thành công!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Question Media
const deleteQuestionMedia = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    await storageService.deleteQuestionMedia(mediaId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Xóa hình ảnh câu hỏi thành công!",
    });
  } catch (error) {
    next(error);
  }
};

// Upload Import File (PDF / DOCX)
const uploadImportDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng chọn tệp PDF hoặc DOCX để import!");
    }
    const userId = req.user?.id || "system";

    const result = await storageService.uploadImportSource(
      userId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Tải lên tệp đề thi thành công!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Legacy single image upload (maps to sharp WebP if buffer exists)
const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Vui lòng chọn tệp hình ảnh để tải lên!");
    }

    if (req.file.buffer) {
      const optimized = await storageService.optimizeImage(req.file.buffer);
      const uuid = Date.now().toString();
      const storageKey = `system/temp/${uuid}.webp`;
      const url = await storageService.driver.upload(optimized.buffer, storageKey, "image/webp");

      return res.status(StatusCodes.OK).json({
        message: "Tải ảnh lên thành công!",
        url,
        relativeUrl: url,
        storageKey,
        size: optimized.size,
        mimetype: "image/webp",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${baseUrl}${relativeUrl}`;

    res.status(StatusCodes.OK).json({
      message: "Tải ảnh lên thành công!",
      url: fullUrl,
      relativeUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadController = {
  uploadAvatar,
  uploadQuizCover,
  uploadQuestionImage,
  uploadAnswerImage,
  deleteQuestionMedia,
  uploadImportDocument,
  uploadSingleImage,
};
