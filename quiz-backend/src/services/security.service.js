import crypto from "crypto";
import { prisma } from "../config/DB.js";
import { env } from "../utils/constants.js";
import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

const HMAC_SECRET = env.SECRETKEY_ACCESSTOKEN || "inno_quiz_security_hmac_secret";

/**
 * Tạo mã Hash IP (Pseudonymization) bằng HMAC-SHA256 để bảo vệ quyền riêng tư người dùng
 */
export const hashIp = (ip) => {
  if (!ip) return "unknown";
  return crypto.createHmac("sha256", HMAC_SECRET).update(String(ip).trim()).digest("hex");
};

/**
 * Trích xuất IP an toàn từ Request (hỗ trợ proxy nếu cấu hình)
 */
export const extractClientIp = (req) => {
  if (!req) return "127.0.0.1";

  let ip = "127.0.0.1";
  const forwardedFor = req.headers?.["x-forwarded-for"];
  if (forwardedFor) {
    const ips = String(forwardedFor).split(",").map((item) => item.trim());
    if (ips.length > 0 && ips[0]) {
      ip = ips[0];
    }
  } else {
    ip =
      req.ip ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      "127.0.0.1";
  }

  // Chuẩn hóa IPv6 localhost và IPv4-mapped IPv6
  if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");

  return ip;
};

/**
 * Phân tích User-Agent để lấy thông tin Thiết bị, Trình duyệt, Hệ điều hành
 */
export const extractDeviceInfo = (req) => {
  const ua = req?.headers?.["user-agent"] || "";
  let browser = "Khác";
  let os = "Khác";
  let device = "Desktop";

  if (/mobile/i.test(ua)) device = "Mobile";
  else if (/tablet|ipad/i.test(ua)) device = "Tablet";

  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/opera|opr/i.test(ua)) browser = "Opera";

  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return {
    rawUserAgent: ua,
    browser,
    os,
    device,
    summary: `${browser} trên ${os} (${device})`,
  };
};

/**
 * Loại bỏ các thông tin nhạy cảm (token, password, OTP) trước khi lưu vào nhật ký
 */
export const sanitizeSecurityDetails = (details) => {
  if (!details || typeof details !== "object") return details;
  const sanitized = { ...details };
  const sensitiveKeys = [
    "password",
    "pass",
    "token",
    "accessToken",
    "refreshToken",
    "otp",
    "otpHash",
    "authorization",
    "cookie",
  ];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeSecurityDetails(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Ghi nhận sự kiện bảo mật (Security Event)
 */
export const recordSecurityEvent = async ({
  req,
  userId,
  userEmail,
  eventType,
  riskLevel = "LOW",
  riskScore = 0,
  details = null,
  httpStatus = 200,
}) => {
  try {
    const rawIp = extractClientIp(req);
    const ipHashed = hashIp(rawIp);
    const deviceInfo = extractDeviceInfo(req);
    const endpoint = req?.originalUrl || req?.url || null;
    const httpMethod = req?.method || null;
    const cleanDetails = sanitizeSecurityDetails(details);

    const event = await prisma.securityEvent.create({
      data: {
        userId: userId || null,
        userEmail: userEmail || null,
        eventType,
        ipAddress: rawIp,
        ipHash: ipHashed,
        userAgent: deviceInfo.rawUserAgent ? deviceInfo.rawUserAgent.substring(0, 500) : null,
        deviceInfo: deviceInfo.summary,
        endpoint,
        httpMethod,
        httpStatus,
        riskLevel,
        riskScore,
        details: cleanDetails,
      },
    });

    // Kích hoạt tự động phân tích phát hiện bất thường nếu nguy cơ cao
    if (riskScore >= 60 || riskLevel === "HIGH" || riskLevel === "CRITICAL") {
      await checkForAnomaliesAndAlert({
        eventType,
        rawIp,
        userId,
        userEmail,
        endpoint,
        riskScore,
        deviceInfo: deviceInfo.summary,
      }).catch((err) => console.error("[Security] Anomaly detection error:", err));
    }

    return event;
  } catch (error) {
    // Không làm sập luồng chính nếu lưu log bảo mật lỗi
    console.error("[SecurityEvent] Failed to record security event:", error?.message || error);
    return null;
  }
};

/**
 * Kiểm tra xem IP hoặc Người dùng có đang trong danh sách bị chặn (BlockedIdentifier) không
 */
export const checkBlockedIdentifier = async ({ ip, userId, studentCode }) => {
  const now = new Date();

  const conditions = [];
  if (ip) {
    conditions.push({ type: "IP", value: ip });
  }
  if (userId) {
    conditions.push({ type: "USER", value: userId });
  }
  if (studentCode) {
    conditions.push({ type: "STUDENT_CODE", value: studentCode });
  }

  if (conditions.length === 0) return null;

  const blocked = await prisma.blockedIdentifier.findFirst({
    where: {
      isActive: true,
      OR: conditions,
      AND: [
        {
          OR: [
            { blockedUntil: null },
            { blockedUntil: { gt: now } },
          ],
        },
      ],
    },
  });

  return blocked;
};

/**
 * Tự động phát hiện bất thường và tạo SecurityAlert
 */
export const checkForAnomaliesAndAlert = async ({
  eventType,
  rawIp,
  userId,
  userEmail,
  endpoint,
  riskScore,
  deviceInfo,
}) => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  // 1. Phát hiện đợt đăng nhập thất bại liên tiếp (Failed Logins Spike)
  if (eventType === "LOGIN_FAILED") {
    const recentFails = await prisma.securityEvent.count({
      where: {
        eventType: "LOGIN_FAILED",
        ipAddress: rawIp,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentFails >= 5) {
      const existingAlert = await prisma.securityAlert.findFirst({
        where: {
          type: "FAILED_LOGINS_SPIKE",
          ipAddress: rawIp,
          status: "NEW",
          createdAt: { gte: tenMinutesAgo },
        },
      });

      if (!existingAlert) {
        await prisma.securityAlert.create({
          data: {
            type: "FAILED_LOGINS_SPIKE",
            title: `Phát hiện ${recentFails} lần đăng nhập sai từ IP ${rawIp}`,
            description: `Hệ thống ghi nhận ${recentFails} yêu cầu đăng nhập không thành công trong vòng 10 phút từ địa chỉ IP ${rawIp}. Thiết bị: ${deviceInfo || "Không xác định"}.`,
            severity: recentFails >= 10 ? "CRITICAL" : "HIGH",
            status: "NEW",
            ipAddress: rawIp,
            userId: userId || null,
            metadata: {
              recentFailsCount: recentFails,
              lastAttemptAt: new Date(),
              userEmail: userEmail || null,
            },
          },
        });
      }
    }
  }

  // 2. Phát hiện hành vi cào dữ liệu (Scraping / Crawling Behavior)
  if (eventType === "SUSPICIOUS_SCRAPING_DETECTED" || riskScore >= 75) {
    const existingAlert = await prisma.securityAlert.findFirst({
      where: {
        type: "SCRAPING_BEHAVIOR",
        ipAddress: rawIp,
        status: "NEW",
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (!existingAlert) {
      await prisma.securityAlert.create({
        data: {
          type: "SCRAPING_BEHAVIOR",
          title: `Cảnh báo hành vi cào dữ liệu từ ${userEmail || rawIp}`,
          description: `Phát hiện tần suất truy vấn bất thường hoặc phân trang liên tục vào tài nguyên ${endpoint || "API"}. Điểm rủi ro: ${riskScore}/100.`,
          severity: riskScore >= 85 ? "CRITICAL" : "HIGH",
          status: "NEW",
          ipAddress: rawIp,
          userId: userId || null,
          metadata: {
            endpoint,
            riskScore,
            deviceInfo,
            userEmail,
          },
        },
      });
    }
  }
};

/**
 * Ghi nhận Audit Log cho hành động của Admin
 */
export const recordAdminAuditLog = async ({
  req,
  adminId,
  adminEmail,
  action,
  targetType = null,
  targetId = null,
  details = null,
}) => {
  try {
    const ipAddress = extractClientIp(req);
    const userAgent = req?.headers?.["user-agent"] || "";

    return await prisma.adminAuditLog.create({
      data: {
        adminId,
        adminEmail,
        action,
        targetType,
        targetId,
        details: sanitizeSecurityDetails(details),
        ipAddress,
        userAgent: userAgent ? userAgent.substring(0, 500) : "",
      },
    });
  } catch (error) {
    console.error("[AdminAuditLog] Failed to record admin audit log:", error);
    return null;
  }
};

/**
 * Dịch vụ Quản trị: Lấy thống kê tổng quan (Security Overview)
 */
export const getSecurityOverview = async (timeRange = "7d") => {
  let fromDate = new Date();
  if (timeRange === "24h" || timeRange === "today") {
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeRange === "30d") {
    fromDate.setDate(fromDate.getDate() - 30);
  } else {
    // Mặc định 7 ngày
    fromDate.setDate(fromDate.getDate() - 7);
  }

  const [
    totalLogins,
    failedLogins,
    newRegistrations,
    otpsSent,
    rateLimitEvents,
    activeAlertsCount,
    blockedCount,
    activeSessionsCount,
    recentEvents,
    recentAlerts,
  ] = await Promise.all([
    prisma.securityEvent.count({
      where: { eventType: "LOGIN_SUCCESS", createdAt: { gte: fromDate } },
    }),
    prisma.securityEvent.count({
      where: { eventType: "LOGIN_FAILED", createdAt: { gte: fromDate } },
    }),
    prisma.securityEvent.count({
      where: { eventType: "REGISTER", createdAt: { gte: fromDate } },
    }),
    prisma.securityEvent.count({
      where: { eventType: "OTP_SENT", createdAt: { gte: fromDate } },
    }),
    prisma.securityEvent.count({
      where: { eventType: "RATE_LIMIT_EXCEEDED", createdAt: { gte: fromDate } },
    }),
    prisma.securityAlert.count({
      where: { status: "NEW" },
    }),
    prisma.blockedIdentifier.count({
      where: { isActive: true },
    }),
    prisma.userSession.count({
      where: { expiresAt: { gt: new Date() } },
    }),
    prisma.securityEvent.findMany({
      where: { createdAt: { gte: fromDate } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, studentCode: true },
        },
      },
    }),
    prisma.securityAlert.findMany({
      where: { status: { in: ["NEW", "ACKNOWLEDGED"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  // Thống kê phân bố theo mức độ rủi ro (Risk Distribution)
  const riskStats = await prisma.securityEvent.groupBy({
    by: ["riskLevel"],
    where: { createdAt: { gte: fromDate } },
    _count: true,
  });

  return {
    timeRange,
    stats: {
      totalLogins,
      failedLogins,
      newRegistrations,
      otpsSent,
      rateLimitEvents,
      activeAlertsCount,
      blockedCount,
      activeSessionsCount,
      loginSuccessRate:
        totalLogins + failedLogins > 0
          ? Math.round((totalLogins / (totalLogins + failedLogins)) * 100)
          : 100,
    },
    riskDistribution: riskStats.map((r) => ({
      level: r.riskLevel,
      count: r._count,
    })),
    recentEvents,
    recentAlerts,
  };
};

/**
 * Dịch vụ Quản trị: Lấy danh sách Nhật ký bảo mật (Security Events) có phân trang & lọc
 */
export const getSecurityEvents = async ({
  page = 1,
  limit = 20,
  search = "",
  eventType = "",
  riskLevel = "",
  fromDate = null,
  toDate = null,
}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (eventType) {
    where.eventType = eventType;
  }

  if (riskLevel) {
    where.riskLevel = riskLevel;
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { ipAddress: { contains: s, mode: "insensitive" } },
      { userEmail: { contains: s, mode: "insensitive" } },
      { endpoint: { contains: s, mode: "insensitive" } },
      { user: { name: { contains: s, mode: "insensitive" } } },
      { user: { studentCode: { contains: s, mode: "insensitive" } } },
    ];
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  const [items, total] = await Promise.all([
    prisma.securityEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, studentCode: true },
        },
      },
    }),
    prisma.securityEvent.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Dịch vụ Quản trị: Lấy danh sách Cảnh báo bảo mật (Security Alerts)
 */
export const getSecurityAlerts = async ({
  page = 1,
  limit = 20,
  status = "",
  severity = "",
}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (status) {
    where.status = status;
  }
  if (severity) {
    where.severity = severity;
  }

  const [items, total] = await Promise.all([
    prisma.securityAlert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.securityAlert.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Dịch vụ Quản trị: Cập nhật trạng thái Cảnh báo bảo mật
 */
export const updateSecurityAlert = async (
  alertId,
  { status, resolutionNote },
  adminUser
) => {
  const existing = await prisma.securityAlert.findUnique({
    where: { id: alertId },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy cảnh báo bảo mật!");
  }

  const updated = await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      status,
      resolutionNote: resolutionNote || existing.resolutionNote,
      resolvedBy: adminUser.email || adminUser.id,
      resolvedAt: status === "RESOLVED" || status === "FALSE_POSITIVE" ? new Date() : existing.resolvedAt,
    },
  });

  return updated;
};

/**
 * Dịch vụ Quản trị: Lấy danh sách IP / Tài khoản bị chặn
 */
export const getBlockedIdentifiers = async ({ page = 1, limit = 20, search = "", type = "" }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (type) {
    where.type = type;
  }

  if (search && search.trim()) {
    where.OR = [
      { value: { contains: search.trim(), mode: "insensitive" } },
      { reason: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.BlockedIdentifier.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.BlockedIdentifier.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Dịch vụ Quản trị: Thêm thực thể bị chặn (IP, User ID, Student Code)
 */
export const blockIdentifier = async ({
  type,
  value,
  reason,
  riskScore = 100,
  blockedUntil = null,
  notes = null,
  adminUser,
}) => {
  if (!type || !value || !reason) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Thiếu thông tin loại, giá trị hoặc lý do chặn!");
  }

  const cleanVal = String(value).trim();

  const newBlock = await prisma.blockedIdentifier.create({
    data: {
      type,
      value: cleanVal,
      reason: reason.trim(),
      riskScore: Number(riskScore) || 100,
      blockedUntil: blockedUntil ? new Date(blockedUntil) : null,
      blockedBy: adminUser.email || adminUser.name || adminUser.id,
      isActive: true,
      notes: notes ? String(notes).trim() : null,
    },
  });

  return newBlock;
};

/**
 * Dịch vụ Quản trị: Gỡ chặn thực thể
 */
export const unblockIdentifier = async (id, { adminUser, reason }) => {
  const existing = await prisma.blockedIdentifier.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy bản ghi chặn!");
  }

  const unblocked = await prisma.blockedIdentifier.update({
    where: { id },
    data: {
      isActive: false,
      notes: reason
        ? `${existing.notes || ""}\n[Mở khóa bởi ${adminUser.email} lúc ${new Date().toISOString()}]: ${reason}`
        : existing.notes,
    },
  });

  return unblocked;
};

/**
 * Dịch vụ Quản trị: Lấy cấu hình tham số bảo mật hệ thống
 */
export const getSecuritySettings = async () => {
  const settings = await prisma.securitySetting.findMany({
    orderBy: { category: "asc" },
  });

  // Default fallback values if DB is empty
  const defaults = {
    AUTH_MAX_LOGIN_ATTEMPTS: "5",
    AUTH_LOCK_TIME_MINUTES: "15",
    OTP_EXPIRY_MINUTES: "5",
    OTP_RESEND_COOLDOWN_SECONDS: "60",
    RATE_LIMIT_READ_MAX_RPM: "120",
    RATE_LIMIT_WRITE_MAX_RPM: "60",
    RATE_LIMIT_SEARCH_MAX_RPM: "40",
    SECURITY_LOG_RETENTION_DAYS: "90",
    AUTO_ALERT_FAILED_LOGINS_THRESHOLD: "5",
    AUTO_ALERT_SCRAPING_RISK_THRESHOLD: "75",
  };

  const map = { ...defaults };
  settings.forEach((s) => {
    map[s.key] = s.value;
  });

  return map;
};

/**
 * Dịch vụ Quản trị: Cập nhật cấu hình bảo mật
 */
export const updateSecuritySettings = async (settingsObject, adminUser) => {
  const entries = Object.entries(settingsObject);

  for (const [key, val] of entries) {
    await prisma.securitySetting.upsert({
      where: { key },
      create: {
        key,
        value: String(val),
        category: key.startsWith("AUTH")
          ? "AUTH"
          : key.startsWith("RATE_LIMIT")
          ? "RATE_LIMIT"
          : key.startsWith("AUTO_ALERT")
          ? "ALERTS"
          : "GENERAL",
        updatedBy: adminUser.email || adminUser.id,
      },
      update: {
        value: String(val),
        updatedBy: adminUser.email || adminUser.id,
      },
    });
  }

  return await getSecuritySettings();
};

export const securityService = {
  hashIp,
  extractClientIp,
  extractDeviceInfo,
  sanitizeSecurityDetails,
  recordSecurityEvent,
  checkBlockedIdentifier,
  checkForAnomaliesAndAlert,
  recordAdminAuditLog,
  getSecurityOverview,
  getSecurityEvents,
  getSecurityAlerts,
  updateSecurityAlert,
  getBlockedIdentifiers,
  blockIdentifier,
  unblockIdentifier,
  getSecuritySettings,
  updateSecuritySettings,
};
