import crypto from "crypto";
import { prisma } from "../config/DB.js";
import { extractClientIp, extractDeviceInfo } from "./security.service.js";
import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

/**
 * Hash token bằng SHA-256 để lưu an toàn vào DB
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
};

/**
 * Khởi tạo phiên đăng nhập mới cho người dùng
 */
export const createSession = async ({ userId, refreshToken, req }) => {
  try {
    const rawIp = extractClientIp(req);
    const deviceInfo = extractDeviceInfo(req);
    const tokenHash = hashToken(refreshToken);

    // Thời hạn phiên: 14 ngày
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const session = await prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: tokenHash,
        ipAddress: rawIp,
        userAgent: deviceInfo.rawUserAgent ? deviceInfo.rawUserAgent.substring(0, 500) : null,
        deviceName: deviceInfo.device,
        browserName: deviceInfo.browser,
        osName: deviceInfo.os,
        isCurrent: true,
        expiresAt,
      },
    });

    return session;
  } catch (error) {
    console.error("[SessionService] Failed to create session:", error);
    return null;
  }
};

/**
 * Lấy danh sách các phiên đăng nhập đang hoạt động của người dùng
 */
export const getUserSessions = async (userId, currentRefreshToken = null) => {
  const currentTokenHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
  const now = new Date();

  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      expiresAt: { gt: now },
    },
    orderBy: { lastActiveAt: "desc" },
  });

  return sessions.map((s) => {
    // Ẩn một phần địa chỉ IP để bảo vệ quyền riêng tư người dùng
    const ipParts = s.ipAddress.split(".");
    const maskedIp =
      ipParts.length === 4
        ? `${ipParts[0]}.${ipParts[1]}.*.*`
        : s.ipAddress.length > 8
        ? `${s.ipAddress.substring(0, 4)}...${s.ipAddress.substring(s.ipAddress.length - 3)}`
        : s.ipAddress;

    return {
      id: s.id,
      device: s.deviceName || "Thiết bị",
      browser: s.browserName || "Trình duyệt",
      os: s.osName || "Hệ điều hành",
      deviceInfo: `${s.browserName || "Trình duyệt"} trên ${s.osName || "Hệ điều hành"} (${s.deviceName || "Desktop"})`,
      ipAddress: s.ipAddress || "127.0.0.1",
      isCurrent: currentTokenHash ? s.refreshTokenHash === currentTokenHash : false,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
    };
  });
};

/**
 * Thu hồi một phiên đăng nhập cụ thể
 */
export const revokeSession = async (userId, sessionId) => {
  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
  });

  if (!session) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy phiên đăng nhập hoặc phiên đã bị thu hồi!");
  }

  await prisma.userSession.delete({
    where: { id: sessionId },
  });

  return { success: true, message: "Đã thu hồi phiên đăng nhập thành công!" };
};

/**
 * Thu hồi tất cả các phiên khác (đăng xuất khỏi các thiết bị khác)
 */
export const revokeOtherSessions = async (userId, currentRefreshToken) => {
  if (!currentRefreshToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Thiếu RefreshToken của phiên hiện tại!");
  }

  const currentTokenHash = hashToken(currentRefreshToken);

  const deleted = await prisma.userSession.deleteMany({
    where: {
      userId,
      refreshTokenHash: { not: currentTokenHash },
    },
  });

  return {
    success: true,
    message: `Đã đăng xuất khỏi ${deleted.count} thiết bị khác!`,
    revokedCount: deleted.count,
  };
};

/**
 * Thu hồi phiên khi người dùng đăng xuất (Logout)
 */
export const revokeCurrentSession = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);

  await prisma.userSession.deleteMany({
    where: { refreshTokenHash: tokenHash },
  }).catch(() => {});
};

export const sessionService = {
  createSession,
  getUserSessions,
  revokeSession,
  revokeOtherSessions,
  revokeCurrentSession,
};
