import express from "express";
import { getProfile } from "../controllers/user.controller.js";
import { uploadController } from "../controllers/upload.controller.js";
import { authMiddleware, verifyToken } from "../middlewares/authMiddleware.js";
import { imageMemoryUpload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/**
 * User Profile & Avatar Endpoints
 */
router.get("/profile/:id", authMiddleware.authenticationUser, getProfile);

// Section 10: POST /api/users/me/avatar
router.post(
  "/me/avatar",
  verifyToken,
  imageMemoryUpload.single("file"),
  uploadController.uploadAvatar
);

export const userRoute = router;
export default router;