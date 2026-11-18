/**
 * Định nghĩa riêng một Class ApiError kế thừa class Error
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = [], code = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;