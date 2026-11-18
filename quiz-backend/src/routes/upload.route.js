import express from "express";
import { uploadController } from "../controllers/upload.controller.js";
import { imageMemoryUpload, memoryUpload } from "../middlewares/uploadMiddleware.js";
import { verifyToken, authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Clean Storage-driven Upload Routes
 */

// 1. User Avatar: POST /api/upload/avatar
router.post(
  "/avatar",
  verifyToken,
  imageMemoryUpload.single("file"),
  uploadController.uploadAvatar
);

// 2. Quiz Cover: POST /api/upload/quiz-cover/:quizId
router.post(
  "/quiz-cover/:quizId",
  verifyToken,
  imageMemoryUpload.single("file"),
  uploadController.uploadQuizCover
);

// 3. Question Image: POST /api/upload/questions/:questionId/images
router.post(
  "/questions/:questionId/images",
  verifyToken,
  imageMemoryUpload.single("file"),
  uploadController.uploadQuestionImage
);

// Answer / option image: POST /api/upload/answers/:answerId/images
router.post(
  "/answers/:answerId/images",
  verifyToken,
  imageMemoryUpload.single("file"),
  uploadController.uploadAnswerImage
);

// Delete Question Media: DELETE /api/upload/questions/media/:mediaId
router.delete(
  "/questions/media/:mediaId",
  verifyToken,
  uploadController.deleteQuestionMedia
);

// 4. Import Document (PDF/DOCX): POST /api/upload/import
router.post(
  "/import",
  verifyToken,
  memoryUpload.single("file"),
  uploadController.uploadImportDocument
);

// Legacy image uploads
router.post(
  "/image",
  authMiddleware.optionalAuth,
  imageMemoryUpload.single("file"),
  uploadController.uploadSingleImage
);

router.post(
  "/",
  authMiddleware.optionalAuth,
  imageMemoryUpload.single("file"),
  uploadController.uploadSingleImage
);

export const uploadRoute = router;
