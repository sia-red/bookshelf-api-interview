import type { ErrorCode } from './error-codes.js';
import { ERROR_CODES } from './error-codes.js';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(code: ErrorCode, message: string, details?: unknown): AppError {
    return new AppError(400, code, message, details);
  }

  static notFound(code: ErrorCode, message: string): AppError {
    return new AppError(404, code, message);
  }

  static conflict(code: ErrorCode, message: string, details?: unknown): AppError {
    return new AppError(409, code, message, details);
  }

  static internal(message: string, details?: unknown): AppError {
    return new AppError(500, ERROR_CODES.INTERNAL_ERROR, message, details);
  }
}
