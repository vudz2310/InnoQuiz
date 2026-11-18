import { StatusCodes } from 'http-status-codes'
import { JwtToken } from '../providers/JwtProviders.js'
import ApiError from '../utils/ApiError.js'
import { env } from '../utils/constants.js'

const authenticationUser = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1]

    if (!accessToken) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (Token not found)'))
    }
    const user = await JwtToken.verifyToken(accessToken, env.SECRETKEY_ACCESSTOKEN)
    if (!user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (Invalid token)'))
    }

    req.jwtDecoded = user
    req.user = user

    next()
  } catch (error) {
    if (error.message?.includes('jwt expired')) {
      return next(new ApiError(StatusCodes.GONE, 'Token của bạn đã hết hạn', [], 'TOKEN_EXPIRED'))
    }
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! Vui lòng đăng nhập'))
  }
}

const optionalAuth = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1]
    if (accessToken) {
      const user = await JwtToken.verifyToken(accessToken, env.SECRETKEY_ACCESSTOKEN)
      if (user) {
        req.jwtDecoded = user
        req.user = user
      }
    }
  } catch (err) {
    // Ignore invalid/expired token for public/optional routes
  }
  next()
}

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ApiError(StatusCodes.UNAUTHORIZED, "Vui lòng đăng nhập để tiếp tục!", [], "UNAUTHORIZED")
      );
    }
    const userRole = (req.user.role || "").toUpperCase();
    const normalizedRole = userRole === "USER" ? "STUDENT" : userRole;

    const matched = allowedRoles
      .map((r) => r.toUpperCase())
      .includes(normalizedRole);

    if (!matched) {
      return next(
        new ApiError(
          StatusCodes.FORBIDDEN,
          "Bạn không có quyền truy cập chức năng này!",
          [],
          "FORBIDDEN"
        )
      );
    }
    next();
  };
};

export const authMiddleware = { authenticationUser, optionalAuth, requireRole };
export const authMiddleWare = authMiddleware;
export const verifyToken = authenticationUser;
export { optionalAuth, requireRole };

