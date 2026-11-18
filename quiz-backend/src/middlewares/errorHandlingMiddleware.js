import { StatusCodes } from 'http-status-codes'
import { env } from '../config/environment.js'

// Middleware xử lý lỗi tập trung trong ứng dụng Back-end NodeJS (ExpressJS)
export const errorHandlingMiddleware = (err, req, res, next) => {
  // Đảm bảo err luôn là một object để tránh lỗi TypeError khi gán thuộc tính
  if (!err || typeof err !== 'object') {
    err = {
      statusCode: typeof err === 'number' ? err : StatusCodes.INTERNAL_SERVER_ERROR,
      message: typeof err === 'string' ? err : 'Unknown Error'
    }
  }

  // Xử lý các lỗi từ Prisma Client (nếu có)
  if (err.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientValidationError') {
    if (!err.statusCode) err.statusCode = StatusCodes.BAD_REQUEST
  }

  // Nếu dev không cẩn thận thiếu statusCode thì mặc định sẽ để code 500 INTERNAL_SERVER_ERROR
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR

  // Tạo ra một biến responseError để kiểm soát những gì muốn trả về
  const responseError = {
    statusCode: err.statusCode,
    message: err.message || StatusCodes[err.statusCode],
    code: err.code || null,
    errors: err.errors || [],
    stack: err.stack
  }

  // Chỉ khi môi trường là DEV thì mới trả về Stack Trace để debug dễ dàng hơn, còn không thì xóa đi.
  if (env.BUILD_MODE !== 'development') delete responseError.stack

  // Trả responseError về phía Front-end
  res.status(responseError.statusCode).json(responseError)
}