import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

export const notFoundHandler: RequestHandler = (req) => {
  throw AppError.notFound(
    ERROR_CODES.ROUTE_NOT_FOUND,
    `Route ${req.method} ${req.path} does not exist`,
  );
};
