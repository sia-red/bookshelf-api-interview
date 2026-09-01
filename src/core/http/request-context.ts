import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { Logger } from '../logger/logger.js';

export interface RequestContext {
  requestId: string;
  logger: Logger;
}

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestContext(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const incoming = req.header(REQUEST_ID_HEADER);
    const requestId = incoming && incoming.length > 0 ? incoming : randomUUID();

    req.ctx = { requestId, logger };
    req.valid = {};
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  };
}
