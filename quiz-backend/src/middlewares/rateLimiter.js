import rateLimit from "express-rate-limit";
import {
  extractClientIp,
  checkBlockedIdentifier,
  recordSecurityEvent,
} from "../services/security.service.js";

const isDev =
  process.env.BUILD_MODE === "development" ||
  process.env.NODE_ENV === "development";

/**
 * 1. Middleware kiểm tra thực thể bị chặn (IP, User ID)
 */
export const securityCheckMiddleware = async (req, res, next) => {
  try {
    const rawIp = extractClientIp(req);
    const userId = req.jwtDecoded?.id || req.user?.id || null;

    const blocked = await checkBlockedIdentifier({
      ip: rawIp,
      userId,
    });

    if (blocked) {
      // Ghi nhận sự kiện truy cập từ IP / User bị chặn
      recordSecurityEvent({
        req,
        userId,
        eventType: "ACCESS_DENIED",
        riskLevel: "CRITICAL",
        riskScore: 95,
        httpStatus: 403,
        details: {
          blockedType: blocked.type,
          blockedReason: blocked.reason,
          blockedUntil: blocked.blockedUntil,
        },
      });

      return res.status(403).json({
        statusCode: 403,
        error: "ACCESS_DENIED",
        message: `Truy cập bị từ chối do vi phạm quy định bảo mật HUBT: ${blocked.reason}. Vui lòng liên hệ Ban Quản trị!`,
        blockedUntil: blocked.blockedUntil,
      });
    }

    next();
  } catch (err) {
    next();
  }
};

/**
 * 2. Bộ đệm theo dõi hành vi cào dữ liệu (In-Memory Scraping Tracker)
 */
const requestMetricsMap = new Map();

// Dọn dẹp metric mỗi 10 phút
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of requestMetricsMap.entries()) {
    if (now - val.lastReset > 10 * 60 * 1000) {
      requestMetricsMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const antiScrapingMiddleware = (req, res, next) => {
  const rawIp = extractClientIp(req);
  const userId = req.jwtDecoded?.id || req.user?.id || "anonymous";
  const key = `${rawIp}_${userId}`;
  const now = Date.now();

  let metric = requestMetricsMap.get(key);
  if (!metric || now - metric.windowStart > 60 * 1000) {
    metric = {
      windowStart: now,
      lastReset: now,
      requestCount: 1,
      paginationQueries: 0,
      searchQueries: 0,
    };
    requestMetricsMap.set(key, metric);
  } else {
    metric.requestCount++;
    if (req.query?.page || req.query?.limit) metric.paginationQueries++;
    if (req.query?.search || req.query?.q) metric.searchQueries++;
  }

  // Ngưỡng nghi vấn cào dữ liệu: > 100 req/phút hoặc > 30 query phân trang liên tiếp/phút
  const isScrapingSuspected =
    metric.requestCount > (isDev ? 2000 : 120) ||
    metric.paginationQueries > (isDev ? 500 : 35);

  if (isScrapingSuspected) {
    recordSecurityEvent({
      req,
      userId: userId !== "anonymous" ? userId : null,
      eventType: "SUSPICIOUS_SCRAPING_DETECTED",
      riskLevel: "HIGH",
      riskScore: 80,
      httpStatus: 429,
      details: {
        requestCountInMinute: metric.requestCount,
        paginationQueries: metric.paginationQueries,
        searchQueries: metric.searchQueries,
      },
    });

    return res.status(429).json({
      statusCode: 429,
      error: "SUSPICIOUS_ACTIVITY_DETECTED",
      message:
        "Hệ thống phát hiện tần suất truy xuất dữ liệu bất thường. Vui lòng giảm tốc độ truy vấn để bảo vệ tài nguyên trường!",
    });
  }

  next();
};

/**
 * 3. Rate Limiters theo từng nhóm API
 */

// Đăng ký tài khoản
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Bạn đã tạo quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau 15 phút!",
  },
});

// Gửi lại OTP
export const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    code: "OTP_RATE_LIMITED",
    message: "Bạn đã yêu cầu gửi lại OTP quá nhiều lần. Vui lòng thử lại sau 15 phút!",
  },
});

// Xác thực OTP
export const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Bạn đã gửi quá nhiều yêu cầu xác minh. Vui lòng thử lại sau ít phút!",
  },
});

// Đăng nhập
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Đã có quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút để bảo vệ tài khoản!",
  },
});

// API Đọc dữ liệu công khai (Quizzes, Subjects, Categories)
export const apiReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 2000 : 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Bạn đang gửi quá nhiều yêu cầu xem dữ liệu. Vui lòng thử lại sau giây lát!",
  },
});

// API Ghi dữ liệu / Mutation (Nộp bài, lưu nháp, tạo đề, cập nhật hồ sơ)
export const apiWriteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 2000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Bạn đang thao tác quá nhanh. Vui lòng đợi trong giây lát!",
  },
});

// API Upload file
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDev ? 500 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    code: "UPLOAD_RATE_LIMITED",
    message: "Bạn đã tải lên quá nhiều tệp trong thời gian ngắn. Vui lòng thử lại sau 5 phút!",
  },
});

// API Admin
export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 3000 : 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    code: "ADMIN_RATE_LIMITED",
    message: "Yêu cầu quản trị vượt quá tần suất cho phép!",
  },
});
