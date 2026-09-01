import type { ErrorRequestHandler, Request } from 'express';
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES, type ErrorCode } from '../errors/error-codes.js';
import type { ApiErrorResponse } from './response.types.js';

const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_CLIENT_ERROR_MAX = 499;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_SERVER_ERROR_MIN = 500;

interface FrameworkError {
  statusCode?: unknown;
  status?: unknown;
  type?: unknown;
}

interface ResolvedError {
  status: number;
  body: ApiErrorResponse;
}

function errorBody(code: ErrorCode, message: string, details?: unknown): ApiErrorResponse {
  return {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
}

/**
 * The status the FRAMEWORK already decided, when what it decided is a client error.
 *
 * Only 4xx is honoured. A 5xx on a non-`AppError` is a genuine server fault and keeps the generic
 * 500 — the point is to stop reporting the caller's own malformed request as our failure, not to let
 * any thrown object choose its status.
 */
function clientErrorStatus(error: unknown): number | undefined {
  const candidate = error as FrameworkError;
  const raw = candidate.statusCode ?? candidate.status;
  if (typeof raw !== 'number' || !Number.isInteger(raw)) return undefined;
  if (raw < HTTP_CLIENT_ERROR_MIN || raw > HTTP_CLIENT_ERROR_MAX) return undefined;
  return raw;
}

function resolveError(error: unknown): ResolvedError {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: errorBody(error.code, error.message, error.details),
    };
  }

  const status = clientErrorStatus(error);
  if (status !== undefined) {
    const tooLarge = status === HTTP_PAYLOAD_TOO_LARGE;
    // The framework's own reason (`entity.parse.failed`, `entity.too.large`, …) so a client can tell a
    // truncated body from an unsupported content type. Never its message: that one quotes the request back.
    const reason = (error as FrameworkError).type;
    return {
      status,
      body: errorBody(
        tooLarge ? ERROR_CODES.PAYLOAD_TOO_LARGE : ERROR_CODES.BAD_REQUEST,
        tooLarge
          ? 'The request body is larger than this endpoint accepts.'
          : 'The request could not be read as sent.',
        typeof reason === 'string' ? { reason } : undefined,
      ),
    };
  }

  return {
    status: 500,
    body: errorBody(ERROR_CODES.INTERNAL_ERROR, 'Something went wrong. Please retry.'),
  };
}

// A rejected request is not automatically a fault of ours: a 4xx is the caller being told what is
// wrong with their request, and logging every 404 at error level buries the ones that are ours.
function logFailure(req: Request, status: number, error: unknown): void {
  const logger = req.ctx?.logger;
  if (!logger) return;

  const meta = {
    requestId: req.ctx.requestId,
    method: req.method,
    path: req.path,
    status,
    error: error instanceof Error ? error.message : String(error),
  };

  if (status >= HTTP_SERVER_ERROR_MIN) {
    logger.error('Request failed', {
      ...meta,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return;
  }
  logger.warn('Request rejected', meta);
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const { status, body } = resolveError(error);
  logFailure(req, status, error);
  res.status(status).json(body);
};
