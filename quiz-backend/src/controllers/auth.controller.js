import { StatusCodes } from "http-status-codes";
import { authServices } from "../services/auth.service.js";

const register = async (req, res, next) => {
  try {
    const { email, password, name, fullName, studentCode, majorId, classId } =
      req.body;
    const result = await authServices.register({
      email,
      password,
      name,
      fullName,
      studentCode,
      majorId,
      classId,
      req,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message:
        result.message ||
        "Đăng ký tài khoản thành công. Vui lòng kiểm tra mã OTP gửi đến email của bạn.",
      email: result.email,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authServices.verifyEmail({ email, otp, req });
    res.status(StatusCodes.OK).json({
      message: result.message || "Xác minh email thành công!",
    });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authServices.resendOtp({ email, req });
    res.status(StatusCodes.OK).json({
      message: result.message || "Mã xác minh mới đã được gửi.",
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userInfo = await authServices.login({ email, password, req });
    res.status(StatusCodes.OK).json({
      message: "Đăng nhập thành công",
      userInfo,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.id || req.jwtDecoded?.id;
    const result = await authServices.logout({ refreshToken, userId, req });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.jwtDecoded?.id;
    const currentRefreshToken = req.headers["x-refresh-token"] || req.query.refreshToken || null;
    const sessions = await authServices.getUserSessions(userId, currentRefreshToken);
    res.status(StatusCodes.OK).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.jwtDecoded?.id;
    const result = await authServices.revokeSession(userId, id, req);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const revokeOtherSessions = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.id || req.jwtDecoded?.id;
    const result = await authServices.revokeOtherSessions(userId, refreshToken, req);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = await authServices.refreshToken(refreshToken);

    res.status(StatusCodes.OK).json({
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userInfo = await authServices.getProfile(req.jwtDecoded);
    res.status(StatusCodes.OK).json(userInfo);
  } catch (error) {
    next(error);
  }
};

const updateStudentClass = async (req, res, next) => {
  try {
    const { classId } = req.body;
    const userId = req.user?.id || req.jwtDecoded?.id;
    const updated = await authServices.updateStudentClass(userId, classId);
    res.status(StatusCodes.OK).json({
      message: "Cập nhật lớp học thành công!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  register,
  verifyEmail,
  resendOtp,
  login,
  logout,
  getSessions,
  revokeSession,
  revokeOtherSessions,
  refreshToken,
  freshToken: refreshToken,
  getProfile,
  profile: getProfile,
  updateStudentClass,
};
