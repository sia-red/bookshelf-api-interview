import express, { type Express } from 'express';
import { API_PREFIX, MAX_JSON_BODY_BYTES } from './config/constants.js';
import { errorHandler } from './core/http/error-handler.js';
import { notFoundHandler } from './core/http/not-found-handler.js';
import { requestContext } from './core/http/request-context.js';
import type { Logger } from './core/logger/logger.js';
import { bookRoutes } from './features/book/book.routes.js';

export function buildApp(logger: Logger): Express {
  const app = express();
  app.disable('x-powered-by');

  // First, so everything downstream — body parsing included — runs with a request id available.
  app.use(requestContext(logger));
  app.use(express.json({ limit: MAX_JSON_BODY_BYTES }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(`${API_PREFIX}/book`, bookRoutes());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
