import { buildApp } from './app.js';
import { createContainer } from './bootstrap/container.js';
import { seedFixtures } from './bootstrap/seed.js';
import { loadEnvironment } from './config/environment.js';
import { createLogger } from './core/logger/logger.js';
import { initializePersistence } from './core/persistence/store-factory.js';

function start(): void {
  const { PORT, LOG_LEVEL, NODE_ENV } = loadEnvironment();
  const logger = createLogger(LOG_LEVEL);

  const store = initializePersistence();
  seedFixtures(store);
  createContainer(logger);

  const app = buildApp(logger);
  const server = app.listen(PORT, () => {
    logger.info(`bookshelf-api-interview listening on http://localhost:${PORT} (${NODE_ENV})`);
  });

  const shutdown = (): void => {
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
