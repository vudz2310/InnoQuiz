import crypto from "crypto";
import { prisma } from "../config/DB.js";
import { mailService } from "./mail.service.js";
import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

/**
 * Tạo OTP ngẫu nhiên 6 chữ số bằng Cryptographically Secure Random Generator
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hash OTP bằng SHA-256 (không lưu plaintext vào DB)
 */
const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp.toString()).digest("hex");
};

/**
 * Tạo và gửi mã xác minh OTP mới cho User
 */
const createVerificationOtp = async (userId, email, name) => {
  const now = new Date();

  // 1. Kiểm tra bản ghi OTP hiện có
  const existingRecord = await prisma.emailVerification.findUnique({
    where: { userId },
  });

  if (existingRecord) {
    const timeSinceLastOtp = (now.getTime() - new Date(existingRecord.updatedAt).getTime()) / 1000;

    // Nếu mã cũ vẫn còn hiệu lực và đang trong thời gian cooldown 60s
    if (timeSinceLastOtp < OTP_RESEND_COOLDOWN_SECONDS && new Date(existingRecord.expiresAt) > now) {
      return {
        success: true,
        alreadySent: true,
        cooldownSeconds: Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - timeSinceLastOtp),
        expiresInMinutes: OTP_EXPIRY_MINUTES,
      };
    }
  }

  // 2. Tạo mã OTP 6 số mới và hash
  const rawOtp = generateOtp();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 3. Lưu vào Database (Upsert)
  await prisma.emailVerification.upsert({
    where: { userId },
    create: {
      userId,
      otpHash: hashedOtp,
      expiresAt,
      attempts: 0,
    },
    update: {
      otpHash: hashedOtp,
      expiresAt,
      attempts: 0,
      updatedAt: now,
    },
  });

  // 4. Gửi email qua SMTP
  await mailService.sendVerificationEmail({
    to: email,
    name,
    otp: rawOtp,
  });

  return {
    success: true,
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
};

/**
 * Xác thực mã OTP từ người dùng
 */
const verifyOtp = async (email, otpInput) => {
  if (!email || !otpInput) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Email và mã OTP không được để trống!",
      [],
      "INVALID_PAYLOAD"
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otpInput.toString().trim();

  // 1. Tìm user
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: { emailVerification: true },
  });

  if (!user) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mã xác minh không đúng hoặc tài khoản không tồn tại.",
      [],
      "INVALID_OTP"
    );
  }

  if (user.emailVerified) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Tài khoản này đã được xác minh trước đó.",
      [],
      "EMAIL_ALREADY_VERIFIED"
    );
  }

  const verification = user.emailVerification;
  if (!verification) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mã xác minh đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã mới.",
      [],
      "OTP_EXPIRED"
    );
  }

  // 2. Kiểm tra hết hạn thời gian (5 phút)
  const now = new Date();
  if (now > new Date(verification.expiresAt)) {
    // Xóa OTP hết hạn
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    }).catch(() => {});

    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.",
      [],
      "OTP_EXPIRED"
    );
  }

  // 3. Kiểm tra số lần thử sai
  if (verification.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    }).catch(() => {});

    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mã xác minh đã bị vô hiệu hóa do nhập sai quá số lần cho phép. Vui lòng gửi lại mã mới.",
      [],
      "OTP_MAX_ATTEMPTS"
    );
  }

  // 4. So sánh OTP Hash
  const inputHash = hashOtp(cleanOtp);
  if (inputHash !== verification.otpHash) {
    const updatedRecord = await prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        attempts: { increment: 1 },
      },
    });

    const remainingAttempts = OTP_MAX_ATTEMPTS - updatedRecord.attempts;

    if (remainingAttempts <= 0) {
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      }).catch(() => {});

      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Mã xác minh đã bị vô hiệu hóa do nhập sai 5 lần. Vui lòng yêu cầu mã mới.",
        [],
        "OTP_MAX_ATTEMPTS"
      );
    }

    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Mã xác minh không đúng. Bạn còn ${remainingAttempts} lần thử.`,
      [],
      "INVALID_OTP"
    );
  }

  // 5. Xác minh thành công -> Cập nhật User & Xóa OTP
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    }),
    prisma.emailVerification.delete({
      where: { id: verification.id },
    }),
  ]);

  return {
    success: true,
    message: "Email đã được xác thực thành công!",
  };
};

/**
 * Gửi lại mã OTP
 */
const resendOtp = async (email) => {
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Vui lòng cung cấp email hợp lệ!",
      [],
      "INVALID_PAYLOAD"
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    // Trả về thông điệp thành công chung để bảo vệ bảo mật (tránh enumeration)
    return {
      message: "Nếu email tồn tại trong hệ thống, mã xác minh mới đã được gửi.",
    };
  }

  if (user.emailVerified) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Tài khoản này đã được xác minh trước đó. Bạn có thể đăng nhập ngay.",
      [],
      "EMAIL_ALREADY_VERIFIED"
    );
  }

  await createVerificationOtp(user.id, user.email, user.name);

  return {
    message: "Mã xác minh mới đã được gửi đến email của bạn.",
  };
};

export const otpService = {
  generateOtp,
  hashOtp,
  createVerificationOtp,
  verifyOtp,
  resendOtp,
};
