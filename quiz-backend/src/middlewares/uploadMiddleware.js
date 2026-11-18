import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

// Đảm bảo thư mục uploads tồn tại (legacy)
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình lưu trữ file trên ổ đĩa (legacy)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    cb(null, `file-${uniqueSuffix}${ext}`);
  },
});

// Bộ lọc định dạng file ảnh
const imageFileFilter = (_req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/jpg",
    "image/svg+xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        "Chỉ chấp nhận các tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP, GIF)!"
      ),
      false
    );
  }
};

// Memory Storage (Khuyên dùng cho StorageService + Sharp WebP)
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

export const imageMemoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

// Legacy disk upload
export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});
