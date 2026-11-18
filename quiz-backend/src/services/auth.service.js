import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/DB.js";
import bcrypt from "bcrypt";
import { JwtToken } from "../providers/JwtProviders.js";
import { env } from "../utils/constants.js";
import ApiError from "../utils/ApiError.js";
import { otpService } from "./otp.service.js";
import { sessionService } from "./session.service.js";
import { recordSecurityEvent } from "./security.service.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async ({
  email,
  password,
  name,
  fullName,
  studentCode,
  majorId,
  classId,
  req,
}) => {
  const resolvedName = (fullName || name || "").trim();
  if (!resolvedName) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Họ và tên không hợp lệ hoặc bị thiếu!",
      [],
      "INVALID_NAME"
    );
  }

  // 1. Mã sinh viên bắt buộc, lưu dạng chuỗi, không làm mất số 0 ở đầu
  const cleanStudentCode =
    studentCode !== undefined && studentCode !== null
      ? String(studentCode).trim()
      : "";

  if (!cleanStudentCode) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Vui lòng nhập mã sinh viên.",
      [],
      "MISSING_STUDENT_CODE"
    );
  }

  // 2. Email kiểm tra định dạng
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Địa chỉ email không đúng định dạng!",
      [],
      "INVALID_EMAIL"
    );
  }

  // 3. Mật khẩu tối thiểu 6 ký tự
  if (!password || typeof password !== "string" || password.length < 6) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mật khẩu phải có ít nhất 6 ký tự!",
      [],
      "WEAK_PASSWORD"
    );
  }

  // 4. Ngành học là bắt buộc
  if (!majorId || typeof majorId !== "string" || !majorId.trim()) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Vui lòng chọn ngành học.",
      [],
      "MISSING_MAJOR"
    );
  }

  const major = await prisma.major.findUnique({
    where: { id: majorId.trim() },
  });

  if (!major || major.status !== "ACTIVE" || !major.allowRegistration) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Ngành học đã chọn không tồn tại hoặc tạm thời không cho phép đăng ký.",
      [],
      "INVALID_MAJOR"
    );
  }

  // 5. Lớp học là tùy chọn (nếu có phải thuộc ngành đã chọn)
  let validClassId = null;
  if (classId && typeof classId === "string" && classId.trim()) {
    const academicClass = await prisma.academicClass.findUnique({
      where: { id: classId.trim() },
    });

    if (
      !academicClass ||
      academicClass.status !== "ACTIVE" ||
      !academicClass.allowRegistration
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Lớp học không tồn tại hoặc đã ngừng hoạt động.",
        [],
        "INVALID_CLASS"
      );
    }

    if (academicClass.majorId !== major.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Lớp học không thuộc ngành đã chọn.",
        [],
        "CLASS_NOT_IN_MAJOR"
      );
    }

    validClassId = academicClass.id;
  }

  const cleanEmail = email.trim().toLowerCase();

  // 6. Kiểm tra trùng mã sinh viên
  const existingByStudentCode = await prisma.user.findFirst({
    where: { studentCode: cleanStudentCode },
  });

  // Kiểm tra tài khoản đã tồn tại qua email
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingByStudentCode) {
    if (
      !existingUser ||
      existingByStudentCode.id !== existingUser.id ||
      existingByStudentCode.emailVerified
    ) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        `Mã sinh viên "${cleanStudentCode}" đã được đăng ký trên hệ thống. Vui lòng kiểm tra lại mã sinh viên hoặc đăng nhập!`,
        [],
        "STUDENT_CODE_EXISTS"
      );
    }
  }

  const hashPassword = await bcrypt.hash(password, 10);
  let targetUserId;

  if (existingUser) {
    if (existingUser.emailVerified) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        `Địa chỉ email ${cleanEmail} đã được đăng ký và xác minh trước đó. Vui lòng đăng nhập!`,
        [],
        "EMAIL_ALREADY_REGISTERED"
      );
    }

    // Nếu tài khoản chưa xác minh email (pending user) -> cập nhật thông tin và cấp lại OTP mới
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: resolvedName,
        studentCode: cleanStudentCode,
        majorId: major.id,
        classId: validClassId,
        password: hashPassword,
        role: "STUDENT",
      },
    });
    targetUserId = updatedUser.id;
  } else {
    // Tạo mới tài khoản STUDENT ở trạng thái chưa kích hoạt (emailVerified: false)
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashPassword,
        name: resolvedName,
        studentCode: cleanStudentCode,
        majorId: major.id,
        classId: validClassId,
        avatar: "",
        role: "STUDENT",
        emailVerified: false,
      },
    });
    targetUserId = newUser.id;
  }

  // Tạo và gửi OTP 6 số qua email
  await otpService.createVerificationOtp(targetUserId, cleanEmail, resolvedName);

  // Ghi nhận sự kiện Đăng ký & Gửi OTP
  recordSecurityEvent({
    req,
    userId: targetUserId,
    userEmail: cleanEmail,
    eventType: "REGISTER",
    details: { majorId: major.id, studentCode: cleanStudentCode },
  });
  recordSecurityEvent({
    req,
    userId: targetUserId,
    userEmail: cleanEmail,
    eventType: "OTP_SENT",
  });

  return {
    message: "Mã xác minh OTP đã được gửi đến email của bạn.",
    email: cleanEmail,
  };
};

const verifyEmail = async ({ email, otp, req }) => {
  try {
    const res = await otpService.verifyOtp(email, otp);
    recordSecurityEvent({
      req,
      userEmail: email,
      eventType: "OTP_VERIFIED",
    });
    return res;
  } catch (err) {
    recordSecurityEvent({
      req,
      userEmail: email,
      eventType: "OTP_FAILED",
      riskLevel: "MEDIUM",
      riskScore: 35,
      httpStatus: 400,
    });
    throw err;
  }
};

const resendOtp = async ({ email, req }) => {
  const res = await otpService.resendOtp(email);
  recordSecurityEvent({
    req,
    userEmail: email,
    eventType: "OTP_SENT",
  });
  return res;
};

const login = async ({ email, password, req }) => {
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Email không hợp lệ hoặc bị thiếu!",
      [],
      "INVALID_EMAIL"
    );
  }
  if (!password) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Mật khẩu không được để trống!",
      [],
      "MISSING_PASSWORD"
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: {
      major: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      academicClass: {
        select: {
          id: true,
          code: true,
          name: true,
          cohort: true,
        },
      },
    },
  });

  if (!user) {
    recordSecurityEvent({
      req,
      userEmail: cleanEmail,
      eventType: "LOGIN_FAILED",
      riskLevel: "MEDIUM",
      riskScore: 40,
      httpStatus: 401,
      details: { reason: "User not found" },
    });

    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Tài khoản hoặc mật khẩu không chính xác!",
      [],
      "INVALID_CREDENTIALS"
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    recordSecurityEvent({
      req,
      userId: user.id,
      userEmail: cleanEmail,
      eventType: "LOGIN_FAILED",
      riskLevel: "MEDIUM",
      riskScore: 45,
      httpStatus: 401,
      details: { reason: "Incorrect password" },
    });

    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Tài khoản hoặc mật khẩu không chính xác!",
      [],
      "INVALID_CREDENTIALS"
    );
  }

  // Kiểm tra tài khoản bị khóa
  if (user.status === "BLOCKED" || user.status === "INACTIVE") {
    recordSecurityEvent({
      req,
      userId: user.id,
      userEmail: cleanEmail,
      eventType: "ACCESS_DENIED",
      riskLevel: "HIGH",
      riskScore: 75,
      httpStatus: 403,
      details: { reason: `Account status is ${user.status}` },
    });

    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ ban quản trị!",
      [],
      "ACCOUNT_BLOCKED"
    );
  }

  // BẮT BUỘC: Kiểm tra trạng thái xác minh email
  if (!user.emailVerified) {
    recordSecurityEvent({
      req,
      userId: user.id,
      userEmail: cleanEmail,
      eventType: "LOGIN_FAILED",
      riskLevel: "LOW",
      riskScore: 20,
      httpStatus: 403,
      details: { reason: "Email not verified" },
    });

    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Email của bạn chưa được xác minh. Vui lòng nhập mã OTP để kích hoạt tài khoản!",
      [{ email: user.email }],
      "EMAIL_NOT_VERIFIED"
    );
  }

  // Chuẩn hóa role cho token payload: USER -> STUDENT nếu còn sót
  const normalizedRole = user.role === "USER" ? "STUDENT" : user.role;

  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    studentCode: user.studentCode || "",
    role: normalizedRole,
    avatar: user.avatar || "",
    majorId: user.majorId || null,
    classId: user.classId || null,
  };

  const accessToken = await JwtToken.generateAccessToken(
    tokenPayload,
    env.SECRETKEY_ACCESSTOKEN,
    env.ACCESS_TOKEN_LIFE || "2h",
  );
  const refreshToken = await JwtToken.generateAccessToken(
    tokenPayload,
    env.SECRETKEY_REFRESHTOKEN,
    env.REFRESH_TOKEN_LIFE || "14d",
  );

  // Tạo bản ghi UserSession
  await sessionService.createSession({
    userId: user.id,
    refreshToken,
    req,
  });

  // Ghi nhận sự kiện Đăng nhập thành công
  recordSecurityEvent({
    req,
    userId: user.id,
    userEmail: cleanEmail,
    eventType: "LOGIN_SUCCESS",
    riskLevel: "LOW",
    riskScore: 0,
    httpStatus: 200,
  });

  const userInfo = {
    id: user.id,
    email: user.email,
    name: user.name,
    studentCode: user.studentCode,
    role: normalizedRole,
    avatar: user.avatar || "",
    status: user.status,
    majorId: user.majorId,
    classId: user.classId,
    major: user.major,
    academicClass: user.academicClass,
    accessToken,
    refreshToken,
  };

  return userInfo;
};

const logout = async ({ refreshToken, userId, req }) => {
  if (refreshToken) {
    await sessionService.revokeCurrentSession(refreshToken);
  }
  if (userId) {
    recordSecurityEvent({
      req,
      userId,
      eventType: "LOGOUT",
    });
  }
  return { message: "Đăng xuất thành công" };
};

const getUserSessions = async (userId, currentRefreshToken) => {
  return await sessionService.getUserSessions(userId, currentRefreshToken);
};

const revokeSession = async (userId, sessionId, req) => {
  const res = await sessionService.revokeSession(userId, sessionId);
  recordSecurityEvent({
    req,
    userId,
    eventType: "SESSION_REVOKED",
    details: { sessionId },
  });
  return res;
};

const revokeOtherSessions = async (userId, currentRefreshToken, req) => {
  const res = await sessionService.revokeOtherSessions(userId, currentRefreshToken);
  recordSecurityEvent({
    req,
    userId,
    eventType: "SESSION_REVOKED",
    details: { allOthers: true },
  });
  return res;
};

const refreshToken = async (token) => {
  if (!token) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Vui lòng cung cấp RefreshToken",
      [],
      "MISSING_TOKEN"
    );
  }
  try {
    const userInfo = await JwtToken.verifyToken(
      token,
      env.SECRETKEY_REFRESHTOKEN
    );
    if (!userInfo) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "RefreshToken hết hạn hoặc không hợp lệ",
        [],
        "INVALID_TOKEN"
      );
    }

    // Lấy thông tin mới nhất từ DB
    const freshUser = await prisma.user.findUnique({
      where: { id: userInfo.id },
    });

    const role =
      (freshUser?.role === "USER" ? "STUDENT" : freshUser?.role) ||
      userInfo.role;

    const tokenPayload = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      studentCode: freshUser?.studentCode || userInfo.studentCode || "",
      role,
      avatar: userInfo.avatar || "",
      majorId: freshUser?.majorId || userInfo.majorId || null,
      classId: freshUser?.classId || userInfo.classId || null,
    };

    const accessToken = await JwtToken.generateAccessToken(
      tokenPayload,
      env.SECRETKEY_ACCESSTOKEN,
      env.ACCESS_TOKEN_LIFE || "2h",
    );
    return accessToken;
  } catch (error) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "RefreshToken hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại",
      [],
      "INVALID_TOKEN"
    );
  }
};

const getProfile = async (jwtDecoded) => {
  if (!jwtDecoded?.id) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Vui lòng đăng nhập để thực hiện chức năng này",
      [],
      "UNAUTHORIZED"
    );
  }
  const user = await prisma.user.findUnique({
    where: { id: jwtDecoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      studentCode: true,
      avatar: true,
      role: true,
      status: true,
      majorId: true,
      classId: true,
      emailVerified: true,
      createdAt: true,
      major: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      academicClass: {
        select: {
          id: true,
          code: true,
          name: true,
          cohort: true,
        },
      },
    },
  });
  if (!user) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Tài khoản người dùng không tồn tại",
      [],
      "USER_NOT_FOUND"
    );
  }

  return {
    ...user,
    role: user.role === "USER" ? "STUDENT" : user.role,
  };
};

/**
 * Sinh viên tự bổ sung lớp vào hồ sơ khi classId đang trống
 */
const updateStudentClass = async (userId, classId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, majorId: true, classId: true, role: true },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy người dùng!");
  }

  if (user.classId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Bạn đã được gán lớp. Việc chuyển lớp do Quản trị viên thực hiện!",
      [],
      "CLASS_ALREADY_ASSIGNED"
    );
  }

  if (!classId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Vui lòng chọn lớp học muốn bổ sung!",
      [],
      "MISSING_CLASS_ID"
    );
  }

  const academicClass = await prisma.academicClass.findUnique({
    where: { id: classId },
  });

  if (
    !academicClass ||
    academicClass.status !== "ACTIVE" ||
    !academicClass.allowRegistration
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Lớp học không tồn tại hoặc đã ngừng hoạt động.",
      [],
      "INVALID_CLASS"
    );
  }

  if (user.majorId && academicClass.majorId !== user.majorId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Lớp học không thuộc ngành học của bạn!",
      [],
      "CLASS_NOT_IN_MAJOR"
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { classId: academicClass.id },
    select: {
      id: true,
      name: true,
      studentCode: true,
      majorId: true,
      classId: true,
      academicClass: {
        select: { id: true, code: true, name: true, cohort: true },
      },
    },
  });

  return updatedUser;
};

export const authServices = {
  register,
  verifyEmail,
  resendOtp,
  login,
  logout,
  refreshToken,
  getProfile,
  updateStudentClass,
  getUserSessions,
  revokeSession,
  revokeOtherSessions,
};
